import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
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

export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      emailId, // ID отправленного письма для копирования
      to, // Новый получатель
      subject, // Новая тема (опционально)
      html, // HTML содержимое (если нужно изменить)
      from, // От кого (опционально)
      locale = 'en',
    } = body;

    if (!to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    let emailHtml = html;
    let emailSubject = subject;

    // Если передан emailId, получаем оригинальное письмо из базы данных
    if (emailId && !html) {
      const pool = getDbPool();
      
      const [rows] = await pool.execute(
        `SELECT html_content, subject FROM sent_emails 
         WHERE id = ? OR resend_id = ? 
         LIMIT 1`,
        [emailId, emailId]
      ) as any[];
      
      if (rows.length === 0) {
        return NextResponse.json({ 
          error: 'Email not found' 
        }, { status: 404 });
      }

      emailHtml = rows[0].html_content || '';
      emailSubject = subject || rows[0].subject || '';
    }

    if (!emailHtml) {
      return NextResponse.json({ error: 'Email content is required' }, { status: 400 });
    }

    // Отправляем письмо
    const success = await sendEmail({
      to,
      subject: emailSubject,
      html: emailHtml,
      from,
      locale,
    });

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully' 
    });
  } catch (error: any) {
    console.error('[Resend Email] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

