// Centralized email sending utility
// Uses Resend service

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend service
 * Falls back to console.log if Resend is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from, replyTo } = options;
  const fromEmail = from || process.env.SMTP_FROM || 'noreply@padelo2.com';
  const recipients = Array.isArray(to) ? to : [to];

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: fromEmail,
        to: recipients,
        subject,
        html,
        reply_to: replyTo,
      });
      console.log(`✅ Email sent via Resend to ${recipients.join(', ')}`);
      return true;
    }
    
    // Fallback: log to console (development only)
    console.log(`[Email] Would send email to ${recipients.join(', ')}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${fromEmail}`);
    console.log(`[Email] Configure RESEND_API_KEY to enable email sending`);
    return true; // Return true even in fallback mode
  } catch (error) {
    console.error('❌ Email sending error:', error);
    // Don't fail the request if email fails
    return false;
  }
}

/**
 * Send contact form notification to admin
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string,
  topic?: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelo2.com';
  const subject = topic ? `New Contact Form: ${topic}` : 'New Contact Form Submission';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You can reply directly to: <a href="mailto:${email}">${email}</a>
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: email,
  });
}

/**
 * Send investment request notification to admin
 */
export async function sendInvestmentRequestEmail(
  name: string,
  email: string,
  company: string,
  investmentSize: string,
  message?: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelo2.com';
  const subject = 'New Investment Request';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        New Investment Request
      </h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      <p><strong>Investment Size:</strong> ${investmentSize}</p>
      ${message ? `
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      ` : ''}
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You can reply directly to: <a href="mailto:${email}">${email}</a>
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: email,
  });
}

/**
 * Send email verification link to new user
 */
export async function sendEmailVerification(
  email: string,
  firstName: string,
  verificationToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.padelo2.com';
  const verificationUrl = `${siteUrl}/${locale}/verify-email?token=${verificationToken}`;
  
  const translations: Record<string, { subject: string; greeting: string; message: string; button: string; footer: string }> = {
    en: {
      subject: 'Verify your email address - PadelO2',
      greeting: `Hello ${firstName}!`,
      message: 'Thank you for registering on PadelO2. Please verify your email address by clicking the button below:',
      button: 'Verify Email',
      footer: 'If you did not create an account, please ignore this email.'
    },
    uk: {
      subject: 'Підтвердіть вашу електронну адресу - PadelO2',
      greeting: `Привіт ${firstName}!`,
      message: 'Дякуємо за реєстрацію на PadelO2. Будь ласка, підтвердіть вашу електронну адресу, натиснувши кнопку нижче:',
      button: 'Підтвердити Email',
      footer: 'Якщо ви не створювали обліковий запис, проігноруйте цей лист.'
    },
    ru: {
      subject: 'Подтвердите ваш email адрес - PadelO2',
      greeting: `Привет ${firstName}!`,
      message: 'Спасибо за регистрацию на PadelO2. Пожалуйста, подтвердите ваш email адрес, нажав кнопку ниже:',
      button: 'Подтвердить Email',
      footer: 'Если вы не создавали аккаунт, проигнорируйте это письмо.'
    }
  };
  
  const t = translations[locale] || translations.en;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🎾 PadelO2</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">${t.greeting}</h2>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">${t.message}</p>
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">${t.button}</a>
                  </div>
                  <p style="color: #8a8a8a; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">${t.footer}</p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8e8e8;">
                    <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">Или скопируйте эту ссылку:</p>
                    <p style="margin: 0;">
                      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all; font-size: 12px; text-decoration: none;">${verificationUrl}</a>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e8e8;">
                  <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PadelO2. Все права защищены.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

/**
 * Send welcome email after email verification
 * Uses new email template from email-templates.ts
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getWelcomeEmailTemplate } = await import('@/lib/email-templates');
  
  const html = getWelcomeEmailTemplate({
    firstName,
    locale,
  });

  const translations: Record<string, string> = {
    en: 'Welcome to PadelO₂.com',
    ru: 'Добро пожаловать на PadelO₂.com',
    ua: 'Ласкаво просимо на PadelO₂.com',
    es: 'Bienvenido a PadelO₂.com',
    fr: 'Bienvenue sur PadelO₂.com',
    de: 'Willkommen bei PadelO₂.com',
    it: 'Benvenuto su PadelO₂.com',
    ca: 'Benvingut a PadelO₂.com',
    nl: 'Welkom bij PadelO₂.com',
    da: 'Velkommen til PadelO₂.com',
    sv: 'Välkommen till PadelO₂.com',
    no: 'Velkommen til PadelO₂.com',
    ar: 'مرحبا بك في PadelO₂.com',
    zh: '欢迎来到 PadelO₂.com'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send role change notification
 */
export async function sendRoleChangeNotification(
  email: string,
  firstName: string,
  newRole: string,
  locale: string = 'en'
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.padelo2.com';
  
  const roleTranslations: Record<string, Record<string, string>> = {
    en: {
      superadmin: 'Super Administrator',
      tournament_admin: 'Tournament Administrator',
      manager: 'Manager',
      coach: 'Coach',
      staff: 'Staff',
      participant: 'Participant'
    },
    uk: {
      superadmin: 'Супер Адміністратор',
      tournament_admin: 'Адміністратор Турніру',
      manager: 'Менеджер',
      coach: 'Тренер',
      staff: 'Персонал',
      participant: 'Учасник'
    },
    ru: {
      superadmin: 'Супер Администратор',
      tournament_admin: 'Администратор Турнира',
      manager: 'Менеджер',
      coach: 'Тренер',
      staff: 'Персонал',
      participant: 'Участник'
    }
  };
  
  const translations: Record<string, { subject: string; greeting: string; message: string; button: string }> = {
    en: {
      subject: 'Your access rights have been updated - PadelO2',
      greeting: `Hello ${firstName}!`,
      message: `Your role has been changed to <strong>${roleTranslations.en[newRole] || newRole}</strong>. You now have access to additional features and can manage tournaments.`,
      button: 'Go to Admin Panel'
    },
    uk: {
      subject: 'Ваші права доступу оновлено - PadelO2',
      greeting: `Привіт ${firstName}!`,
      message: `Вашу роль змінено на <strong>${roleTranslations.uk[newRole] || newRole}</strong>. Тепер ви маєте доступ до додаткових функцій та можете керувати турнірами.`,
      button: 'Перейти до Адмін Панелі'
    },
    ru: {
      subject: 'Ваши права доступа обновлены - PadelO2',
      greeting: `Привет ${firstName}!`,
      message: `Ваша роль изменена на <strong>${roleTranslations.ru[newRole] || newRole}</strong>. Теперь вы имеете доступ к дополнительным функциям и можете управлять турнирами.`,
      button: 'Перейти в Админ Панель'
    }
  };
  
  const t = translations[locale] || translations.en;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🎾 PadelO2</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">${t.greeting}</h2>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">${t.message}</p>
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea;">
                    <p style="color: #1a1a1a; font-size: 16px; margin: 0; font-weight: 600;">Ваша новая роль: ${roleTranslations.ru[newRole] || newRole}</p>
                  </div>
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${siteUrl}/${locale}/admin" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">${t.button}</a>
                  </div>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 30px;">
                    <p style="color: #4a4a4a; font-size: 14px; margin: 0; line-height: 1.6;">
                      <strong>✨ Что дальше?</strong><br>
                      Теперь у вас есть доступ к админ-панели, где вы можете управлять турнирами, участниками и настройками системы.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e8e8;">
                  <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PadelO2. Все права защищены.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getPasswordResetEmailTemplate } = await import('@/lib/email-templates');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const resetUrl = `${siteUrl}/${locale}/reset-password?token=${resetToken}`;

  const html = getPasswordResetEmailTemplate({
    firstName,
    resetUrl,
    locale,
    expiresIn: '1 hour',
  });

  const translations: Record<string, string> = {
    en: 'Reset your password - PadelO₂',
    ru: 'Сброс пароля - PadelO₂',
    ua: 'Скидання пароля - PadelO₂',
    es: 'Restablecer tu contraseña - PadelO₂',
    fr: 'Réinitialiser votre mot de passe - PadelO₂',
    de: 'Passwort zurücksetzen - PadelO₂',
    it: 'Reimposta la tua password - PadelO₂',
    ca: 'Restablir la teva contrasenya - PadelO₂',
    nl: 'Reset uw wachtwoord - PadelO₂',
    da: 'Nulstil din adgangskode - PadelO₂',
    sv: 'Återställ ditt lösenord - PadelO₂',
    no: 'Tilbakestill passordet ditt - PadelO₂',
    ar: 'إعادة تعيين كلمة المرور - PadelO₂',
    zh: '重置您的密码 - PadelO₂'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  firstName: string,
  locale: string = 'en',
  timestamp?: string
): Promise<boolean> {
  const { getPasswordChangedEmailTemplate } = await import('@/lib/email-templates');

  const html = getPasswordChangedEmailTemplate({
    firstName,
    locale,
    timestamp,
  });

  const translations: Record<string, string> = {
    en: 'Your password has been changed - PadelO₂',
    ru: 'Ваш пароль был изменен - PadelO₂',
    ua: 'Ваш пароль було змінено - PadelO₂',
    es: 'Tu contraseña ha sido cambiada - PadelO₂',
    fr: 'Votre mot de passe a été modifié - PadelO₂',
    de: 'Ihr Passwort wurde geändert - PadelO₂',
    it: 'La tua password è stata modificata - PadelO₂',
    ca: 'La teva contrasenya ha estat canviada - PadelO₂',
    nl: 'Uw wachtwoord is gewijzigd - PadelO₂',
    da: 'Din adgangskode er blevet ændret - PadelO₂',
    sv: 'Ditt lösenord har ändrats - PadelO₂',
    no: 'Passordet ditt har blitt endret - PadelO₂',
    ar: 'تم تغيير كلمة المرور الخاصة بك - PadelO₂',
    zh: '您的密码已更改 - PadelO₂'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send new device login notification
 */
export async function sendNewDeviceLoginEmail(
  email: string,
  firstName: string,
  deviceInfo?: string,
  location?: string,
  ipAddress?: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getNewDeviceLoginEmailTemplate } = await import('@/lib/email-templates');

  const html = getNewDeviceLoginEmailTemplate({
    firstName,
    deviceInfo,
    location,
    ipAddress,
    timestamp: new Date().toLocaleString(locale),
    locale,
  });

  const translations: Record<string, string> = {
    en: 'New device login detected - PadelO₂',
    ru: 'Обнаружен вход с нового устройства - PadelO₂',
    ua: 'Виявлено вхід з нового пристрою - PadelO₂',
    es: 'Inicio de sesión desde nuevo dispositivo detectado - PadelO₂',
    fr: 'Connexion depuis un nouvel appareil détectée - PadelO₂',
    de: 'Anmeldung von neuem Gerät erkannt - PadelO₂',
    it: 'Accesso da nuovo dispositivo rilevato - PadelO₂',
    ca: 'Inici de sessió des de nou dispositiu detectat - PadelO₂',
    nl: 'Aanmelding vanaf nieuw apparaat gedetecteerd - PadelO₂',
    da: 'Login fra ny enhed registreret - PadelO₂',
    sv: 'Inloggning från ny enhet upptäckt - PadelO₂',
    no: 'Innlogging fra ny enhet oppdaget - PadelO₂',
    ar: 'تم اكتشاف تسجيل الدخول من جهاز جديد - PadelO₂',
    zh: '检测到新设备登录 - PadelO₂'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send email change notification to old address
 */
export async function sendChangeEmailOldAddressEmail(
  oldEmail: string,
  newEmail: string,
  firstName: string,
  cancelToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getChangeEmailOldAddressEmailTemplate } = await import('@/lib/email-templates');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const cancelUrl = `${siteUrl}/${locale}/cancel-email-change?token=${cancelToken}`;

  const html = getChangeEmailOldAddressEmailTemplate({
    firstName,
    oldEmail,
    newEmail,
    cancelUrl,
    locale,
  });

  const translations: Record<string, string> = {
    en: 'Email change requested - PadelO₂',
    ru: 'Запрос на изменение email - PadelO₂',
    ua: 'Запит на зміну email - PadelO₂',
    es: 'Solicitud de cambio de correo electrónico - PadelO₂',
    fr: 'Demande de changement d\'e-mail - PadelO₂',
    de: 'E-Mail-Änderung angefordert - PadelO₂',
    it: 'Richiesta di modifica email - PadelO₂',
    ca: 'Sol·licitud de canvi de correu electrònic - PadelO₂',
    nl: 'E-mailwijziging aangevraagd - PadelO₂',
    da: 'E-mailændring anmodet - PadelO₂',
    sv: 'E-poständring begärd - PadelO₂',
    no: 'E-postendring forespurt - PadelO₂',
    ar: 'تم طلب تغيير البريد الإلكتروني - PadelO₂',
    zh: '请求更改电子邮件 - PadelO₂'
  };

  return await sendEmail({
    to: oldEmail,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send email change confirmation to new address
 */
export async function sendChangeEmailNewAddressEmail(
  newEmail: string,
  firstName: string,
  confirmToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getChangeEmailNewAddressEmailTemplate } = await import('@/lib/email-templates');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const confirmUrl = `${siteUrl}/${locale}/confirm-email-change?token=${confirmToken}`;

  const html = getChangeEmailNewAddressEmailTemplate({
    firstName,
    newEmail,
    confirmUrl,
    locale,
    expiresIn: '24 hours',
  });

  const translations: Record<string, string> = {
    en: 'Confirm your new email address - PadelO₂',
    ru: 'Подтвердите ваш новый email адрес - PadelO₂',
    ua: 'Підтвердіть вашу нову email адресу - PadelO₂',
    es: 'Confirma tu nueva dirección de correo electrónico - PadelO₂',
    fr: 'Confirmez votre nouvelle adresse e-mail - PadelO₂',
    de: 'Bestätigen Sie Ihre neue E-Mail-Adresse - PadelO₂',
    it: 'Conferma il tuo nuovo indirizzo email - PadelO₂',
    ca: 'Confirma la teva nova adreça de correu electrònic - PadelO₂',
    nl: 'Bevestig uw nieuwe e-mailadres - PadelO₂',
    da: 'Bekræft din nye e-mailadresse - PadelO₂',
    sv: 'Bekräfta din nya e-postadress - PadelO₂',
    no: 'Bekreft din nye e-postadresse - PadelO₂',
    ar: 'أكد عنوان بريدك الإلكتروني الجديد - PadelO₂',
    zh: '确认您的新电子邮件地址 - PadelO₂'
  };

  return await sendEmail({
    to: newEmail,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionConfirmEmail(
  email: string,
  firstName: string,
  confirmToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const { getAccountDeletionConfirmEmailTemplate } = await import('@/lib/email-templates');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const confirmUrl = `${siteUrl}/${locale}/confirm-account-deletion?token=${confirmToken}`;

  const html = getAccountDeletionConfirmEmailTemplate({
    firstName,
    confirmUrl,
    locale,
    expiresIn: '7 days',
  });

  const translations: Record<string, string> = {
    en: 'Confirm account deletion - PadelO₂',
    ru: 'Подтверждение удаления аккаунта - PadelO₂',
    ua: 'Підтвердження видалення акаунта - PadelO₂',
    es: 'Confirmar eliminación de cuenta - PadelO₂',
    fr: 'Confirmer la suppression du compte - PadelO₂',
    de: 'Kontolöschung bestätigen - PadelO₂',
    it: 'Conferma eliminazione account - PadelO₂',
    ca: 'Confirmar eliminació de compte - PadelO₂',
    nl: 'Accountverwijdering bevestigen - PadelO₂',
    da: 'Bekræft kontosletning - PadelO₂',
    sv: 'Bekräfta kontoborttagning - PadelO₂',
    no: 'Bekreft kontosletting - PadelO₂',
    ar: 'تأكيد حذف الحساب - PadelO₂',
    zh: '确认删除账户 - PadelO₂'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

/**
 * Send account deleted final notice
 */
export async function sendAccountDeletedEmail(
  email: string,
  firstName: string,
  locale: string = 'en',
  deletedAt?: string
): Promise<boolean> {
  const { getAccountDeletedEmailTemplate } = await import('@/lib/email-templates');

  const html = getAccountDeletedEmailTemplate({
    firstName,
    deletedAt,
    locale,
  });

  const translations: Record<string, string> = {
    en: 'Your account has been deleted - PadelO₂',
    ru: 'Ваш аккаунт был удален - PadelO₂',
    ua: 'Ваш акаунт було видалено - PadelO₂',
    es: 'Tu cuenta ha sido eliminada - PadelO₂',
    fr: 'Votre compte a été supprimé - PadelO₂',
    de: 'Ihr Konto wurde gelöscht - PadelO₂',
    it: 'Il tuo account è stato eliminato - PadelO₂',
    ca: 'El teu compte ha estat eliminat - PadelO₂',
    nl: 'Uw account is verwijderd - PadelO₂',
    da: 'Din konto er blevet slettet - PadelO₂',
    sv: 'Ditt konto har tagits bort - PadelO₂',
    no: 'Kontoen din er blitt slettet - PadelO₂',
    ar: 'تم حذف حسابك - PadelO₂',
    zh: '您的账户已被删除 - PadelO₂'
  };

  return await sendEmail({
    to: email,
    subject: translations[locale] || translations.en,
    html,
  });
}

