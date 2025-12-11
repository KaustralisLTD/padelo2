import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
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
      try {
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
          // For Clients templates, we need user data
          let templateData: any = {
            locale: locale || 'en',
            tournament: tournamentData,
          };
          
          // Add user-specific data if available
          if (userIds && userIds.length > 0) {
            // For bulk sending, we'll generate template per user
            // But for now, use generic data
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
          
          html = await generateEmailTemplateHTML({
            templateId,
            data: templateData,
            locale: locale || 'en',
          });
        }
      } catch (error: any) {
        console.error(`[Email Send] Error generating template ${templateId}:`, error);
        return NextResponse.json({ 
          error: `Failed to generate template: ${error.message}` 
        }, { status: 500 });
      }
    }

    // Generate subject
    const tournamentName = tournamentData?.name || 'UA PADEL OPEN 2025';
    const subject = templateId === 'sponsorship-proposal' 
      ? `Sponsorship Proposal – ${tournamentName}`
      : 'Email from PadelO₂';

    // Determine from address
    let fromAddress: string;
    if (category === 'partners') {
      fromAddress = 'Partner@padelO2.com';
    } else {
      fromAddress = 'noreply@padelO2.com';
    }

    console.log('[Email Send] Starting email send process:', {
      recipientCount: recipientEmails.length,
      recipients: recipientEmails,
      subject,
      from: fromAddress,
      templateId,
      hasCustomHtml: !!customHtml,
    });

    // Send emails to all recipients
    const emailResults = await Promise.allSettled(
      recipientEmails.map(async (toEmail) => {
        try {
          console.log(`[Email Send] Attempting to send to ${toEmail}`);
          const result = await sendEmail({
            to: toEmail,
            subject,
            html,
            locale,
            from: fromAddress,
          });
          console.log(`[Email Send] Result for ${toEmail}:`, result);
          return { email: toEmail, success: result };
        } catch (error: any) {
          console.error(`[Email Send] Exception sending email to ${toEmail}:`, error);
          return { email: toEmail, success: false, error: error.message || 'Unknown error' };
        }
      })
    );

    const results = emailResults.map(r => {
      if (r.status === 'fulfilled') {
        return r.value.success;
      }
      console.error('[Email Send] Promise rejected:', r.reason);
      return false;
    });
    const successCount = results.filter(r => r === true).length;
    
    // Log detailed results
    console.log(`[Email Send] Final results: ${successCount}/${recipientEmails.length} successful`);
    emailResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        console.error(`[Email Send] Failed for ${recipientEmails[index]}:`, result.value.error || 'Unknown error');
      } else if (result.status === 'rejected') {
        console.error(`[Email Send] Rejected for ${recipientEmails[index]}:`, result.reason);
      }
    });
    
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
      // Return detailed error information
      const errorDetails = emailResults
        .map((result, index) => {
          if (result.status === 'fulfilled' && !result.value.success) {
            return `${recipientEmails[index]}: ${result.value.error || 'Unknown error'}`;
          } else if (result.status === 'rejected') {
            return `${recipientEmails[index]}: ${result.reason?.message || 'Promise rejected'}`;
          }
          return null;
        })
        .filter(Boolean);
      
      console.error('[Email Send] All emails failed:', errorDetails);
      return NextResponse.json({ 
        error: 'Failed to send email to any recipients',
        details: errorDetails.length > 0 ? errorDetails : ['No error details available'],
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Email Send] Exception in POST handler:', error);
    console.error('[Email Send] Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack ? error.stack.split('\n').slice(0, 5) : [],
    }, { status: 500 });
  }
}

