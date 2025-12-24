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
    const toEmail = searchParams.get('to');

    // Resend API doesn't have a list method for sent emails
    // We'll get sent emails from our database where we store them
    const pool = getDbPool();
    
    // Create table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sent_emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resend_id VARCHAR(255) UNIQUE,
        from_email VARCHAR(255) NOT NULL,
        to_email TEXT NOT NULL,
        subject VARCHAR(500),
        html_content TEXT,
        text_content TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_from_email (from_email),
        INDEX idx_sent_at (sent_at),
        INDEX idx_resend_id (resend_id)
      )
    `);

    // Build query with filters
    let query = `SELECT id, resend_id, from_email, to_email, subject, html_content, text_content, sent_at, created_at
                 FROM sent_emails 
                 WHERE 1=1`;
    const params: any[] = [];
    
    if (fromEmail) {
      query += ' AND from_email LIKE ?';
      params.push(`%${fromEmail}%`);
    }
    
    if (toEmail) {
      query += ' AND to_email LIKE ?';
      params.push(`%${toEmail}%`);
    }
    
    query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params) as any[];

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM sent_emails WHERE 1=1`;
    const countParams: any[] = [];
    
    if (fromEmail) {
      countQuery += ' AND from_email LIKE ?';
      countParams.push(`%${fromEmail}%`);
    }
    
    if (toEmail) {
      countQuery += ' AND to_email LIKE ?';
      countParams.push(`%${toEmail}%`);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams) as any[];
    const total = countRows[0]?.total || 0;

    const emails = rows.map((row: any) => ({
      id: row.id,
      resend_id: row.resend_id,
      from: row.from_email,
      to: row.to_email.split(',').map((e: string) => e.trim()),
      subject: row.subject,
      html: row.html_content,
      text: row.text_content,
      created_at: row.sent_at,
      sent_at: row.sent_at,
    }));

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error: any) {
    console.error('[Sent Emails] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

