import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';

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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get email details from Resend
    const result = await resend.emails.get(id);

    if (result.error) {
      console.error('[Email Details] Resend API error:', result.error);
      return NextResponse.json({ 
        error: result.error.message || 'Failed to fetch email details' 
      }, { status: 500 });
    }

    return NextResponse.json({
      email: result.data,
    });
  } catch (error: any) {
    console.error('[Email Details] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

