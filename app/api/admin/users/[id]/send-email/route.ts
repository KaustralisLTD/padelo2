import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import {
  sendEmailVerification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendChangeEmailOldAddressEmail,
  sendChangeEmailNewAddressEmail,
  sendAccountDeletedEmail,
} from '@/lib/email';
import {
  getTournamentRegistrationEmailTemplate,
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
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session || (session.role !== 'superadmin' && session.role !== 'staff')) {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { template, locale = 'en' } = body;

    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    // Получаем данные пользователя
    const pool = getDbPool();
    const [users] = await pool.execute(
      `SELECT id, email, first_name, last_name, preferred_language, password_hash FROM users WHERE id = ?`,
      [userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    const userLocale = user.preferred_language || locale;
    const firstName = user.first_name || 'User';
    const lastName = user.last_name || '';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;

    // Отправляем email в зависимости от выбранного шаблона
    let emailSent = false;

    switch (template) {
      case 'email_verification': {
        try {
          const verificationToken = crypto.randomBytes(32).toString('hex');
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
          const verificationUrl = `${siteUrl}/${userLocale}/verify-email?token=${verificationToken}`;
          
          // Сохраняем токен в БД
          await pool.execute(
            'UPDATE users SET email_verification_token = ? WHERE id = ?',
            [verificationToken, userId]
          );

          emailSent = await sendEmailVerification(
            user.email,
            firstName,
            verificationToken,
            userLocale
          );
        } catch (error: any) {
          console.error('[send-email] Error in email_verification:', error);
          throw new Error(`Failed to send email verification: ${error.message}`);
        }
        break;
      }

      case 'welcome': {
        try {
          // Генерируем временный пароль, если его нет
          let temporaryPassword: string | undefined;
          if (!user.password_hash) {
            temporaryPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(temporaryPassword, 10);
            await pool.execute(
              'UPDATE users SET password_hash = ?, temporary_password = ? WHERE id = ?',
              [passwordHash, temporaryPassword, userId]
            );
          } else {
            // Проверяем, есть ли временный пароль
            const [tempPassRows] = await pool.execute(
              'SELECT temporary_password FROM users WHERE id = ?',
              [userId]
            ) as any[];
            temporaryPassword = tempPassRows[0]?.temporary_password;
          }

          emailSent = await sendWelcomeEmail(
            user.email,
            firstName,
            userLocale,
            temporaryPassword
          );
        } catch (error: any) {
          console.error('[send-email] Error in welcome:', error);
          throw new Error(`Failed to send welcome email: ${error.message}`);
        }
        break;
      }

      case 'password_reset': {
        try {
          const resetToken = crypto.randomBytes(32).toString('hex');
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
          const resetUrl = `${siteUrl}/${userLocale}/reset-password?token=${resetToken}`;
          
          // Сохраняем токен в БД
          await pool.execute(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
            [resetToken, userId]
          );

          emailSent = await sendPasswordResetEmail(
            user.email,
            firstName,
            resetToken,
            userLocale
          );
        } catch (error: any) {
          console.error('[send-email] Error in password_reset:', error);
          throw new Error(`Failed to send password reset email: ${error.message}`);
        }
        break;
      }

      case 'password_changed': {
        try {
          // Генерируем новый пароль для демонстрации
          const newPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
          const bcrypt = require('bcryptjs');
          const passwordHash = await bcrypt.hash(newPassword, 10);
          
          await pool.execute(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, userId]
          );

          const timestamp = new Date().toLocaleString(userLocale);
          emailSent = await sendPasswordChangedEmail(
            user.email,
            firstName,
            userLocale,
            timestamp,
            newPassword
          );
        } catch (error: any) {
          console.error('[send-email] Error in password_changed:', error);
          throw new Error(`Failed to send password changed email: ${error.message}`);
        }
        break;
      }

      case 'change_email_old': {
        try {
          const newEmail = `new-${user.email}`; // Пример нового email
          const cancelToken = crypto.randomBytes(32).toString('hex');
          
          emailSent = await sendChangeEmailOldAddressEmail(
            user.email,
            newEmail,
            firstName,
            cancelToken,
            userLocale
          );
        } catch (error: any) {
          console.error('[send-email] Error in change_email_old:', error);
          throw new Error(`Failed to send change email old address email: ${error.message}`);
        }
        break;
      }

      case 'change_email_new': {
        try {
          const newEmail = `new-${user.email}`; // Пример нового email
          const confirmToken = crypto.randomBytes(32).toString('hex');
          
          emailSent = await sendChangeEmailNewAddressEmail(
            newEmail,
            firstName,
            confirmToken,
            userLocale
          );
        } catch (error: any) {
          console.error('[send-email] Error in change_email_new:', error);
          throw new Error(`Failed to send change email new address email: ${error.message}`);
        }
        break;
      }

      case 'account_deleted': {
        try {
          const deletedAt = new Date().toLocaleString(userLocale);
          emailSent = await sendAccountDeletedEmail(
            user.email,
            firstName,
            userLocale,
            deletedAt
          );
        } catch (error: any) {
          console.error('[send-email] Error in account_deleted:', error);
          throw new Error(`Failed to send account deleted email: ${error.message}`);
        }
        break;
      }

      // Tournament templates - требуют дополнительных данных
      case 'tournament_registration':
      case 'tournament_confirmed':
      case 'tournament_waiting_list':
      case 'tournament_spot_confirmed':
      case 'payment_received':
      case 'payment_failed':
      case 'tournament_schedule_published':
      case 'match_reminder_1day':
      case 'match_reminder_sameday':
      case 'schedule_change':
      case 'group_stage_results':
      case 'finals_winners':
      case 'post_tournament_recap':
      case 'tournament_feedback':
      case 'tournament_cancelled': {
        return NextResponse.json(
          {
            error: 'Tournament templates require tournament data',
            message: 'This template requires tournament-specific data. Please use the tournament participants page to send tournament-related emails.',
            missingFields: ['tournament_id', 'tournament_data'],
          },
          { status: 400 }
        );
      }

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        );
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${user.email}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending email to user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

