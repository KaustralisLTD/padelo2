import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { getTournament } from '@/lib/tournaments';
import {
  sendEmailVerification,
  sendWelcomeEmail,
  sendTournamentRegistrationEmail,
} from '@/lib/email';
import {
  getTournamentRegistrationConfirmedEmailTemplate,
  getTournamentWaitingListEmailTemplate,
  getTournamentSpotConfirmedEmailTemplate,
  getPaymentReceivedEmailTemplate,
  getPaymentFailedEmailTemplate,
  getTournamentSchedulePublishedEmailTemplate,
  getMatchReminder1DayEmailTemplate,
  getMatchReminderSameDayEmailTemplate,
  getScheduleChangeEmailTemplate,
  getGroupStageResultsEmailTemplate,
  getFinalsWinnersEmailTemplate,
  getPostTournamentRecapEmailTemplate,
  getTournamentFeedbackEmailTemplate,
  getTournamentCancelledEmailTemplate,
} from '@/lib/email-templates-tournament';
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
            // Категории могут быть уже массивом (если БД возвращает JSON как объект) или строкой JSON
            if (Array.isArray(registration.categories)) {
              categories = registration.categories;
            } else if (typeof registration.categories === 'string') {
              if (registration.categories.trim().startsWith('[') || registration.categories.trim().startsWith('{')) {
                // Это JSON строка
                const parsed = JSON.parse(registration.categories);
                categories = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : []);
              } else {
                // Это простая строка, возможно разделенная запятыми
                categories = registration.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c);
              }
            }
            
            // Фильтруем пустые значения и приводим к строке
            categories = categories.filter((c: any) => c && (typeof c === 'string' ? c.trim() : String(c))).map((c: any) => String(c).trim());
            
            console.log('[send-email] Parsed categories:', {
              raw: registration.categories,
              rawType: typeof registration.categories,
              parsed: categories,
              participantId: registrationId,
            });
          } catch (e) {
            console.error('[send-email] Error parsing categories:', e, {
              raw: registration.categories,
              rawType: typeof registration.categories,
              participantId: registrationId,
            });
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
            priceSingleCategory: tournament.priceSingleCategory || undefined,
            priceDoubleCategory: tournament.priceDoubleCategory || undefined,
            description: tournament.description || undefined,
            bannerImageData: tournament.bannerImageData || undefined,
            translations: tournament.translations || undefined,
          };
          
          let categories: string[] = [];
          try {
            const parsed = JSON.parse(registration.categories || '[]');
            if (Array.isArray(parsed)) {
              // Нормализуем категории - извлекаем строки из объектов или используем строки напрямую
              categories = parsed.map((cat: any) => {
                if (!cat) return null;
                // Если это объект с полем name или value, извлекаем его
                if (typeof cat === 'object' && cat !== null) {
                  return (cat as any).name || (cat as any).value || (cat as any).category || String(cat);
                }
                // Если это строка, используем её
                if (typeof cat === 'string') {
                  return cat.trim();
                }
                // Иначе преобразуем в строку
                return String(cat).trim();
              }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '') as string[];
            } else {
              categories = [];
            }
          } catch (e) {
            console.error('[send-email] Error parsing categories:', e);
            categories = [];
          }
          
          console.log('[send-email] Tournament confirmed - Categories after normalization:', {
            original: registration.categories,
            normalized: categories,
            count: categories.length,
            participantId: registrationId,
          });
          
          // Calculate payment amount based on number of categories
          // If single category: priceSingleCategory, if multiple: priceDoubleCategory * count
          const categoryCount = categories.length;
          const paymentAmount = categoryCount === 1
            ? (tournament.priceSingleCategory || 0)
            : categoryCount > 1
            ? (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0) * categoryCount
            : tournament.priceSingleCategory || 0;
          
          const html = getTournamentRegistrationConfirmedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: tournamentData,
            categories: categories, // Передаем уже нормализованные категории
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

      case 'tournament_waiting_list': {
        try {
          let categories: string[] = [];
          try {
            categories = JSON.parse(registration.categories || '[]');
            if (!Array.isArray(categories)) {
              categories = [];
            }
          } catch (e) {
            categories = [];
          }

          const html = getTournamentWaitingListEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
              location: tournament.location || undefined,
              locationAddress: tournament.locationAddress || undefined,
            },
            categories,
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: `You're on the waiting list for ${tournament.name} - PadelO₂`,
            ru: `Вы в списке ожидания для ${tournament.name} - PadelO₂`,
            ua: `Ви в списку очікування для ${tournament.name} - PadelO₂`,
            es: `Estás en la lista de espera para ${tournament.name} - PadelO₂`,
            fr: `Vous êtes sur la liste d'attente pour ${tournament.name} - PadelO₂`,
            de: `Sie stehen auf der Warteliste für ${tournament.name} - PadelO₂`,
            it: `Sei nella lista d'attesa per ${tournament.name} - PadelO₂`,
            ca: `Estàs a la llista d'espera per a ${tournament.name} - PadelO₂`,
            nl: `Je staat op de wachtlijst voor ${tournament.name} - PadelO₂`,
            da: `Du er på ventelisten for ${tournament.name} - PadelO₂`,
            sv: `Du är på väntelistan för ${tournament.name} - PadelO₂`,
            no: `Du er på ventelisten for ${tournament.name} - PadelO₂`,
            ar: `أنت في قائمة الانتظار لـ ${tournament.name} - PadelO₂`,
            zh: `您在 ${tournament.name} 的候补名单中 - PadelO₂`,
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in tournament_waiting_list:', error);
          throw new Error(`Failed to send waiting list email: ${error.message}`);
        }
        break;
      }

      case 'tournament_spot_confirmed': {
        try {
          let categories: string[] = [];
          try {
            categories = JSON.parse(registration.categories || '[]');
            if (!Array.isArray(categories)) {
              categories = [];
            }
          } catch (e) {
            categories = [];
          }

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
          const confirmUrl = `${siteUrl}/${participantLocale}/tournament/${tournamentId}/confirm?registration=${registrationId}`;

          const html = getTournamentSpotConfirmedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
              location: tournament.location || undefined,
              locationAddress: tournament.locationAddress || undefined,
              priceSingleCategory: tournament.priceSingleCategory || 0,
            },
            categories,
            confirmUrl,
            expiresIn: '48 hours',
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: `Your spot is confirmed for ${tournament.name} - PadelO₂`,
            ru: `Ваше место подтверждено для ${tournament.name} - PadelO₂`,
            ua: `Ваше місце підтверджено для ${tournament.name} - PadelO₂`,
            es: `Tu lugar está confirmado para ${tournament.name} - PadelO₂`,
            fr: `Votre place est confirmée pour ${tournament.name} - PadelO₂`,
            de: `Ihr Platz ist bestätigt für ${tournament.name} - PadelO₂`,
            it: `Il tuo posto è confermato per ${tournament.name} - PadelO₂`,
            ca: `El teu lloc està confirmat per a ${tournament.name} - PadelO₂`,
            nl: `Je plek is bevestigd voor ${tournament.name} - PadelO₂`,
            da: `Din plads er bekræftet til ${tournament.name} - PadelO₂`,
            sv: `Din plats är bekräftad för ${tournament.name} - PadelO₂`,
            no: `Din plass er bekreftet for ${tournament.name} - PadelO₂`,
            ar: `تم تأكيد مكانك لـ ${tournament.name} - PadelO₂`,
            zh: `您的位置已确认为 ${tournament.name} - PadelO₂`,
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in tournament_spot_confirmed:', error);
          throw new Error(`Failed to send spot confirmed email: ${error.message}`);
        }
        break;
      }

      case 'payment_received': {
        try {
          let categories: string[] = [];
          try {
            // Категории могут быть уже массивом (если БД возвращает JSON как объект) или строкой JSON
            if (Array.isArray(registration.categories)) {
              categories = registration.categories;
            } else if (typeof registration.categories === 'string') {
              if (registration.categories.trim().startsWith('[') || registration.categories.trim().startsWith('{')) {
                // Это JSON строка
                const parsed = JSON.parse(registration.categories);
                categories = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : []);
              } else {
                // Это простая строка, возможно разделенная запятыми
                categories = registration.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c);
              }
            }
            
            // Фильтруем пустые значения и приводим к строке
            categories = categories.filter((c: any) => c && (typeof c === 'string' ? c.trim() : String(c))).map((c: any) => String(c).trim());
            
            console.log('[send-email] Payment received - Parsed categories:', {
              raw: registration.categories,
              rawType: typeof registration.categories,
              parsed: categories,
              participantId: registrationId,
            });
          } catch (e) {
            console.error('[send-email] Payment received - Error parsing categories:', e, {
              raw: registration.categories,
              rawType: typeof registration.categories,
              participantId: registrationId,
            });
            categories = [];
          }

          // Calculate payment amount based on number of categories
          // If single category: priceSingleCategory, if multiple: priceDoubleCategory * count
          const categoryCount = categories.length;
          const paymentAmount = categoryCount === 1
            ? (tournament.priceSingleCategory || 0)
            : categoryCount > 1
            ? (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0) * categoryCount
            : tournament.priceSingleCategory || 0;
          
          console.log('[send-email] Payment received - Payment calculation:', {
            categoryCount,
            priceSingleCategory: tournament.priceSingleCategory,
            priceDoubleCategory: tournament.priceDoubleCategory,
            paymentAmount,
            participantId: registrationId,
          });

          console.log('[send-email] Payment received - Sending email with data:', {
            categories,
            categoryCount: categories.length,
            paymentAmount,
            participantId: registrationId,
            participantEmail: registration.email,
          });

          const html = getPaymentReceivedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
            },
            categories: categories.length > 0 ? categories : [],
            paymentAmount,
            paymentMethod: registration.paymentStatus === 'paid' ? 'Manual' : 'Online',
            orderNumber: `REG-${registration.id}`,
            transactionId: `TXN-${registration.id}-${Date.now()}`,
            paidAt: registration.paymentDate || new Date().toISOString(),
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: `Payment received for ${tournament.name} - PadelO₂`,
            ru: `Оплата получена за ${tournament.name} - PadelO₂`,
            ua: `Оплата отримана за ${tournament.name} - PadelO₂`,
            es: `Pago recibido para ${tournament.name} - PadelO₂`,
            fr: `Paiement reçu pour ${tournament.name} - PadelO₂`,
            de: `Zahlung erhalten für ${tournament.name} - PadelO₂`,
            it: `Pagamento ricevuto per ${tournament.name} - PadelO₂`,
            ca: `Pagament rebut per a ${tournament.name} - PadelO₂`,
            nl: `Betaling ontvangen voor ${tournament.name} - PadelO₂`,
            da: `Betaling modtaget for ${tournament.name} - PadelO₂`,
            sv: `Betalning mottagen för ${tournament.name} - PadelO₂`,
            no: `Betaling mottatt for ${tournament.name} - PadelO₂`,
            ar: `تم استلام الدفع لـ ${tournament.name} - PadelO₂`,
            zh: `已收到 ${tournament.name} 的付款 - PadelO₂`,
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in payment_received:', error);
          throw new Error(`Failed to send payment received email: ${error.message}`);
        }
        break;
      }

      case 'payment_failed': {
        try {
          let categories: string[] = [];
          try {
            // Категории могут быть уже массивом (если БД возвращает JSON как объект) или строкой JSON
            if (Array.isArray(registration.categories)) {
              categories = registration.categories;
            } else if (typeof registration.categories === 'string') {
              if (registration.categories.trim().startsWith('[') || registration.categories.trim().startsWith('{')) {
                // Это JSON строка
                const parsed = JSON.parse(registration.categories);
                categories = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : []);
              } else {
                // Это простая строка, возможно разделенная запятыми
                categories = registration.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c);
              }
            }
            
            // Фильтруем пустые значения и приводим к строке
            categories = categories.filter((c: any) => c && (typeof c === 'string' ? c.trim() : String(c))).map((c: any) => String(c).trim());
            
            console.log('[send-email] Payment failed - Parsed categories:', {
              raw: registration.categories,
              rawType: typeof registration.categories,
              parsed: categories,
              participantId: registrationId,
            });
          } catch (e) {
            console.error('[send-email] Payment failed - Error parsing categories:', e, {
              raw: registration.categories,
              rawType: typeof registration.categories,
              participantId: registrationId,
            });
            categories = [];
          }

          // Calculate payment amount based on number of categories
          // If single category: priceSingleCategory, if multiple: priceDoubleCategory * count
          const categoryCount = categories.length;
          const paymentAmount = categoryCount === 1
            ? (tournament.priceSingleCategory || 0)
            : categoryCount > 1
            ? (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0) * categoryCount
            : tournament.priceSingleCategory || 0;
          
          console.log('[send-email] Payment failed - Payment calculation:', {
            categoryCount,
            priceSingleCategory: tournament.priceSingleCategory,
            priceDoubleCategory: tournament.priceDoubleCategory,
            paymentAmount,
            participantId: registrationId,
          });

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
          const retryUrl = `${siteUrl}/${participantLocale}/dashboard`;

          console.log('[send-email] Payment failed - Sending email with data:', {
            categories,
            categoryCount: categories.length,
            paymentAmount,
            participantId: registrationId,
            participantEmail: registration.email,
          });

          const html = getPaymentFailedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
            },
            categories: categories.length > 0 ? categories : [],
            paymentAmount,
            retryUrl,
            orderNumber: `REG-${registration.id}`,
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: `Payment failed for ${tournament.name} - PadelO₂`,
            ru: `Оплата не прошла для ${tournament.name} - PadelO₂`,
            ua: `Оплата не пройшла для ${tournament.name} - PadelO₂`,
            es: `Pago fallido para ${tournament.name} - PadelO₂`,
            fr: `Paiement échoué pour ${tournament.name} - PadelO₂`,
            de: `Zahlung fehlgeschlagen für ${tournament.name} - PadelO₂`,
            it: `Pagamento fallito per ${tournament.name} - PadelO₂`,
            ca: `Pagament fallit per a ${tournament.name} - PadelO₂`,
            nl: `Betaling mislukt voor ${tournament.name} - PadelO₂`,
            da: `Betaling mislykkedes for ${tournament.name} - PadelO₂`,
            sv: `Betalning misslyckades för ${tournament.name} - PadelO₂`,
            no: `Betaling mislyktes for ${tournament.name} - PadelO₂`,
            ar: `فشل الدفع لـ ${tournament.name} - PadelO₂`,
            zh: `付款失败 ${tournament.name} - PadelO₂`,
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in payment_failed:', error);
          throw new Error(`Failed to send payment failed email: ${error.message}`);
        }
        break;
      }

      case 'tournament_schedule_published': {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
          const scheduleUrl = `${siteUrl}/${participantLocale}/tournament/${tournamentId}/schedule`;

          const html = getTournamentSchedulePublishedEmailTemplate({
            firstName: registration.first_name || undefined,
            lastName: registration.last_name || undefined,
            tournament: {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
            },
            scheduleUrl,
            locale: participantLocale,
          });

          const translations: Record<string, string> = {
            en: `Your match schedule is ready for ${tournament.name} - PadelO₂`,
            ru: `Ваше расписание матчей готово для ${tournament.name} - PadelO₂`,
            ua: `Ваш розклад матчів готовий для ${tournament.name} - PadelO₂`,
            es: `Tu calendario de partidos está listo para ${tournament.name} - PadelO₂`,
            fr: `Votre calendrier de matchs est prêt pour ${tournament.name} - PadelO₂`,
            de: `Ihr Spielplan ist bereit für ${tournament.name} - PadelO₂`,
            it: `Il tuo calendario delle partite è pronto per ${tournament.name} - PadelO₂`,
            ca: `El teu calendari de partits està llest per a ${tournament.name} - PadelO₂`,
            nl: `Je wedstrijdschema is klaar voor ${tournament.name} - PadelO₂`,
            da: `Din kampkalender er klar til ${tournament.name} - PadelO₂`,
            sv: `Din matchkalender är redo för ${tournament.name} - PadelO₂`,
            no: `Din kampkalender er klar for ${tournament.name} - PadelO₂`,
            ar: `جدول مبارياتك جاهز لـ ${tournament.name} - PadelO₂`,
            zh: `您的比赛日程已为 ${tournament.name} 准备好 - PadelO₂`,
          };

          emailSent = await sendEmail({
            to: registration.email,
            subject: translations[participantLocale] || translations.en,
            html,
          });
        } catch (error: any) {
          console.error('[send-email] Error in tournament_schedule_published:', error);
          throw new Error(`Failed to send schedule published email: ${error.message}`);
        }
        break;
      }

      case 'match_reminder_1day': {
        const missingFields = [
          'match.date (дата матча)',
          'match.time (время матча)',
          'match.courtNumber (номер корта)',
          'match.opponent (соперник)',
          'match.format (формат игры)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            match: {
              date: 'string (дата матча, например: 2025-12-20)',
              time: 'string (время матча, например: 18:00)',
              courtNumber: 'number (номер корта)',
              opponent: 'string (имя соперника)',
              format: 'string (формат игры, например: "Men\'s Doubles")',
            },
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              match: {
                date: 'string (дата матча, например: 2025-12-20)',
                time: 'string (время матча, например: 18:00)',
                courtNumber: 'number (номер корта)',
                opponent: 'string (имя соперника)',
                format: 'string (формат игры, например: "Men\'s Doubles")',
              },
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              match: {
                date: 'string (дата матча, например: 2025-12-20)',
                time: 'string (время матча, например: 18:00)',
                courtNumber: 'number (номер корта)',
                opponent: 'string (имя соперника)',
                format: 'string (формат игры, например: "Men\'s Doubles")',
              },
            },
          },
          { status: 400 }
        );
      }

      case 'match_reminder_sameday': {
        const missingFields = [
          'match.date (дата матча)',
          'match.time (время матча)',
          'match.courtNumber (номер корта)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            match: {
              date: 'string (дата матча, например: 2025-12-20)',
              time: 'string (время матча, например: 18:00)',
              courtNumber: 'number (номер корта)',
            },
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              match: {
                date: 'string (дата матча, например: 2025-12-20)',
                time: 'string (время матча, например: 18:00)',
                courtNumber: 'number (номер корта)',
              },
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              match: {
                date: 'string (дата матча, например: 2025-12-20)',
                time: 'string (время матча, например: 18:00)',
                courtNumber: 'number (номер корта)',
              },
            },
          },
          { status: 400 }
        );
      }

      case 'schedule_change': {
        const missingFields = [
          'oldMatch.date (старая дата матча)',
          'oldMatch.time (старое время матча)',
          'oldMatch.courtNumber (старый номер корта)',
          'newMatch.date (новая дата матча)',
          'newMatch.time (новое время матча)',
          'newMatch.courtNumber (новый номер корта)',
          'reason (причина изменения)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            oldMatch: {
              date: 'string (старая дата)',
              time: 'string (старое время)',
              courtNumber: 'number (старый номер корта)',
            },
            newMatch: {
              date: 'string (новая дата)',
              time: 'string (новое время)',
              courtNumber: 'number (новый номер корта)',
            },
            reason: 'string (причина изменения)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              oldMatch: {
                date: 'string (старая дата, например: 2025-12-20)',
                time: 'string (старое время, например: 18:00)',
                courtNumber: 'number (старый номер корта)',
              },
              newMatch: {
                date: 'string (новая дата, например: 2025-12-21)',
                time: 'string (новое время, например: 19:00)',
                courtNumber: 'number (новый номер корта)',
              },
              reason: 'string (причина изменения)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              oldMatch: {
                date: 'string (старая дата, например: 2025-12-20)',
                time: 'string (старое время, например: 18:00)',
                courtNumber: 'number (старый номер корта)',
              },
              newMatch: {
                date: 'string (новая дата, например: 2025-12-21)',
                time: 'string (новое время, например: 19:00)',
                courtNumber: 'number (новый номер корта)',
              },
              reason: 'string (причина изменения)',
            },
          },
          { status: 400 }
        );
      }

      case 'group_stage_results': {
        const missingFields = [
          'resultsUrl (ссылка на результаты)',
          'nextStage (информация о следующем этапе)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            resultsUrl: 'string (URL страницы с результатами)',
            nextStage: 'string (информация о следующем этапе)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              resultsUrl: 'string (URL страницы с результатами)',
              nextStage: 'string (информация о следующем этапе)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              resultsUrl: 'string (URL страницы с результатами)',
              nextStage: 'string (информация о следующем этапе)',
            },
          },
          { status: 400 }
        );
      }

      case 'finals_winners': {
        const missingFields = [
          'position (позиция участника)',
          'prize (приз, если есть)',
          'finalStandingsUrl (ссылка на финальную таблицу)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            position: 'number (позиция участника, например: 1, 2, 3)',
            prize: 'string (приз, опционально)',
            finalStandingsUrl: 'string (URL финальной таблицы)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              position: 'number (позиция участника, например: 1, 2, 3)',
              prize: 'string (приз, опционально)',
              finalStandingsUrl: 'string (URL финальной таблицы)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              position: 'number (позиция участника, например: 1, 2, 3)',
              prize: 'string (приз, опционально)',
              finalStandingsUrl: 'string (URL финальной таблицы)',
            },
          },
          { status: 400 }
        );
      }

      case 'post_tournament_recap': {
        const missingFields = [
          'mediaUrl (ссылка на фото/видео)',
          'recapText (текст рекапа)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            mediaUrl: 'string (URL страницы с медиа)',
            recapText: 'string (текст рекапа турнира)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              mediaUrl: 'string (URL страницы с медиа)',
              recapText: 'string (текст рекапа турнира)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              mediaUrl: 'string (URL страницы с медиа)',
              recapText: 'string (текст рекапа турнира)',
            },
          },
          { status: 400 }
        );
      }

      case 'tournament_feedback': {
        const missingFields = [
          'feedbackUrl (ссылка на форму обратной связи)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            feedbackUrl: 'string (URL формы обратной связи)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              feedbackUrl: 'string (URL формы обратной связи)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              feedbackUrl: 'string (URL формы обратной связи)',
            },
          },
          { status: 400 }
        );
      }

      case 'tournament_cancelled': {
        const missingFields = [
          'reason (причина отмены)',
          'refundInfo (информация о возврате)',
          'newDates (новые даты, если турнир перенесен)',
        ];
        console.error(`[send-email] Template "${template}" requires additional data:`, {
          template,
          participantId: registrationId,
          tournamentId,
          missingFields,
          requiredData: {
            reason: 'string (причина отмены/переноса)',
            refundInfo: 'string (информация о возврате средств)',
            newDates: 'string (новые даты, если турнир перенесен, опционально)',
          },
        });
        const detailedMessage = `Шаблон "${template}" требует дополнительных данных:\n\nОтсутствующие поля:\n${missingFields.map(field => `  • ${field}`).join('\n')}\n\nТребуемая структура данных:\n${JSON.stringify({
              reason: 'string (причина отмены/переноса)',
              refundInfo: 'string (информация о возврате средств)',
              newDates: 'string (новые даты, если турнир перенесен, опционально)',
            }, null, 2)}`;
        
        return NextResponse.json(
          { 
            error: 'Template requires additional data',
            message: detailedMessage,
            missingFields,
            requiredData: {
              reason: 'string (причина отмены/переноса)',
              refundInfo: 'string (информация о возврате средств)',
              newDates: 'string (новые даты, если турнир перенесен, опционально)',
            },
          },
          { status: 400 }
        );
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

