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

    // Resend doesn't have a direct API for incoming emails
    // We'll need to store incoming emails in database via webhook
    // For now, we'll check if we have a table for incoming emails
    const pool = getDbPool();
    
    // Check if incoming_emails table exists, if not return empty array
    let incomingEmails: any[] = [];
    try {
      const [rows] = await pool.execute(
        `SELECT id, from_email, to_email, subject, html_content, text_content, 
         received_at, read_at, created_at
         FROM incoming_emails 
         WHERE 1=1
         ${fromEmail ? 'AND from_email LIKE ?' : ''}
         ${unreadOnly ? 'AND read_at IS NULL' : ''}
         ORDER BY received_at DESC 
         LIMIT ? OFFSET ?`,
        fromEmail 
          ? [`%${fromEmail}%`, limit, (page - 1) * limit]
          : [limit, (page - 1) * limit]
      ) as any[];

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
    } catch (error: any) {
      // Table doesn't exist yet, return empty array
      console.log('[Incoming Emails] Table not found, returning empty array');
    }

    return NextResponse.json({
      emails: incomingEmails,
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
export async function POST(request: NextRequest) {
  try {
    // Логируем полную информацию о запросе для отладки
    const url = request.url;
    const method = request.method;
    console.log('[Incoming Emails Webhook] Request received:', {
      url,
      method,
      pathname: new URL(url).pathname,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        'resend-signature': request.headers.get('resend-signature'),
        'host': request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
      },
    });
    
    const body = await request.json();
    
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
        fromEmail,
        toEmail,
        subject,
        htmlContent,
        textContent,
        receivedAt,
      ]
    );

    console.log('[Incoming Emails Webhook] Email saved successfully:', emailId);

    // Возвращаем успешный ответ сразу, чтобы Resend не повторял запрос
    return NextResponse.json({ 
      success: true, 
      emailId,
      message: 'Email received and saved'
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Incoming Emails Webhook] Exception:', error);
    console.error('[Incoming Emails Webhook] Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

