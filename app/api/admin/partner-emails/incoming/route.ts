import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean; userId?: string; role?: UserRole }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session) {
    return { authorized: false };
  }

  // Superadmin always has access
  if (session.role === 'superadmin') {
    return { authorized: true, userId: session.userId, role: session.role };
  }

  // Check if user has canSendEmails permission for any tournament
  try {
    const { getStaffTournamentAccess } = await import('@/lib/tournaments');
    const staffAccess = await getStaffTournamentAccess(undefined, session.userId);
    const hasEmailPermission = staffAccess.some(access => access.canSendEmails);
    
    if (hasEmailPermission) {
      return { authorized: true, userId: session.userId, role: session.role };
    }
  } catch (error) {
    console.error('Error checking staff access:', error);
  }

  return { authorized: false };
}

export async function GET(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const fromEmail = searchParams.get('from');
    const unreadOnly = searchParams.get('unread') === 'true';
    const sync = searchParams.get('sync') === 'true'; // Флаг для синхронизации с Resend API

    const pool = getDbPool();
    
    // Если запрошена синхронизация, получаем письма из Resend API
    if (sync) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          console.log('[Incoming Emails Sync] Attempting to sync from Resend API...');
          
          try {
            // Resend API: GET /emails/receiving - список полученных писем из Inbox
            const response = await fetch('https://api.resend.com/emails/receiving', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const apiData = await response.json();
              console.log('[Incoming Emails Sync] API response:', {
                status: response.status,
                hasData: !!apiData.data,
                dataType: Array.isArray(apiData.data) ? 'array' : typeof apiData.data,
                dataLength: Array.isArray(apiData.data) ? apiData.data.length : 'N/A',
              });
              
              // Resend возвращает данные в формате: { data: [...] }
              const emails = apiData.data || (Array.isArray(apiData) ? apiData : []);
              
              if (Array.isArray(emails) && emails.length > 0) {
                console.log(`[Incoming Emails Sync] Found ${emails.length} emails in Resend Inbox`);
                
                // Создаем таблицу, если её нет
                await pool.execute(`
                  CREATE TABLE IF NOT EXISTS incoming_emails (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    resend_id VARCHAR(255) UNIQUE,
                    from_email VARCHAR(255) NOT NULL,
                    to_email VARCHAR(255) NOT NULL,
                    subject VARCHAR(500),
                    html_content TEXT,
                    text_content TEXT,
                    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_at DATETIME NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_from_email (from_email),
                    INDEX idx_received_at (received_at),
                    INDEX idx_read_at (read_at),
                    INDEX idx_resend_id (resend_id)
                  )
                `);
                
                let savedCount = 0;
                let errorCount = 0;
                
                // Для каждого письма получаем полное содержимое через API
                for (const email of emails) {
                  try {
                    const emailId = email.id || email.email_id;
                    if (!emailId) {
                      console.warn('[Incoming Emails Sync] Email without ID, skipping:', email);
                      continue;
                    }
                    
                    // Получаем полное содержимое письма
                    let fullEmailData = email;
                    try {
                      const detailResponse = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${resendApiKey}`,
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      if (detailResponse.ok) {
                        const detailData = await detailResponse.json();
                        fullEmailData = detailData.data || detailData;
                      }
                    } catch (detailError: any) {
                      console.warn(`[Incoming Emails Sync] Could not fetch details for email ${emailId}:`, detailError.message);
                      // Продолжаем с базовыми данными
                    }
                    
                    // Сохраняем письмо в БД
                    await pool.execute(
                      `INSERT INTO incoming_emails 
                       (resend_id, from_email, to_email, subject, html_content, text_content, received_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       html_content = VALUES(html_content),
                       text_content = VALUES(text_content),
                       received_at = VALUES(received_at)`,
                      [
                        emailId,
                        fullEmailData.from || fullEmailData.from_email || fullEmailData.sender || '',
                        Array.isArray(fullEmailData.to) ? fullEmailData.to[0] : (fullEmailData.to || fullEmailData.to_email || fullEmailData.recipient || ''),
                        fullEmailData.subject || fullEmailData.subject_line || '(Без темы)',
                        fullEmailData.html || fullEmailData.html_content || fullEmailData.body_html || '',
                        fullEmailData.text || fullEmailData.text_content || fullEmailData.body_text || fullEmailData.body || '',
                        fullEmailData.created_at || fullEmailData.received_at || fullEmailData.date || new Date().toISOString(),
                      ]
                    );
                    savedCount++;
                  } catch (err: any) {
                    console.error('[Incoming Emails Sync] Error saving email:', err);
                    errorCount++;
                  }
                }
                
                console.log(`[Incoming Emails Sync] Synced ${savedCount} emails, ${errorCount} errors`);
              } else {
                console.log('[Incoming Emails Sync] No emails found in Resend Inbox');
              }
            } else {
              const errorText = await response.text();
              console.error(`[Incoming Emails Sync] API returned ${response.status}:`, errorText);
            }
          } catch (apiError: any) {
            console.error('[Incoming Emails Sync] Error calling Resend API:', apiError);
            console.error('[Incoming Emails Sync] Error details:', {
              message: apiError.message,
              stack: apiError.stack,
            });
          }
        } else {
          console.log('[Incoming Emails Sync] RESEND_API_KEY not configured');
        }
      } catch (syncError: any) {
        console.error('[Incoming Emails Sync] Error during sync:', syncError);
      }
    }
    
    // Создаем таблицу, если её нет
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS incoming_emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resend_id VARCHAR(255) UNIQUE,
        from_email VARCHAR(255) NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        html_content TEXT,
        text_content TEXT,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_from_email (from_email),
        INDEX idx_received_at (received_at),
        INDEX idx_read_at (read_at),
        INDEX idx_resend_id (resend_id)
      )
    `);
    
    // Получаем входящие письма
    console.log('[Incoming Emails GET] Starting fetch from database', {
      page,
      limit,
      fromEmail,
      unreadOnly,
      sync,
    });
    
    let incomingEmails: any[] = [];
    try {
      // Сначала получаем общее количество для пагинации
      let countQuery = 'SELECT COUNT(*) as count FROM incoming_emails WHERE 1=1';
      const countParams: any[] = [];
      
      if (fromEmail) {
        countQuery += ' AND from_email LIKE ?';
        countParams.push(`%${fromEmail}%`);
      }
      if (unreadOnly) {
        countQuery += ' AND read_at IS NULL';
      }
      
      const [countRows] = await pool.execute(countQuery, countParams) as any[];
      const totalCount = countRows[0].count;
      
      // Получаем письма с пагинацией
      let query = `SELECT id, from_email, to_email, subject, html_content, text_content, 
         received_at, read_at, created_at
         FROM incoming_emails 
         WHERE 1=1`;
      const queryParams: any[] = [];
      
      if (fromEmail) {
        query += ' AND from_email LIKE ?';
        queryParams.push(`%${fromEmail}%`);
      }
      if (unreadOnly) {
        query += ' AND read_at IS NULL';
      }
      
      query += ' ORDER BY received_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, (page - 1) * limit);
      
      const [rows] = await pool.execute(query, queryParams) as any[];
      
      console.log('[Incoming Emails GET] Database query result:', {
        rowsCount: rows.length,
        totalCount,
        query,
        queryParams,
      });

      incomingEmails = rows.map((row: any) => ({
        id: row.id,
        from: row.from_email,
        to: row.to_email,
        subject: row.subject,
        html: row.html_content,
        text: row.text_content,
        receivedAt: row.received_at,
        readAt: row.read_at,
        createdAt: row.created_at,
      }));

      console.log('[Incoming Emails GET] Successfully fetched emails:', {
        emailsCount: incomingEmails.length,
        totalCount,
        page,
        limit,
      });

      return NextResponse.json({
        emails: incomingEmails,
        emailsCount: incomingEmails.length,
        pagination: {
          page,
          limit,
          total: totalCount,
        },
      });
    } catch (error: any) {
      console.error('[Incoming Emails GET] Error fetching emails:', error);
      console.error('[Incoming Emails GET] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      return NextResponse.json({
        emails: [],
        emailsCount: 0,
        pagination: {
          page,
          limit,
          total: 0,
        },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    return NextResponse.json({
      emails: incomingEmails,
      emailsCount: incomingEmails.length,
      pagination: {
        page,
        limit,
        total: incomingEmails.length,
      },
    });
  } catch (error: any) {
    console.error('[Incoming Emails] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// Webhook endpoint for receiving emails from Resend
// Этот endpoint должен быть доступен без авторизации для webhook от Resend
// ВАЖНО: POST endpoint НЕ проверяет авторизацию, чтобы Resend мог отправлять webhook
export async function POST(request: NextRequest) {
  // Логируем ВСЕ запросы, даже если они не от Resend
  const url = request.url;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const contentType = request.headers.get('content-type') || '';
  
  console.log('[Incoming Emails Webhook] ===== POST REQUEST RECEIVED =====');
  console.log('[Incoming Emails Webhook] Request info:', {
    url,
    method,
    userAgent,
    contentType,
    timestamp: new Date().toISOString(),
    pathname: new URL(url).pathname,
  });
  
  // Проверяем, приходит ли запрос от Resend
  const resendSignature = request.headers.get('resend-signature') || request.headers.get('x-resend-signature');
  if (!resendSignature) {
    console.warn('[Incoming Emails Webhook] ⚠️ No Resend signature found in headers. This might not be a request from Resend.');
    console.warn('[Incoming Emails Webhook] All headers:', Object.fromEntries(request.headers.entries()));
  } else {
    console.log('[Incoming Emails Webhook] ✅ Resend signature found:', resendSignature.substring(0, 20) + '...');
  }
  
  try {
    console.log('[Incoming Emails Webhook] Request details:', {
      url,
      method,
      pathname: new URL(url).pathname,
      contentType,
      headers: {
        'content-type': contentType,
        'user-agent': request.headers.get('user-agent'),
        'resend-signature': request.headers.get('resend-signature'),
        'x-resend-signature': request.headers.get('x-resend-signature'),
        'host': request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'origin': request.headers.get('origin'),
      },
    });
    
    // Проверяем content-type
    if (!contentType.includes('application/json')) {
      console.warn('[Incoming Emails Webhook] Unexpected content-type:', contentType);
    }
    
    // Парсим body с обработкой ошибок
    let body: any;
    let bodyText: string = '';
    try {
      bodyText = await request.text();
      console.log('[Incoming Emails Webhook] Raw body (first 500 chars):', bodyText.substring(0, 500));
      console.log('[Incoming Emails Webhook] Raw body length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('[Incoming Emails Webhook] Empty body received');
        return NextResponse.json({ 
          error: 'Empty request body',
          success: false
        }, { status: 400 });
      }
      
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error('[Incoming Emails Webhook] Error parsing JSON:', parseError);
      console.error('[Incoming Emails Webhook] Body that failed to parse (first 1000 chars):', bodyText.substring(0, 1000));
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: process.env.NODE_ENV === 'development' ? parseError.message : undefined,
        success: false
      }, { status: 400 });
    }
    
    console.log('[Incoming Emails Webhook] Received webhook:', JSON.stringify(body, null, 2));
    
    // Verify webhook signature if configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('resend-signature') || request.headers.get('x-resend-signature');
      // TODO: Verify signature using webhookSecret
      // For now, we'll just log it
      if (signature) {
        console.log('[Incoming Emails Webhook] Signature received:', signature);
      }
    }

    // Resend sends webhooks in format: { type: "email.received", data: { ... } }
    // Проверяем структуру данных от Resend
    let emailData = body;
    
    // Если формат с оберткой { type, data }
    if (body.type && body.data) {
      emailData = body.data;
    }
    
    // Если данные вложены глубже (например, body.data.data)
    if (emailData && emailData.data && typeof emailData.data === 'object') {
      emailData = emailData.data;
    }

    // Extract email information - Resend Inbox format
    // Resend отправляет данные в формате:
    // {
    //   type: "email.received",
    //   data: {
    //     id: "...",
    //     from: "...",
    //     to: ["..."],
    //     subject: "...",
    //     html: "...",
    //     text: "...",
    //     created_at: "..."
    //   }
    // }
    const emailId = emailData.id || emailData.message_id || emailData.email_id || emailData.emailId || `webhook-${Date.now()}`;
    
    // Resend Inbox использует поле "from" для отправителя
    const fromEmail = emailData.from || emailData.from_email || emailData.sender || emailData.fromAddress || '';
    
    // Resend Inbox использует массив "to" для получателей
    let toEmail = '';
    if (Array.isArray(emailData.to)) {
      toEmail = emailData.to[0] || '';
    } else if (emailData.to) {
      toEmail = emailData.to;
    } else {
      toEmail = emailData.to_email || emailData.recipient || emailData.toAddress || '';
    }
    
    const subject = emailData.subject || emailData.subject_line || '(Без темы)';
    
    // Resend Inbox предоставляет html и text содержимое
    const htmlContent = emailData.html || emailData.html_content || emailData.body_html || emailData.htmlBody || '';
    const textContent = emailData.text || emailData.text_content || emailData.body_text || emailData.body || emailData.textBody || '';
    
    // Время получения письма
    const receivedAt = emailData.created_at || emailData.received_at || emailData.timestamp || emailData.date || new Date().toISOString();

    console.log('[Incoming Emails Webhook] Parsed data:', {
      emailId,
      fromEmail,
      toEmail,
      subject,
      hasHtml: !!htmlContent,
      hasText: !!textContent,
    });

    // Store incoming email in database
    const pool = getDbPool();
    
    // Create table if it doesn't exist
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS incoming_emails (
          id INT AUTO_INCREMENT PRIMARY KEY,
          resend_id VARCHAR(255) UNIQUE,
          from_email VARCHAR(255) NOT NULL,
          to_email VARCHAR(255) NOT NULL,
          subject VARCHAR(500),
          html_content TEXT,
          text_content TEXT,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_from_email (from_email),
          INDEX idx_received_at (received_at),
          INDEX idx_read_at (read_at),
          INDEX idx_resend_id (resend_id)
        )
      `);
      console.log('[Incoming Emails Webhook] Table check/creation completed');
    } catch (tableError: any) {
      console.error('[Incoming Emails Webhook] Error creating/checking table:', tableError);
      // Продолжаем выполнение, возможно таблица уже существует
    }

    // Валидация данных перед сохранением
    if (!fromEmail || !toEmail) {
      console.error('[Incoming Emails Webhook] Missing required fields:', { 
        fromEmail, 
        toEmail,
        rawBody: JSON.stringify(body, null, 2),
        emailData: JSON.stringify(emailData, null, 2)
      });
      return NextResponse.json({ 
        error: 'Missing required fields: fromEmail or toEmail',
        receivedData: { emailId, fromEmail, toEmail, subject },
        debug: process.env.NODE_ENV === 'development' ? {
          body,
          emailData
        } : undefined
      }, { status: 400 });
    }

    // Insert incoming email
    try {
      const [result] = await pool.execute(
        `INSERT INTO incoming_emails 
         (resend_id, from_email, to_email, subject, html_content, text_content, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         html_content = VALUES(html_content),
         text_content = VALUES(text_content),
         received_at = VALUES(received_at)`,
        [
          emailId,
          fromEmail,
          toEmail,
          subject,
          htmlContent,
          textContent,
          receivedAt,
        ]
      ) as any[];

      const insertId = result?.insertId || 'unknown';
      console.log('[Incoming Emails Webhook] ===== EMAIL SAVED SUCCESSFULLY =====');
      console.log('[Incoming Emails Webhook] Saved email:', {
        emailId,
        insertId,
        fromEmail,
        toEmail,
        subject,
        htmlLength: htmlContent?.length || 0,
        textLength: textContent?.length || 0,
      });

      // Возвращаем успешный ответ сразу, чтобы Resend не повторял запрос
      return NextResponse.json({ 
        success: true, 
        emailId,
        insertId,
        message: 'Email received and saved'
      }, { status: 200 });
    } catch (dbError: any) {
      console.error('[Incoming Emails Webhook] ===== DATABASE ERROR =====');
      console.error('[Incoming Emails Webhook] Database error details:', {
        message: dbError.message,
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        stack: dbError.stack,
      });
      
      // Возвращаем ошибку, но с кодом 200, чтобы Resend не повторял запрос
      // (если это временная ошибка, можно вернуть 500)
      return NextResponse.json({ 
        success: false,
        error: 'Database error while saving email',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        emailId,
      }, { status: 200 }); // Используем 200, чтобы Resend не повторял
    }
  } catch (error: any) {
    console.error('[Incoming Emails Webhook] ===== UNEXPECTED EXCEPTION =====');
    console.error('[Incoming Emails Webhook] Exception type:', error?.constructor?.name);
    console.error('[Incoming Emails Webhook] Exception message:', error?.message);
    console.error('[Incoming Emails Webhook] Exception stack:', error?.stack);
    console.error('[Incoming Emails Webhook] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Возвращаем ошибку, но с кодом 200, чтобы Resend не повторял запрос бесконечно
    // В production лучше логировать и возвращать 200, чтобы не засорять логи Resend
    return NextResponse.json({ 
      success: false,
      error: error?.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 200 }); // Используем 200 вместо 500, чтобы Resend не повторял запрос
  }
}

