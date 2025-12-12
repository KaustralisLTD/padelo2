import { NextRequest, NextResponse } from 'next/server';
import { generateSponsorshipProposalEmailHTML } from '@/lib/resend-template-helper';
import { generateEmailTemplateHTML } from '@/lib/email-template-generator';
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
      userIds,
      newRole,
      oldRole,
      category,
    } = body;

    let html = '';

    // Get tournament data if needed
    let tournamentData = null;
    if (tournamentId) {
      try {
        const { getAllTournaments } = await import('@/lib/tournaments');
        const tournaments = await getAllTournaments();
        tournamentData = tournaments.find((t: any) => t.id === parseInt(tournamentId));
      } catch (error) {
        console.error('Error fetching tournament:', error);
      }
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
      // Use the template generator for other templates
      let templateData: any = {
        locale: locale || 'en',
        tournament: tournamentData,
      };
      
      // Add user-specific data if available
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // For preview, use the first user's data or generic data
        templateData.firstName = partnerName || '';
        templateData.lastName = '';
      } else if (email) {
        templateData.firstName = partnerName || '';
        templateData.lastName = '';
      }
      
      // Add template-specific data
      if (templateId.includes('tournament')) {
        templateData.categories = [];
        templateData.tournament = tournamentData;
      }
      
      // Staff templates specific data
      if (templateId === 'staff-access-granted') {
        templateData.tournamentName = tournamentData?.name || 'Tournament';
        templateData.permissions = {
          canManageGroups: false,
          canManageMatches: false,
          canViewRegistrations: false,
          canManageUsers: false,
          canManageLogs: false,
          canManageTournaments: false,
          canSendEmails: false,
        };
        templateData.adminPanelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${locale || 'en'}/admin/dashboard`;
      } else if (templateId === 'role-change') {
        templateData.newRole = newRole || 'staff';
        templateData.oldRole = oldRole;
        templateData.adminPanelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${locale || 'en'}/admin/dashboard`;
      }
      
      html = await generateEmailTemplateHTML({
        templateId,
        data: templateData,
        locale: locale || 'en',
      });
    }

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

