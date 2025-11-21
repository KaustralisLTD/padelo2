import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveRegistration } from '@/lib/tournament-storage';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

// Helper function to get or create user by email
async function getOrCreateUserByEmail(email: string, firstName: string, lastName: string): Promise<string | null> {
  try {
    const pool = getDbPool();
    
    // Ищем существующего пользователя по email
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (existingUsers.length > 0) {
      return existingUsers[0].id;
    }
    
    // Создаем нового пользователя с ролью 'participant'
    const userId = crypto.randomUUID();
    const defaultPassword = crypto.randomBytes(32).toString('hex'); // Временный пароль, пользователь сможет установить свой через восстановление
    
    // Хешируем пароль (используем простой хеш для демо, в продакшене используйте bcrypt)
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'participant', NOW())`,
      [userId, email, passwordHash, firstName, lastName]
    );
    
    return userId;
  } catch (error) {
    console.error('Error getting or creating user by email:', error);
    return null;
  }
}

// Helper function to send confirmation email
async function sendConfirmationEmail(email: string, confirmationUrl: string, tournamentName: string, locale: string = 'en', firstName?: string, lastName?: string) {
  try {
    // Import email template
    const { getConfirmationEmailTemplate } = await import('@/lib/email-templates');
    
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const translations: Record<string, string> = {
        en: `Confirm your registration for ${tournamentName}`,
        ru: `Подтвердите регистрацию на ${tournamentName}`,
        ua: `Підтвердіть реєстрацію на ${tournamentName}`,
        es: `Confirma tu registro para ${tournamentName}`,
        fr: `Confirmez votre inscription pour ${tournamentName}`,
        de: `Bestätigen Sie Ihre Anmeldung für ${tournamentName}`,
        it: `Conferma la tua registrazione per ${tournamentName}`,
        ca: `Confirma el teu registre per a ${tournamentName}`,
        nl: `Bevestig uw registratie voor ${tournamentName}`,
        da: `Bekræft din registrering for ${tournamentName}`,
        sv: `Bekräfta din registrering för ${tournamentName}`,
        no: `Bekreft din registrering for ${tournamentName}`,
        ar: `أكد تسجيلك لـ ${tournamentName}`,
        zh: `确认您对 ${tournamentName} 的注册`
      };
      
      const subject = translations[locale] || translations.en;
      const html = getConfirmationEmailTemplate({
        tournamentName,
        confirmationUrl,
        firstName,
        lastName,
        locale,
      });
      
      await resend.emails.send({
        from: process.env.SMTP_FROM || 'PadelO₂ <noreply@padelo2.com>',
        to: email,
        subject,
        html,
      });
      console.log(`[sendConfirmationEmail] Email sent via Resend to ${email}`);
      return;
    }
    
    // Try SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.default.send({
        from: process.env.SMTP_FROM || 'noreply@padelo2.com',
        to: email,
        subject: `Confirm your registration for ${tournamentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Tournament Registration Confirmation</h2>
            <p>Thank you for registering for ${tournamentName}!</p>
            <p>Please confirm your registration by clicking the link below:</p>
            <p><a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Registration</a></p>
            <p>Or copy this link: ${confirmationUrl}</p>
          </div>
        `,
      });
      return;
    }
    
    // Try SMTP
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `Confirm your registration for ${tournamentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Tournament Registration Confirmation</h2>
            <p>Thank you for registering for ${tournamentName}!</p>
            <p>Please confirm your registration by clicking the link below:</p>
            <p><a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Registration</a></p>
            <p>Or copy this link: ${confirmationUrl}</p>
          </div>
        `,
      });
      return;
    }
    
    // Fallback: log to console (development only)
    console.log(`[Email] Would send confirmation to ${email} for ${tournamentName}`);
    console.log(`[Email] Confirmation URL: ${confirmationUrl}`);
    console.log(`[Email] Configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP settings to enable email sending`);
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the registration if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const tokenHeader = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;
    let userId: string | null = null;

    if (tokenHeader) {
      const session = await getSession(tokenHeader);
      if (session?.userId) {
        userId = session.userId;
      }
    }
    
    // Если пользователь не залогинен, получаем или создаем user_id по email
    if (!userId && body.email) {
      userId = await getOrCreateUserByEmail(body.email, body.firstName || '', body.lastName || '');
    }
    
    // Generate a unique token for confirmation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store registration data
    const registrationData = {
      ...body,
      userId,
      token,
      createdAt: new Date().toISOString(),
      confirmed: false,
    };
    
    // Сохраняем регистрацию в БД
    try {
      await saveRegistration(token, registrationData);
      console.log(`[POST /api/tournament/register] Registration saved successfully for token: ${token.substring(0, 8)}...`);
    } catch (saveError: any) {
      console.error('[POST /api/tournament/register] Error saving registration:', saveError);
      return NextResponse.json(
        { success: false, error: 'Failed to save registration. Please try again.' },
        { status: 500 }
      );
    }
    
    // Генерируем URL для подтверждения
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${body.locale || 'en'}/tournament/confirmation?token=${token}`;
    
    // Отправляем email подтверждения
    try {
      await sendConfirmationEmail(
        body.email, 
        confirmationUrl, 
        body.tournamentName, 
        body.locale || 'en',
        body.firstName,
        body.lastName
      );
      console.log(`[POST /api/tournament/register] Confirmation email sent to: ${body.email}`);
    } catch (emailError: any) {
      console.error('[POST /api/tournament/register] Error sending email:', emailError);
      // Не прерываем регистрацию, если email не отправился - пользователь все равно зарегистрирован
    }
    
    return NextResponse.json({
      success: true,
      token,
      message: 'Registration submitted successfully. Please check your email for confirmation.',
      confirmationUrl, // Возвращаем URL для отладки
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process registration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token required' },
      { status: 400 }
    );
  }
  
  try {
    const { getRegistration } = await import('@/lib/tournament-storage');
    const registration = await getRegistration(token);
    
    if (!registration) {
      console.error(`[GET /api/tournament/register] Registration not found for token: ${token.substring(0, 8)}...`);
      return NextResponse.json(
        { error: 'Invalid or expired confirmation link. Please contact support.' },
        { status: 404 }
      );
    }
    
    // Проверяем срок действия токена (например, 7 дней)
    const createdAt = new Date(registration.createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 7) {
      console.error(`[GET /api/tournament/register] Token expired: ${token.substring(0, 8)}... (${daysSinceCreation.toFixed(1)} days old)`);
      return NextResponse.json(
        { error: 'Invalid or expired confirmation link. Please contact support.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ registration });
  } catch (error) {
    console.error('[GET /api/tournament/register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve registration' },
      { status: 500 }
    );
  }
}

