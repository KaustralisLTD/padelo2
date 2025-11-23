// Centralized email sending utility
// Uses Resend service

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string; // Plain text version for better deliverability
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend service
 * Falls back to console.log if Resend is not configured
 */
// Helper function to strip HTML and create plain text version
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, from, replyTo } = options;
  // Используем верифицированный домен из переменной окружения или padelo2.com по умолчанию
  const verifiedDomain = process.env.RESEND_FROM_DOMAIN || 'padelo2.com';
  const fromEmail = from || process.env.SMTP_FROM || `hello@${verifiedDomain}`;
  // Правильный формат для Resend: "Display Name <email@domain.com>" или просто "email@domain.com"
  // Используем простой формат без специальных символов для максимальной совместимости
  const fromName = `PadelO2 <${fromEmail}>`;
  const recipients = Array.isArray(to) ? to : [to];
  
  // Generate plain text version if not provided
  const plainText = text || htmlToText(html);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log(`[Email] Attempting to send via Resend to ${recipients.join(', ')}`);
      console.log(`[Email] From: ${fromName}`);
      console.log(`[Email] Subject: ${subject}`);
      console.log(`[Email] Using domain: ${verifiedDomain}`);
      
      const result = await resend.emails.send({
        from: fromName,
        to: recipients,
        subject,
        html,
        text: plainText, // Add plain text version for better deliverability
        reply_to: replyTo || fromEmail,
        headers: {
          // Unsubscribe headers для соответствия требованиям CAN-SPAM Act
          'List-Unsubscribe': `<${siteUrl}/unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          // Уникальный ID для трекинга (но не используем случайные значения, которые могут выглядеть как спам)
          'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          // УБРАЛИ 'Precedence': 'bulk' - это плохо для транзакционных писем!
          // 'Precedence': 'bulk' помечает письма как массовые, что снижает доставляемость
          // Для транзакционных писем лучше не указывать этот заголовок
          'X-Auto-Response-Suppress': 'All', // Подавляем автоответы
          'X-Mailer': 'PadelO2', // Идентификатор отправителя
          'X-Priority': '1', // Нормальный приоритет (не срочный, не низкий)
        },
        tags: [
          { name: 'category', value: 'transactional' },
          { name: 'type', value: 'tournament-registration' },
        ],
      });
      
      if (result.error) {
        console.error('❌ Resend API error:', result.error);
        return false;
      }
      
      console.log(`✅ Email sent via Resend to ${recipients.join(', ')}`);
      console.log(`[Email] Resend response:`, JSON.stringify(result.data || result, null, 2));
      return true;
    }
    
    // Fallback: log to console (development only)
    console.log(`[Email] RESEND_API_KEY not configured - would send email to ${recipients.join(', ')}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${fromEmail}`);
    console.log(`[Email] Configure RESEND_API_KEY to enable email sending`);
    return true; // Return true even in fallback mode
  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      response: error?.response?.data || error?.response,
    });
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
 * Uses the same design style as tournament email templates
 */
export async function sendEmailVerification(
  email: string,
  firstName: string,
  verificationToken: string,
  locale: string = 'en'
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const verificationUrl = `${siteUrl}/${locale}/verify-email?token=${verificationToken}`;
  const firstNameOnly = firstName || 'User';
  
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Verify your email address - PadelO₂',
      greeting: 'Hello',
      message: 'Thank you for registering on PadelO₂. Please verify your email address by clicking the button below:',
      button: 'Verify Email',
      notYou: 'If you did not create an account, please ignore this email.',
      footer: 'Welcome to the court',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you signed up on',
      followJourney: 'Follow the journey:'
    },
    ru: {
      subject: 'Подтвердите ваш email адрес - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Спасибо за регистрацию на PadelO₂. Пожалуйста, подтвердите ваш email адрес, нажав кнопку ниже:',
      button: 'Подтвердить Email',
      notYou: 'Если вы не создавали аккаунт, проигнорируйте это письмо.',
      footer: 'Добро пожаловать на корт',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на',
      followJourney: 'Следите за путешествием:'
    },
    ua: {
      subject: 'Підтвердіть вашу email адресу - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Дякуємо за реєстрацію на PadelO₂. Будь ласка, підтвердіть вашу email адресу, натиснувши кнопку нижче:',
      button: 'Підтвердити Email',
      notYou: 'Якщо ви не створювали акаунт, проігноруйте цей лист.',
      footer: 'Ласкаво просимо на корт',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на',
      followJourney: 'Слідкуйте за подорожжю:'
    },
    es: {
      subject: 'Verifica tu dirección de correo electrónico - PadelO₂',
      greeting: 'Hola',
      message: 'Gracias por registrarte en PadelO₂. Por favor, verifica tu dirección de correo electrónico haciendo clic en el botón a continuación:',
      button: 'Verificar Email',
      notYou: 'Si no creaste una cuenta, ignora este correo.',
      footer: 'Bienvenido a la cancha',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque te registraste en',
      followJourney: 'Sigue el viaje:'
    },
    fr: {
      subject: 'Vérifiez votre adresse e-mail - PadelO₂',
      greeting: 'Bonjour',
      message: 'Merci de vous être inscrit sur PadelO₂. Veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous:',
      button: 'Vérifier l\'Email',
      notYou: 'Si vous n\'avez pas créé de compte, ignorez cet e-mail.',
      footer: 'Bienvenue sur le terrain',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit sur',
      followJourney: 'Suivez le voyage:'
    },
    de: {
      subject: 'Bestätigen Sie Ihre E-Mail-Adresse - PadelO₂',
      greeting: 'Hallo',
      message: 'Vielen Dank für Ihre Registrierung bei PadelO₂. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf die Schaltfläche unten klicken:',
      button: 'Email bestätigen',
      notYou: 'Wenn Sie kein Konto erstellt haben, ignorieren Sie diese E-Mail.',
      footer: 'Willkommen auf dem Platz',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich auf',
      followJourney: 'Folgen Sie der Reise:'
    },
    it: {
      subject: 'Verifica il tuo indirizzo email - PadelO₂',
      greeting: 'Ciao',
      message: 'Grazie per esserti registrato su PadelO₂. Per favore, verifica il tuo indirizzo email cliccando sul pulsante qui sotto:',
      button: 'Verifica Email',
      notYou: 'Se non hai creato un account, ignora questa email.',
      footer: 'Benvenuto in campo',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato su',
      followJourney: 'Segui il viaggio:'
    },
    ca: {
      subject: 'Verifica la teva adreça de correu electrònic - PadelO₂',
      greeting: 'Hola',
      message: 'Gràcies per registrar-te a PadelO₂. Si us plau, verifica la teva adreça de correu electrònic fent clic al botó a continuació:',
      button: 'Verificar Email',
      notYou: 'Si no has creat un compte, ignora aquest correu.',
      footer: 'Benvingut a la pista',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar a',
      followJourney: 'Segueix el viatge:'
    },
    nl: {
      subject: 'Verifieer uw e-mailadres - PadelO₂',
      greeting: 'Hallo',
      message: 'Bedankt voor uw registratie bij PadelO₂. Verifieer uw e-mailadres door op de knop hieronder te klikken:',
      button: 'E-mail verifiëren',
      notYou: 'Als u geen account heeft aangemaakt, negeer deze e-mail dan.',
      footer: 'Welkom op de baan',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat u zich heeft geregistreerd op',
      followJourney: 'Volg de reis:'
    },
    da: {
      subject: 'Bekræft din e-mailadresse - PadelO₂',
      greeting: 'Hej',
      message: 'Tak for din registrering på PadelO₂. Bekræft venligst din e-mailadresse ved at klikke på knappen nedenfor:',
      button: 'Bekræft Email',
      notYou: 'Hvis du ikke har oprettet en konto, skal du ignorere denne e-mail.',
      footer: 'Velkommen til banen',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig på',
      followJourney: 'Følg rejsen:'
    },
    sv: {
      subject: 'Verifiera din e-postadress - PadelO₂',
      greeting: 'Hej',
      message: 'Tack för din registrering på PadelO₂. Vänligen verifiera din e-postadress genom att klicka på knappen nedan:',
      button: 'Verifiera E-post',
      notYou: 'Om du inte skapade ett konto, ignorera detta e-postmeddelande.',
      footer: 'Välkommen till banan',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig på',
      followJourney: 'Följ resan:'
    },
    no: {
      subject: 'Bekreft din e-postadresse - PadelO₂',
      greeting: 'Hei',
      message: 'Takk for din registrering på PadelO₂. Vennligst bekreft din e-postadresse ved å klikke på knappen nedenfor:',
      button: 'Bekreft E-post',
      notYou: 'Hvis du ikke opprettet en konto, ignorer denne e-posten.',
      footer: 'Velkommen til banen',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg på',
      followJourney: 'Følg reisen:'
    },
    ar: {
      subject: 'تحقق من عنوان بريدك الإلكتروني - PadelO₂',
      greeting: 'مرحبا',
      message: 'شكرا لتسجيلك في PadelO₂. يرجى التحقق من عنوان بريدك الإلكتروني بالنقر على الزر أدناه:',
      button: 'تحقق من البريد الإلكتروني',
      notYou: 'إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.',
      footer: 'مرحبا بك في الملعب',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت على',
      followJourney: 'تابع الرحلة:'
    },
    zh: {
      subject: '验证您的电子邮件地址 - PadelO₂',
      greeting: '您好',
      message: '感谢您在 PadelO₂ 注册。请点击下面的按钮验证您的电子邮件地址:',
      button: '验证电子邮件',
      notYou: '如果您没有创建账户，请忽略此电子邮件。',
      footer: '欢迎来到球场',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:'
    }
  };
  
  const t = translations[locale] || translations.en;
  
  const html = `
    <!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
    <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%); }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: linear-gradient(135deg, #06b6d4, #22c55e); border-radius: 999px; font-size: 14px; font-weight: 600; color: #ecfdf5 !important; padding: 11px 30px; display: inline-block; box-shadow: 0 10px 26px rgba(8, 145, 178, 0.35); }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .social-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f1f5f9; border-radius: 999px; font-size: 11px; color: #475569; text-decoration: none; }
      .social-icon-circle { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; }
      .social-ig { background-color: #E4405F; }
      .social-yt { background-color: #FF0000; }
      .social-tt { background-color: #000000; }
      .social-fb { background-color: #1877F2; }
      .hide-mobile { display: table-cell; }
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
    </head>
  <body class="font-default">
    <table role="presentation" class="wrapper" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="main">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 800; font-size: 22px; color: #0f172a; letter-spacing: 0.08em; text-transform: uppercase;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.16em; text-transform: uppercase;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.footer}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
        <tr>
          <td align="center">
                <table role="presentation" width="100%">
              <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
                  </tr>
                </table>
                </td>
              </tr>
              <tr>
              <td class="p-body" style="padding: 20px 30px 10px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default">
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${verificationUrl}" class="btn-primary">${t.button}</a>
                          </td>
                        </tr>
                      </table>
                      
                      <div class="info-box">
                        <p class="muted" style="margin: 0; color: #0c4a6e; font-size: 13px;">${t.notYou}</p>
                  </div>
                      
                      <p class="muted" style="margin: 20px 0 0 0; font-size: 12px; color: #6b7280;">
                        ${locale === 'ru' || locale === 'ua' ? 'Или скопируйте эту ссылку:' : locale === 'en' ? 'Or copy this link:' : 'Ou copiez ce lien:'}
                        <br>
                        <a href="${verificationUrl}" style="color: #0284c7; word-break: break-all; font-size: 11px;">${verificationUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="p-footer" style="padding: 10px 30px 24px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" style="padding-bottom: 6px;">
                      <span class="muted" style="font-size: 11px;">${t.followJourney}</span>
                </td>
              </tr>
              <tr>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 3px 4px 3px 0%;">
                            <a href="https://www.instagram.com/padelo2com/" class="social-pill">
                              <span class="social-icon-circle social-ig">IG</span>
                              <span>Instagram</span>
                            </a>
                          </td>
                          <td style="padding: 3px 4px;">
                            <a href="https://www.youtube.com/@PadelO2" class="social-pill">
                              <span class="social-icon-circle social-yt">YT</span>
                              <span>YouTube</span>
                            </a>
                          </td>
                          <td style="padding: 3px 4px;">
                            <a href="https://www.tiktok.com/@padelo2com" class="social-pill">
                              <span class="social-icon-circle social-tt">TT</span>
                              <span>TikTok</span>
                            </a>
                          </td>
                          <td style="padding: 3px 0 3px 4px;">
                            <a href="https://www.facebook.com/profile.php?id=61583860325680" class="social-pill">
                              <span class="social-icon-circle social-fb">f</span>
                              <span>Facebook</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top: 16px;">
                      <p class="muted" style="margin: 0 0 4px 0;">${t.receivingEmail} <span style="color: #0369a1;">padelo2.com</span>.</p>
                      <p class="muted" style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} PadelO<span style="font-size:1.4em; vertical-align:-1px; line-height:0;">₂</span>. All rights reserved.</p>
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; font-weight: 600;">${t.footer}</p>
                      <p style="margin: 0; color: #999999; font-size: 14px;">${t.team}</p>
                    </td>
                  </tr>
                </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();

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
  locale: string = 'en',
  temporaryPassword?: string
): Promise<boolean> {
  const { getWelcomeEmailTemplate } = await import('@/lib/email-templates');
  
  const html = getWelcomeEmailTemplate({
    firstName,
    locale,
    email,
    temporaryPassword,
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
  timestamp?: string,
  newPassword?: string
): Promise<boolean> {
  const { getPasswordChangedEmailTemplate } = await import('@/lib/email-templates');

  const html = getPasswordChangedEmailTemplate({
    firstName,
    locale,
    timestamp,
    newPassword,
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

/**
 * Send tournament registration email (for verified users)
 */
export async function sendTournamentRegistrationEmail(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    location?: string;
    locationAddress?: string;
    locationCoordinates?: { lat: number; lng: number };
    eventSchedule?: Array<{ title: string; date: string; time: string; description?: string }>;
    priceSingleCategory?: number;
    priceDoubleCategory?: number;
    description?: string;
    bannerImageData?: string;
  };
  categories: string[];
  locale?: string;
}): Promise<boolean> {
  const { getTournamentRegistrationEmailTemplate } = await import('@/lib/email-templates-tournament');
  
  const html = getTournamentRegistrationEmailTemplate({
    firstName: data.firstName,
    lastName: data.lastName,
    tournament: data.tournament,
    categories: data.categories,
    locale: data.locale || 'en',
  });

  // Generate plain text version
  const text = htmlToText(html);

  // Get subject with tournament name
  const subjectTranslations: Record<string, (name: string) => string> = {
    en: (name: string) => `We got your registration for ${name} - PadelO₂`,
    ru: (name: string) => `Мы получили вашу регистрацию на ${name} - PadelO₂`,
    ua: (name: string) => `Ми отримали вашу реєстрацію на ${name} - PadelO₂`,
    es: (name: string) => `Recibimos tu registro para ${name} - PadelO₂`,
    fr: (name: string) => `Nous avons reçu votre inscription pour ${name} - PadelO₂`,
    de: (name: string) => `Wir haben Ihre Anmeldung für ${name} erhalten - PadelO₂`,
    it: (name: string) => `Abbiamo ricevuto la tua registrazione per ${name} - PadelO₂`,
    ca: (name: string) => `Hem rebut el teu registre per a ${name} - PadelO₂`,
    nl: (name: string) => `We hebben uw registratie ontvangen voor ${name} - PadelO₂`,
    da: (name: string) => `Vi har modtaget din tilmelding til ${name} - PadelO₂`,
    sv: (name: string) => `Vi har mottagit din registrering för ${name} - PadelO₂`,
    no: (name: string) => `Vi har mottatt din registrering for ${name} - PadelO₂`,
    ar: (name: string) => `لقد استلمنا تسجيلك لـ ${name} - PadelO₂`,
    zh: (name: string) => `我们已收到您对 ${name} 的注册 - PadelO₂`,
  };

  const getSubject = subjectTranslations[data.locale || 'en'] || subjectTranslations.en;
  const subject = getSubject(data.tournament.name);

  return await sendEmail({
    to: data.email,
    subject: subject,
    html,
    text,
  });
}

