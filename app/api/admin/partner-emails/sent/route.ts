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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get list of sent emails from Resend
    const result = await resend.emails.list({
      page,
      limit,
    });

    if (result.error) {
      console.error('[Sent Emails] Resend API error:', result.error);
      return NextResponse.json({ 
        error: result.error.message || 'Failed to fetch sent emails' 
      }, { status: 500 });
    }

    // Filter by from/to if provided
    let emails = result.data?.data || [];
    
    if (fromEmail) {
      emails = emails.filter((email: any) => 
        email.from?.toLowerCase().includes(fromEmail.toLowerCase())
      );
    }
    
    if (toEmail) {
      emails = emails.filter((email: any) => {
        const recipients = Array.isArray(email.to) ? email.to : [email.to];
        return recipients.some((to: string) => 
          to.toLowerCase().includes(toEmail.toLowerCase())
        );
      });
    }

    return NextResponse.json({
      emails,
      pagination: {
        page: result.data?.page || page,
        limit: result.data?.limit || limit,
        total: result.data?.total_count || emails.length,
      },
    });
  } catch (error: any) {
    console.error('[Sent Emails] Exception:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

