import { NextRequest, NextResponse } from 'next/server';
import { generateSponsorshipProposalEmailHTML } from '@/lib/resend-template-helper';
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

  if (session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId, role: session.role };
}

export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      email, 
      partnerName, 
      partnerCompany, 
      locale = 'en',
      phone = '+34 662 423 738',
      contactEmail = 'partner@padelO2.com',
      templateId,
      tournamentId,
      tournamentScope,
    } = body;

    let html = '';

    // Get tournament data if needed
    let tournamentData = null;
    if (tournamentId) {
      const { getAllTournaments } = require('@/lib/tournaments');
      const tournaments = await getAllTournaments();
      tournamentData = tournaments.find((t: any) => t.id === parseInt(tournamentId));
    }

    // Generate HTML based on template
    if (templateId === 'sponsorship-proposal') {
      html = generateSponsorshipProposalEmailHTML({
        partnerName: partnerName || '',
        partnerCompany: partnerCompany || '',
        locale: locale || 'en',
        phone: phone || '+34 662 423 738',
        email: contactEmail || 'partner@padelO2.com',
        contactName: 'Sergii Shchurenko',
        contactTitle: 'Organizer, UA PADEL OPEN',
        tournament: tournamentData,
      });
    } else {
      // For other templates, we'll need to implement them
      html = '<p>Template not yet implemented</p>';
    }

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

