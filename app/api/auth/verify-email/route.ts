import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/users';
import { sendWelcomeEmail } from '@/lib/email';
import { createSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to verify email' },
        { status: 400 }
      );
    }

    if (!result.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Логируем подтверждение email
    await logAction('verify_email', 'user', {
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.role,
      entityId: result.user.id,
      details: {
        verificationToken: token.substring(0, 8) + '...', // Только первые 8 символов для безопасности
        verifiedAt: new Date().toISOString(),
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    // Send welcome email - get locale and temporary password from user's data
    const pool = getDbPool();
    let locale = 'en'; // Default fallback
    let temporaryPassword: string | null = null;
    
    try {
      const [users] = await pool.execute(
        'SELECT preferred_language, temporary_password FROM users WHERE id = ?',
        [result.user.id]
      ) as any[];
      if (users.length > 0) {
        if (users[0].preferred_language) {
          locale = users[0].preferred_language;
          console.log(`[verify-email] Using user preferred language: ${locale}`);
        }
        temporaryPassword = users[0].temporary_password || null;
        if (temporaryPassword) {
          console.log(`[verify-email] Found temporary password for user ${result.user.id}`);
        }
      }
      
      if (!locale || locale === 'en') {
        // Fallback: try URL locale
        const url = new URL(request.url);
        const localeFromUrl = url.pathname.split('/')[1];
        if (localeFromUrl && ['en', 'ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'].includes(localeFromUrl)) {
          locale = localeFromUrl;
          console.log(`[verify-email] Using URL locale: ${locale}`);
        } else {
          // Final fallback: accept-language header
          locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
          console.log(`[verify-email] Using accept-language header: ${locale}`);
        }
      }
    } catch (e) {
      console.error('[verify-email] Error getting user data:', e);
      // Fallback to accept-language header
      locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
    }
    
    console.log(`[verify-email] Sending welcome email to ${result.user.email} with locale: ${locale}${temporaryPassword ? ' (with temporary password)' : ' (NO temporary password)'}`);
    console.log(`[verify-email] Temporary password value: ${temporaryPassword ? temporaryPassword.substring(0, 3) + '...' : 'null/undefined'}`);
    await sendWelcomeEmail(result.user.email, result.user.firstName, locale, temporaryPassword || undefined);
    
    // Логируем отправку welcome email
    await logAction('send_email', 'welcome', {
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.role,
      entityId: result.user.id,
      details: {
        emailType: 'welcome',
        locale: locale,
        hasTemporaryPassword: !!temporaryPassword,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});
    
    // Clear temporary password after sending welcome email
    if (temporaryPassword) {
      try {
        await pool.execute(
          'UPDATE users SET temporary_password = NULL WHERE id = ?',
          [result.user.id]
        );
        console.log(`[verify-email] Cleared temporary password for user ${result.user.id}`);
      } catch (e) {
        console.error('[verify-email] Error clearing temporary password:', e);
      }
    }

    // Подтверждаем все регистрации на турниры для этого пользователя и обновляем user_id
    try {
      // Сначала обновляем user_id для регистраций без него
      await pool.execute(
        `UPDATE tournament_registrations 
         SET user_id = ? 
         WHERE email = ? AND (user_id IS NULL OR user_id = '')`,
        [result.user.id, result.user.email]
      );
      
      // Затем подтверждаем все регистрации
      const [updatedRegistrations] = await pool.execute(
        `UPDATE tournament_registrations 
         SET confirmed = TRUE, confirmed_at = NOW() 
         WHERE email = ? AND confirmed = FALSE`,
        [result.user.email]
      ) as any[];
      
      // Получаем информацию о подтвержденных регистрациях для логирования и отправки писем
      const [confirmedRegistrations] = await pool.execute(
        `SELECT id, tournament_id, tournament_name, categories, registration_type, first_name, last_name, adults_count, children_count, guest_children, locale
         FROM tournament_registrations 
         WHERE email = ? AND confirmed = TRUE`,
        [result.user.email]
      ) as any[];
      
      console.log(`[verify-email] Confirmed tournament registrations and updated user_id for user ${result.user.id} (${result.user.email})`);
      
      // Отправляем письма подтверждения для гостевых регистраций
      for (const reg of confirmedRegistrations) {
        if (reg.registration_type === 'guest') {
          try {
            const { getTournament } = await import('@/lib/tournaments');
            const tournament = reg.tournament_id ? await getTournament(reg.tournament_id) : null;
            
            if (tournament) {
              const { sendGuestTournamentRegistrationConfirmedEmail } = await import('@/lib/email');
              
              // Парсим данные о детях
              let childrenAges: number[] = [];
              if (reg.guest_children) {
                try {
                  const guestChildren = typeof reg.guest_children === 'string' 
                    ? JSON.parse(reg.guest_children) 
                    : reg.guest_children;
                  childrenAges = Array.isArray(guestChildren) 
                    ? guestChildren.map((child: any) => child.age).filter((age: number) => age !== undefined)
                    : [];
                } catch (e) {
                  console.error('[verify-email] Error parsing guest_children:', e);
                }
              }
              
              const adultsCount = reg.adults_count || 1;
              const childrenCount = reg.children_count || 0;
              const guestPrice = tournament.guestTicket?.price || 0;
              
              // Дети до 5 лет бесплатно, остальные платят полную цену
              const freeChildrenCount = childrenAges.filter((age: number) => age < 5).length;
              const paidChildrenCount = childrenCount - freeChildrenCount;
              const totalPrice = (adultsCount * guestPrice) + (paidChildrenCount * guestPrice);
              
              // Используем locale из регистрации, если есть, иначе из пользователя
              const registrationLocale = reg.locale || locale;
              
              // Логируем для отладки
              console.log(`[verify-email] Guest registration confirmed email data:`, {
                email: result.user.email,
                adultsCount,
                childrenCount,
                childrenAges,
                freeChildrenCount,
                paidChildrenCount,
                guestPrice,
                totalPrice,
                registrationLocale,
                userLocale: locale,
                regLocale: reg.locale,
                guest_children: reg.guest_children,
              });
              
              await sendGuestTournamentRegistrationConfirmedEmail({
                email: result.user.email,
                firstName: reg.first_name || result.user.firstName,
                lastName: reg.last_name || result.user.lastName,
                tournament: {
                  id: tournament.id,
                  name: tournament.name,
                  startDate: tournament.startDate,
                  endDate: tournament.endDate,
                  location: tournament.location,
                  locationAddress: tournament.locationAddress,
                  locationCoordinates: tournament.locationCoordinates,
                  guestTicket: tournament.guestTicket,
                  translations: tournament.translations,
                },
                adultsCount,
                childrenCount,
                childrenAges,
                totalPrice,
                locale: registrationLocale,
              });
              
              console.log(`[verify-email] Sent guest registration confirmed email for tournament ${tournament.id} to ${result.user.email}`);
            }
          } catch (emailError: any) {
            console.error(`[verify-email] Error sending guest confirmation email for registration ${reg.id}:`, emailError);
            // Не прерываем процесс, если письмо не отправилось
          }
        }
      }
      
      // Логируем подтверждение регистраций на турниры
      if (confirmedRegistrations.length > 0) {
        for (const registration of confirmedRegistrations) {
          await logAction('confirm', 'tournament_registration', {
            userId: result.user.id,
            userEmail: result.user.email,
            userRole: result.user.role,
            entityId: registration.id,
            details: {
              tournamentId: registration.tournament_id,
              tournamentName: registration.tournament_name,
              categories: (() => {
                try {
                  if (registration.categories) {
                    if (typeof registration.categories === 'string') {
                      try {
                        const parsed = JSON.parse(registration.categories);
                        return Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : [];
                      } catch {
                        return [registration.categories];
                      }
                    } else if (Array.isArray(registration.categories)) {
                      return registration.categories;
                    }
                  }
                } catch (e) {
                  console.error('[verify-email] Error parsing categories:', e);
                }
                return [];
              })(),
              confirmedAt: new Date().toISOString(),
            },
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[verify-email] Error confirming tournament registrations:', e);
      // Не прерываем процесс верификации, если не удалось обновить регистрации
    }

    // Create session for verified user
    const sessionToken = await createSession(result.user.id, 7); // 7 days

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to PadelO2!',
      token: sessionToken,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

