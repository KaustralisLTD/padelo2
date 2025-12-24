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
    return { authorized: false };
  }

  return { authorized: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get email details from database
    const pool = getDbPool();
    
    const [rows] = await pool.execute(
      `SELECT id, resend_id, from_email, to_email, subject, html_content, text_content, sent_at, created_at
       FROM sent_emails 
       WHERE id = ? OR resend_id = ?`,
      [id, id]
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ 
        error: 'Email not found' 
      }, { status: 404 });
    }

    const row = rows[0];
    const email = {
      id: row.id,
      resend_id: row.resend_id,
      from: row.from_email,
      to: row.to_email.split(',').map((e: string) => e.trim()),
      subject: row.subject,
      html: row.html_content,
      text: row.text_content,
      created_at: row.sent_at,
      sent_at: row.sent_at,
    };

    return NextResponse.json({
      email,
    });
  } catch (error: any) {
    console.error('[Email Details] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

