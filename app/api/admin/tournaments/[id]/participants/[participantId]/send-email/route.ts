import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { getTournament } from '@/lib/tournaments';
import {
  sendEmailVerification,
  sendWelcomeEmail,
  sendTournamentRegistrationEmail,
} from '@/lib/email';
import { getTournamentRegistrationConfirmedEmailTemplate } from '@/lib/email-templates-tournament';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean; userId?: string }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session) {
    return { authorized: false };
  }

  if (session.role !== 'superadmin' && session.role !== 'tournament_admin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, participantId } = await params;
    const tournamentId = parseInt(id, 10);
    const registrationId = parseInt(participantId, 10);

    if (isNaN(tournamentId) || isNaN(registrationId)) {
      return NextResponse.json(
        { error: 'Invalid tournament or participant ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { template, locale = 'en' } = body;

    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    // Получаем данные участника
    const pool = getDbPool();
    const [registrations] = await pool.execute(
      `SELECT * FROM tournament_registrations WHERE id = ? AND tournament_id = ?`,
      [registrationId, tournamentId]
    ) as any[];

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const registration = registrations[0];
    const participantLocale = registration.locale || locale;

    // Получаем данные турнира
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Отправляем email в зависимости от выбранного шаблона
    let emailSent = false;

    switch (template) {
      case 'tournament_registration': {
        try {
        const tournamentData = {
          id: tournament.id,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location || undefined,
          locationAddress: tournament.locationAddress || undefined,
          locationCoordinates: tournament.locationCoordinates || undefined,
          eventSchedule: tournament.eventSchedule || undefined,
          priceSingleCategory: tournament.priceSingleCategory || undefined,
          priceDoubleCategory: tournament.priceDoubleCategory || undefined,
          description: tournament.description || undefined,
          bannerImageData: tournament.bannerImageData || undefined,
          translations: tournament.translations || undefined,
        };
          
          let categories: string[] = [];
          try {
            categories = JSON.parse(registration.categories || '[]');
            if (!Array.isArray(categories)) {
              categories = [];
            }
          } catch (e) {
            console.error('[send-email] Error parsing categories:', e);
            categories = [];
          }
          
          emailSent = await sendTournamentRegistrationEmail({
            email: registration.email,
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: tournamentData,
            categories,
            locale: participantLocale,
          });
        } catch (error: any) {
          console.error('[send-email] Error in tournament_registration:', error);
          throw new Error(`Failed to send tournament registration email: ${error.message}`);
        }
        break;
      }

      case 'tournament_confirmed': {
        try {
          const tournamentData = {
            id: tournament.id,
            name: tournament.name,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            location: tournament.location || undefined,
            locationAddress: tournament.locationAddress || undefined,
            locationCoordinates: tournament.locationCoordinates || undefined,
            eventSchedule: tournament.eventSchedule || undefined,
            description: tournament.description || undefined,
            bannerImageData: tournament.bannerImageData || undefined,
            translations: tournament.translations || undefined,
          };
          
          let categories: string[] = [];
          try {
            categories = JSON.parse(registration.categories || '[]');
            if (!Array.isArray(categories)) {
              categories = [];
            }
          } catch (e) {
            console.error('[send-email] Error parsing categories:', e);
            categories = [];
          }
          
          // Calculate payment amount based on number of categories
          const categoryCount = categories.length;
          const paymentAmount = categoryCount > 0 
            ? (tournament.priceSingleCategory || 0) * categoryCount 
            : tournament.priceSingleCategory || 0;
          
          const html = getTournamentRegistrationConfirmedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: tournamentData,
            categories: categories.length > 0 ? categories : [],
            paymentAmount,
            paymentMethod: 'Manual',
            orderNumber: `REG-${registration.id}`,
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: 'Payment confirmed - Tournament registration - PadelO₂',
            ru: 'Оплата подтверждена - Регистрация на турнир - PadelO₂',
            ua: 'Оплата підтверджена - Реєстрація на турнір - PadelO₂',
            es: 'Pago confirmado - Registro de torneo - PadelO₂',
            fr: 'Paiement confirmé - Inscription au tournoi - PadelO₂',
            de: 'Zahlung bestätigt - Turnieranmeldung - PadelO₂',
            it: 'Pagamento confermato - Registrazione torneo - PadelO₂',
            ca: 'Pagament confirmat - Registre de torneig - PadelO₂',
            nl: 'Betaling bevestigd - Toernooi registratie - PadelO₂',
            da: 'Betaling bekræftet - Turnering registrering - PadelO₂',
            sv: 'Betalning bekräftad - Turnering registrering - PadelO₂',
            no: 'Betaling bekreftet - Turnering registrering - PadelO₂',
            ar: 'تم تأكيد الدفع - تسجيل البطولة - PadelO₂',
            zh: '付款已确认 - 锦标赛注册 - PadelO₂',
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in tournament_confirmed:', error);
          throw new Error(`Failed to send tournament confirmed email: ${error.message}`);
        }
        break;
      }

      case 'welcome': {
        emailSent = await sendWelcomeEmail(
          registration.email,
          registration.first_name,
          participantLocale
        );
        break;
      }

      case 'email_verification': {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Обновляем токен в БД (если есть таблица users)
        try {
          const [users] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [registration.email]
          ) as any[];
          
          if (users.length > 0) {
            await pool.execute(
              'UPDATE users SET email_verification_token = ? WHERE id = ?',
              [verificationToken, users[0].id]
            );
          }
        } catch (e) {
          console.warn('Could not update verification token:', e);
        }
        
        emailSent = await sendEmailVerification(
          registration.email,
          registration.first_name,
          verificationToken,
          participantLocale
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid template' },
          { status: 400 }
        );
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}

