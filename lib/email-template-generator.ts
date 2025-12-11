// Email template generator that wraps existing templates with resend-template.html
// This allows using all existing email templates from email-templates.ts and email-templates-tournament.ts

import { loadAndRenderTemplate } from './resend-template-helper';
import * as tournamentTemplates from './email-templates-tournament';
import * as generalTemplates from './email-templates';

interface TemplateGeneratorOptions {
  templateId: string;
  data: any;
  locale?: string;
}

/**
 * Generates HTML for any email template using the resend-template.html wrapper
 */
export async function generateEmailTemplateHTML(options: TemplateGeneratorOptions): Promise<string> {
  const { templateId, data, locale = 'en' } = options;
  
  // Generate the inner content using existing template functions
  let innerHTML = '';
  let subject = 'Email from PadelO₂';
  
  try {
    switch (templateId) {
      // Tournament templates
      case 'tournament-registration':
        innerHTML = tournamentTemplates.getTournamentRegistrationEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          locale: data.locale || locale,
        });
        subject = `Tournament Registration Confirmation - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-registration-confirmed':
        innerHTML = tournamentTemplates.getTournamentRegistrationConfirmedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          paymentAmount: data.paymentAmount || 0,
          paymentMethod: data.paymentMethod,
          orderNumber: data.orderNumber,
          locale: data.locale || locale,
        });
        subject = `Registration Confirmed - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-waiting-list':
        innerHTML = tournamentTemplates.getTournamentWaitingListEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          locale: data.locale || locale,
        });
        subject = `Waiting List - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-spot-confirmed':
        innerHTML = tournamentTemplates.getTournamentSpotConfirmedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          confirmUrl: data.confirmUrl,
          expiresIn: data.expiresIn,
          locale: data.locale || locale,
        });
        subject = `Spot Available - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'payment-received':
        innerHTML = tournamentTemplates.getPaymentReceivedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          paymentAmount: data.paymentAmount || 0,
          paymentMethod: data.paymentMethod || '',
          orderNumber: data.orderNumber || '',
          transactionId: data.transactionId,
          paidAt: data.paidAt,
          locale: data.locale || locale,
        });
        subject = `Payment Received - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'payment-failed':
        innerHTML = tournamentTemplates.getPaymentFailedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          categories: data.categories || [],
          paymentAmount: data.paymentAmount || 0,
          retryUrl: data.retryUrl,
          orderNumber: data.orderNumber,
          errorMessage: data.errorMessage,
          locale: data.locale || locale,
        });
        subject = `Payment Failed - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-schedule-published':
        innerHTML = tournamentTemplates.getTournamentSchedulePublishedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          scheduleUrl: data.scheduleUrl,
          locale: data.locale || locale,
        });
        subject = `Schedule Published - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'match-reminder-1day':
        innerHTML = tournamentTemplates.getMatchReminder1DayEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          match: data.match,
          locale: data.locale || locale,
        });
        subject = `Match Reminder - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'match-reminder-sameday':
        innerHTML = tournamentTemplates.getMatchReminderSameDayEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          match: data.match,
          locale: data.locale || locale,
        });
        subject = `Match Today - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'schedule-change':
        innerHTML = tournamentTemplates.getScheduleChangeEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          match: data.match,
          reason: data.reason,
          locale: data.locale || locale,
        });
        subject = `Schedule Change - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'group-stage-results':
        innerHTML = tournamentTemplates.getGroupStageResultsEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          resultsUrl: data.resultsUrl,
          nextStage: data.nextStage,
          qualified: data.qualified,
          locale: data.locale || locale,
        });
        subject = `Group Stage Results - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'finals-winners':
        innerHTML = tournamentTemplates.getFinalsWinnersEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          position: data.position,
          prize: data.prize,
          resultsUrl: data.resultsUrl,
          finalStandings: data.finalStandings,
          locale: data.locale || locale,
        });
        subject = `Tournament Results - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'post-tournament-recap':
        innerHTML = tournamentTemplates.getPostTournamentRecapEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          mediaUrl: data.mediaUrl,
          recap: data.recap,
          nextEventUrl: data.nextEventUrl,
          locale: data.locale || locale,
        });
        subject = `Tournament Recap - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-feedback':
        innerHTML = tournamentTemplates.getTournamentFeedbackEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          feedbackUrl: data.feedbackUrl,
          locale: data.locale || locale,
        });
        subject = `Tournament Feedback - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'tournament-cancelled':
        innerHTML = tournamentTemplates.getTournamentCancelledEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          reason: data.reason,
          refundInfo: data.refundInfo,
          newDates: data.newDates,
          options: data.options,
          locale: data.locale || locale,
        });
        subject = `Tournament Cancelled - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'guest-tournament-registration':
        innerHTML = tournamentTemplates.getGuestTournamentRegistrationEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          adultsCount: data.adultsCount || 0,
          childrenCount: data.childrenCount || 0,
          childrenAges: data.childrenAges,
          totalPrice: data.totalPrice || 0,
          locale: data.locale || locale,
        });
        subject = `Guest Registration - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'guest-tournament-verification':
        innerHTML = tournamentTemplates.getGuestTournamentVerificationEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournamentName: data.tournamentName || data.tournament?.name || 'Tournament',
          confirmationUrl: data.confirmationUrl,
          locale: data.locale || locale,
        });
        subject = `Verify Guest Registration - ${data.tournamentName || data.tournament?.name || 'Tournament'}`;
        break;
        
      case 'guest-tournament-registration-confirmed':
        innerHTML = tournamentTemplates.getGuestTournamentRegistrationConfirmedEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          tournament: data.tournament,
          adultsCount: data.adultsCount || 0,
          childrenCount: data.childrenCount || 0,
          childrenAges: data.childrenAges,
          totalPrice: data.totalPrice || 0,
          locale: data.locale || locale,
        });
        subject = `Guest Registration Confirmed - ${data.tournament?.name || 'Tournament'}`;
        break;
        
      // General templates
      case 'welcome':
        innerHTML = generalTemplates.getWelcomeEmailTemplate({
          firstName: data.firstName,
          lastName: data.lastName,
          locale: data.locale || locale,
          email: data.email,
          temporaryPassword: data.temporaryPassword,
        });
        subject = 'Welcome to PadelO₂';
        break;
        
      case 'password-reset':
        innerHTML = generalTemplates.getPasswordResetEmailTemplate({
          firstName: data.firstName,
          resetUrl: data.resetUrl,
          locale: data.locale || locale,
          expiresIn: data.expiresIn,
        });
        subject = 'Password Reset - PadelO₂';
        break;
        
      case 'password-changed':
        innerHTML = generalTemplates.getPasswordChangedEmailTemplate({
          firstName: data.firstName,
          locale: data.locale || locale,
          timestamp: data.timestamp,
          supportUrl: data.supportUrl,
          newPassword: data.newPassword,
        });
        subject = 'Password Changed - PadelO₂';
        break;
        
      case 'new-device-login':
        innerHTML = generalTemplates.getNewDeviceLoginEmailTemplate({
          firstName: data.firstName,
          deviceInfo: data.deviceInfo,
          location: data.location,
          ipAddress: data.ipAddress,
          timestamp: data.timestamp,
          locale: data.locale || locale,
          supportUrl: data.supportUrl,
        });
        subject = 'New Device Login - PadelO₂';
        break;
        
      case 'change-email-old':
        innerHTML = generalTemplates.getChangeEmailOldAddressEmailTemplate({
          firstName: data.firstName,
          oldEmail: data.oldEmail,
          newEmail: data.newEmail,
          cancelUrl: data.cancelUrl,
          locale: data.locale || locale,
        });
        subject = 'Email Change Request - PadelO₂';
        break;
        
      case 'change-email-new':
        innerHTML = generalTemplates.getChangeEmailNewAddressEmailTemplate({
          firstName: data.firstName,
          newEmail: data.newEmail,
          confirmUrl: data.confirmUrl,
          locale: data.locale || locale,
          expiresIn: data.expiresIn,
        });
        subject = 'Confirm New Email - PadelO₂';
        break;
        
      case 'account-deletion-confirm':
        innerHTML = generalTemplates.getAccountDeletionConfirmEmailTemplate({
          firstName: data.firstName,
          confirmUrl: data.confirmUrl,
          locale: data.locale || locale,
          expiresIn: data.expiresIn,
        });
        subject = 'Account Deletion Confirmation - PadelO₂';
        break;
        
      case 'account-deleted':
        innerHTML = generalTemplates.getAccountDeletedEmailTemplate({
          firstName: data.firstName,
          deletedAt: data.deletedAt,
          locale: data.locale || locale,
        });
        subject = 'Account Deleted - PadelO₂';
        break;
        
      default:
        throw new Error(`Template ${templateId} not found`);
    }
  } catch (error: any) {
    console.error(`Error generating template ${templateId}:`, error);
    throw new Error(`Failed to generate template: ${error.message}`);
  }
  
  // Extract content from the generated HTML (remove DOCTYPE, html, head, body tags)
  // The templates return full HTML documents, but we need just the content
  let content = innerHTML;
  
  // Try to extract body content if it's a full HTML document
  const bodyMatch = innerHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  } else {
    // If no body tag, try to extract content between tags or use as-is
    const contentMatch = innerHTML.match(/(?:<[^>]+>)*([\s\S]*?)(?:<\/[^>]+>)*$/);
    if (contentMatch && contentMatch[1].trim()) {
      content = contentMatch[1];
    }
  }
  
  // Wrap in resend-template.html
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const brandTaglines: Record<string, string> = {
    en: 'Breathe &amp; live padel',
    ru: 'Дыши и живи паделем',
    ua: 'Дихай та живи паделем',
    es: 'Respira y vive el pádel',
    fr: 'Respirez et vivez le padel',
    de: 'Atme und lebe Padel',
    it: 'Respira e vivi il padel',
    ca: 'Respira i viu el pàdel',
    nl: 'Adem en leef padel',
    da: 'Træk vejret og lev padel',
    sv: 'Andas och lev padel',
    no: 'Pust og lev padel',
    ar: 'تنفس وعِش البادل',
    zh: '呼吸并热爱壁板球',
  };
  const brandTagline = brandTaglines[locale] || brandTaglines.en;
  
  const variables = {
    locale,
    dir: 'ltr',
    subject,
    brandTagline,
    welcomeBadge: '',
    eyebrow: '',
    title: subject,
    greeting: '',
    content: content,
    buttonUrl: '',
    buttonText: '',
    linkText: '',
    linkUrl: '',
    linkNote: '',
    showFeatures: false,
    footerText: '',
    followJourney: 'Follow us:',
    receivingEmail: 'You received this email from',
    siteUrl,
    unsubscribeUrl: `${siteUrl}/${locale}/unsubscribe`,
    unsubscribeText: 'Unsubscribe',
    team: '',
    contactPhone: '',
    contactEmail: '',
    contactName: '',
    contactTitle: '',
    instagramUrl: 'https://www.instagram.com/padelo2com/',
    youtubeUrl: 'https://www.youtube.com/@PadelO2',
    tiktokUrl: 'https://www.tiktok.com/@padelo2com',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61583860325680',
  };
  
  return loadAndRenderTemplate('resend-template.html', variables);
}

