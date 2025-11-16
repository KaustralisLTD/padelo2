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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50; margin-top: 0;">${t.greeting}</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${t.message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">${t.button}</a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">${t.footer}</p>
        <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
          Или скопируйте эту ссылку в браузер:<br>
          <a href="${verificationUrl}" style="color: #4CAF50; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

/**
 * Send welcome email after email verification
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  locale: string = 'en'
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.padelo2.com';
  
  const translations: Record<string, { subject: string; greeting: string; message: string; button: string }> = {
    en: {
      subject: 'Welcome to PadelO2!',
      greeting: `Welcome, ${firstName}!`,
      message: 'Your email has been verified successfully. You can now access all features of PadelO2 and register for tournaments.',
      button: 'Go to Dashboard'
    },
    uk: {
      subject: 'Ласкаво просимо до PadelO2!',
      greeting: `Ласкаво просимо, ${firstName}!`,
      message: 'Ваш email успішно підтверджено. Тепер ви можете отримати доступ до всіх функцій PadelO2 та реєструватися на турніри.',
      button: 'Перейти до Панелі'
    },
    ru: {
      subject: 'Добро пожаловать в PadelO2!',
      greeting: `Добро пожаловать, ${firstName}!`,
      message: 'Ваш email успешно подтвержден. Теперь вы можете получить доступ ко всем функциям PadelO2 и регистрироваться на турниры.',
      button: 'Перейти в Панель'
    }
  };
  
  const t = translations[locale] || translations.en;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50; margin-top: 0;">${t.greeting}</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${t.message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/${locale}/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">${t.button}</a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          С уважением,<br>
          Команда PadelO2
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50; margin-top: 0;">${t.greeting}</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${t.message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/${locale}/admin" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">${t.button}</a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          С уважением,<br>
          Команда PadelO2
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

