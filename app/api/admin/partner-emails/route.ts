import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
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

  // Only superadmin can send partner emails
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
      category,
      tournamentId,
      tournamentScope,
      userIds,
      customHtml,
    } = body;

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

    // Get user emails if userIds provided
    let recipientEmails: string[] = [];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      try {
        const { getAllUsers } = await import('@/lib/users');
        const allUsers = await getAllUsers();
        recipientEmails = allUsers
          .filter((u: any) => userIds.includes(u.id))
          .map((u: any) => u.email)
          .filter((e: string) => e);
      } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }
    } else if (email) {
      recipientEmails = [email];
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
    }

    // Generate HTML based on template
    let html = customHtml;
    if (!html) {
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
        return NextResponse.json({ error: 'Template not implemented yet' }, { status: 400 });
      }
    }

    // Generate subject
    const tournamentName = tournamentData?.name || 'UA PADEL OPEN 2025';
    const subject = templateId === 'sponsorship-proposal' 
      ? `Sponsorship Proposal – ${tournamentName}`
      : 'Email from PadelO₂';

    // Send emails to all recipients
    const results = await Promise.all(
      recipientEmails.map((toEmail) =>
        sendEmail({
          to: toEmail,
          subject,
          html,
          locale,
          from: category === 'partners' ? 'Partner@padelO2.com' : 'noreply@padelO2.com',
        })
      )
    );

    const successCount = results.filter(r => r).length;
    
    if (successCount === recipientEmails.length) {
      return NextResponse.json({ 
        success: true, 
        message: `Email sent successfully to ${successCount} recipient(s)` 
      });
    } else if (successCount > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Email sent to ${successCount} of ${recipientEmails.length} recipient(s)`,
        warning: true,
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email to any recipients' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

