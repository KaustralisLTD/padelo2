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
         WHERE email = ? AND confirmed = TRUE
         ORDER BY created_at DESC`,
        [result.user.email]
      ) as any[];
      
      console.log(`[verify-email] STEP 1: Found ${confirmedRegistrations.length} confirmed registrations for ${result.user.email}`);
      
      // Детальное логирование каждой регистрации
      confirmedRegistrations.forEach((reg: any, index: number) => {
        console.log(`[verify-email] STEP 1.${index + 1}: Registration ${reg.id}:`, {
          registration_type: reg.registration_type,
          adults_count: reg.adults_count,
          children_count: reg.children_count,
          guest_children_raw: reg.guest_children,
          guest_children_type: typeof reg.guest_children,
          guest_children_is_null: reg.guest_children === null,
          guest_children_is_undefined: reg.guest_children === undefined,
          locale: reg.locale,
        });
      });
      
      console.log(`[verify-email] Confirmed tournament registrations and updated user_id for user ${result.user.id} (${result.user.email})`);
      
      // Отправляем письма подтверждения для гостевых регистраций
      for (const reg of confirmedRegistrations) {
        if (reg.registration_type === 'guest') {
          console.log(`[verify-email] STEP 2: Processing guest registration ${reg.id}`);
          
          try {
            const { getTournament } = await import('@/lib/tournaments');
            const tournament = reg.tournament_id ? await getTournament(reg.tournament_id) : null;
            
            if (tournament) {
              console.log(`[verify-email] STEP 3: Tournament found: ${tournament.id}, guest price: ${tournament.guestTicket?.price}`);
              
              const { sendGuestTournamentRegistrationConfirmedEmail } = await import('@/lib/email');
              
              // Парсим данные о детях
              console.log(`[verify-email] STEP 4: Parsing guest_children for registration ${reg.id}`);
              console.log(`[verify-email] STEP 4.1: guest_children value:`, {
                value: reg.guest_children,
                type: typeof reg.guest_children,
                is_null: reg.guest_children === null,
                is_undefined: reg.guest_children === undefined,
                is_string: typeof reg.guest_children === 'string',
                is_object: typeof reg.guest_children === 'object',
                string_length: typeof reg.guest_children === 'string' ? reg.guest_children.length : 'N/A',
              });
              
              let childrenAges: number[] = [];
              let parsedGuestChildren: Array<{ age: number }> = [];
              if (reg.guest_children) {
                try {
                  console.log(`[verify-email] STEP 4.2: Attempting to parse guest_children`);
                  const guestChildren = typeof reg.guest_children === 'string' 
                    ? JSON.parse(reg.guest_children) 
                    : reg.guest_children;
                  
                  console.log(`[verify-email] STEP 4.3: Parsed guestChildren:`, {
                    parsed: guestChildren,
                    type: typeof guestChildren,
                    is_array: Array.isArray(guestChildren),
                    length: Array.isArray(guestChildren) ? guestChildren.length : 'N/A',
                  });
                  
                  if (Array.isArray(guestChildren)) {
                    parsedGuestChildren = guestChildren;
                    childrenAges = guestChildren.map((child: any) => {
                        console.log(`[verify-email] STEP 4.4: Processing child:`, child);
                        return child.age;
                      }).filter((age: number) => {
                        const isValid = age !== undefined && age !== null;
                        console.log(`[verify-email] STEP 4.5: Child age ${age} is valid: ${isValid}`);
                        return isValid;
                      });
                  }
                  
                  console.log(`[verify-email] STEP 4.6: Final childrenAges array:`, childrenAges);
                } catch (e) {
                  console.error(`[verify-email] STEP 4.ERROR: Error parsing guest_children:`, {
                    error: e,
                    message: e instanceof Error ? e.message : String(e),
                    stack: e instanceof Error ? e.stack : undefined,
                    guest_children_value: reg.guest_children,
                  });
                }
              } else {
                console.log(`[verify-email] STEP 4.SKIP: guest_children is falsy, skipping parsing`);
              }
              
              console.log(`[verify-email] STEP 5: Calculating counts and prices`);
              
              const adultsCount = reg.adults_count ? parseInt(String(reg.adults_count)) : 1;
              // Если childrenCount равен 0 или null, но есть guestChildren, используем длину массива
              const childrenCount = reg.children_count !== null && reg.children_count !== undefined && reg.children_count !== 0
                ? parseInt(String(reg.children_count))
                : (Array.isArray(parsedGuestChildren) ? parsedGuestChildren.length : 0);
              const guestPrice = tournament.guestTicket?.price ? parseFloat(String(tournament.guestTicket.price)) : 0;
              
              console.log(`[verify-email] STEP 5.1: Raw values from DB:`, {
                adults_count_raw: reg.adults_count,
                children_count_raw: reg.children_count,
                adultsCount_parsed: adultsCount,
                childrenCount_parsed: childrenCount,
                guestPrice: guestPrice,
              });
              
              // Дети до 5 лет бесплатно, остальные платят полную цену
              const freeChildrenCount = childrenAges.filter((age: number) => age < 5).length;
              console.log(`[verify-email] STEP 5.2: Children analysis:`, {
                childrenAges_length: childrenAges.length,
                childrenAges_array: childrenAges,
                freeChildrenCount: freeChildrenCount,
                childrenCount: childrenCount,
              });
              
              // Если childrenCount > 0, но childrenAges пустой, считаем всех платными
              const paidChildrenCount = childrenCount > 0 && childrenAges.length === 0 
                ? childrenCount 
                : Math.max(0, childrenCount - freeChildrenCount);
              
              console.log(`[verify-email] STEP 5.3: Paid children calculation:`, {
                condition: childrenCount > 0 && childrenAges.length === 0,
                paidChildrenCount: paidChildrenCount,
              });
              
              const adultsTotal = adultsCount * guestPrice;
              const childrenTotal = paidChildrenCount * guestPrice;
              const totalPrice = adultsTotal + childrenTotal;
              
              console.log(`[verify-email] STEP 5.4: Price calculation:`, {
                adultsTotal: adultsTotal,
                childrenTotal: childrenTotal,
                totalPrice: totalPrice,
                formula: `${adultsCount} × ${guestPrice} + ${paidChildrenCount} × ${guestPrice} = ${totalPrice}`,
              });
              
              // Дополнительная проверка и логирование
              if (childrenCount > 0 && childrenAges.length === 0) {
                console.warn(`[verify-email] STEP 5.WARNING: childrenCount=${childrenCount} but childrenAges is empty. All children will be considered paid.`);
              }
              
              // Проверяем, что totalPrice правильно рассчитан
              const expectedTotal = adultsCount * guestPrice + paidChildrenCount * guestPrice;
              if (Math.abs(totalPrice - expectedTotal) > 0.01) {
                console.error(`[verify-email] STEP 5.ERROR: Price calculation mismatch!`, {
                  adultsCount,
                  childrenCount,
                  paidChildrenCount,
                  guestPrice,
                  totalPrice,
                  expectedTotal,
                  difference: Math.abs(totalPrice - expectedTotal),
                });
              }
              
              // Используем locale из регистрации, если есть, иначе из пользователя
              const registrationLocale = reg.locale || locale;
              
              console.log(`[verify-email] STEP 6: Preparing email data:`, {
                email: result.user.email,
                firstName: reg.first_name || result.user.firstName,
                lastName: reg.last_name || result.user.lastName,
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
                guest_children_raw: reg.guest_children,
              });
              
              console.log(`[verify-email] STEP 7: Calling sendGuestTournamentRegistrationConfirmedEmail with:`, {
                email: result.user.email,
                adultsCount,
                childrenCount,
                childrenAges,
                totalPrice,
                locale: registrationLocale,
                tournament_guestTicket_price: tournament.guestTicket?.price,
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
              
              console.log(`[verify-email] STEP 8: Email sent successfully for tournament ${tournament.id} to ${result.user.email}`);
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

