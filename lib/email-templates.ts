// Email templates for Resend
// Modern, stylish email templates for tournament registration

export interface EmailTemplateData {
  tournamentName: string;
  confirmationUrl: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
}

export function getConfirmationEmailTemplate(data: EmailTemplateData): string {
  const { tournamentName, confirmationUrl, firstName, lastName, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  
  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Confirm your registration',
      greeting: 'Hello',
      thankYou: 'Thank you for registering',
      thankYouFor: 'Thank you for registering for',
      confirmText: 'Please confirm your registration by clicking the button below:',
      confirmButton: 'Confirm Registration',
      orCopy: 'Or copy this link:',
      ignore: 'If you did not register for this tournament, please ignore this email.',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team'
    },
    ru: {
      subject: 'Подтвердите регистрацию',
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за регистрацию',
      thankYouFor: 'Спасибо за регистрацию на',
      confirmText: 'Пожалуйста, подтвердите регистрацию, нажав кнопку ниже:',
      confirmButton: 'Подтвердить регистрацию',
      orCopy: 'Или скопируйте эту ссылку:',
      ignore: 'Если вы не регистрировались на этот турнир, проигнорируйте это письмо.',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂'
    },
    ua: {
      subject: 'Підтвердіть реєстрацію',
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за реєстрацію',
      thankYouFor: 'Дякуємо за реєстрацію на',
      confirmText: 'Будь ласка, підтвердіть реєстрацію, натиснувши кнопку нижче:',
      confirmButton: 'Підтвердити реєстрацію',
      orCopy: 'Або скопіюйте це посилання:',
      ignore: 'Якщо ви не реєструвалися на цей турнір, проігноруйте цей лист.',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂'
    },
    es: {
      subject: 'Confirma tu registro',
      greeting: 'Hola',
      thankYou: 'Gracias por registrarte',
      thankYouFor: 'Gracias por registrarte para',
      confirmText: 'Por favor, confirma tu registro haciendo clic en el botón a continuación:',
      confirmButton: 'Confirmar Registro',
      orCopy: 'O copia este enlace:',
      ignore: 'Si no te registraste para este torneo, ignora este correo.',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂'
    },
    fr: {
      subject: 'Confirmez votre inscription',
      greeting: 'Bonjour',
      thankYou: 'Merci de vous être inscrit',
      thankYouFor: 'Merci de vous être inscrit pour',
      confirmText: 'Veuillez confirmer votre inscription en cliquant sur le bouton ci-dessous:',
      confirmButton: 'Confirmer l\'inscription',
      orCopy: 'Ou copiez ce lien:',
      ignore: 'Si vous ne vous êtes pas inscrit à ce tournoi, ignorez cet e-mail.',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂'
    },
    de: {
      subject: 'Bestätigen Sie Ihre Anmeldung',
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Anmeldung',
      thankYouFor: 'Vielen Dank für Ihre Anmeldung für',
      confirmText: 'Bitte bestätigen Sie Ihre Anmeldung, indem Sie auf die Schaltfläche unten klicken:',
      confirmButton: 'Anmeldung bestätigen',
      orCopy: 'Oder kopieren Sie diesen Link:',
      ignore: 'Wenn Sie sich nicht für dieses Turnier angemeldet haben, ignorieren Sie diese E-Mail.',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team'
    },
    it: {
      subject: 'Conferma la tua registrazione',
      greeting: 'Ciao',
      thankYou: 'Grazie per esserti registrato',
      thankYouFor: 'Grazie per esserti registrato per',
      confirmText: 'Per favore, conferma la tua registrazione cliccando sul pulsante qui sotto:',
      confirmButton: 'Conferma Registrazione',
      orCopy: 'O copia questo link:',
      ignore: 'Se non ti sei registrato per questo torneo, ignora questa email.',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂'
    },
    ca: {
      subject: 'Confirma el teu registre',
      greeting: 'Hola',
      thankYou: 'Gràcies per registrar-te',
      thankYouFor: 'Gràcies per registrar-te per a',
      confirmText: 'Si us plau, confirma el teu registre fent clic al botó següent:',
      confirmButton: 'Confirmar Registre',
      orCopy: 'O copia aquest enllaç:',
      ignore: 'Si no t\'has registrat per a aquest torneig, ignora aquest correu.',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂'
    },
    nl: {
      subject: 'Bevestig uw registratie',
      greeting: 'Hallo',
      thankYou: 'Bedankt voor uw registratie',
      thankYouFor: 'Bedankt voor uw registratie voor',
      confirmText: 'Bevestig uw registratie door op de onderstaande knop te klikken:',
      confirmButton: 'Registratie bevestigen',
      orCopy: 'Of kopieer deze link:',
      ignore: 'Als u zich niet heeft geregistreerd voor dit toernooi, negeer dan deze e-mail.',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team'
    },
    da: {
      subject: 'Bekræft din registrering',
      greeting: 'Hej',
      thankYou: 'Tak for din registrering',
      thankYouFor: 'Tak for din registrering til',
      confirmText: 'Bekræft venligst din registrering ved at klikke på knappen nedenfor:',
      confirmButton: 'Bekræft Registrering',
      orCopy: 'Eller kopier dette link:',
      ignore: 'Hvis du ikke har registreret dig til dette turnering, skal du ignorere denne e-mail.',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team'
    },
    sv: {
      subject: 'Bekräfta din registrering',
      greeting: 'Hej',
      thankYou: 'Tack för din registrering',
      thankYouFor: 'Tack för din registrering för',
      confirmText: 'Vänligen bekräfta din registrering genom att klicka på knappen nedan:',
      confirmButton: 'Bekräfta Registrering',
      orCopy: 'Eller kopiera denna länk:',
      ignore: 'Om du inte har registrerat dig för denna turnering, ignorera detta e-postmeddelande.',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team'
    },
    no: {
      subject: 'Bekreft din registrering',
      greeting: 'Hei',
      thankYou: 'Takk for din registrering',
      thankYouFor: 'Takk for din registrering til',
      confirmText: 'Vennligst bekreft din registrering ved å klikke på knappen nedenfor:',
      confirmButton: 'Bekreft Registrering',
      orCopy: 'Eller kopier denne lenken:',
      ignore: 'Hvis du ikke har registrert deg for denne turneringen, ignorer denne e-posten.',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team'
    },
    ar: {
      subject: 'أكد تسجيلك',
      greeting: 'مرحبا',
      thankYou: 'شكرا لتسجيلك',
      thankYouFor: 'شكرا لتسجيلك في',
      confirmText: 'يرجى تأكيد تسجيلك بالنقر على الزر أدناه:',
      confirmButton: 'تأكيد التسجيل',
      orCopy: 'أو انسخ هذا الرابط:',
      ignore: 'إذا لم تقم بالتسجيل في هذه البطولة، يرجى تجاهل هذا البريد الإلكتروني.',
      footer: 'نراكم في البطولة!',
      team: 'فريق PadelO₂'
    },
    zh: {
      subject: '确认您的注册',
      greeting: '您好',
      thankYou: '感谢您的注册',
      thankYouFor: '感谢您注册',
      confirmText: '请点击下面的按钮确认您的注册:',
      confirmButton: '确认注册',
      orCopy: '或复制此链接:',
      ignore: '如果您没有注册此锦标赛，请忽略此电子邮件。',
      footer: '锦标赛见！',
      team: 'PadelO₂ 团队'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                PadelO<sub style="font-size: 20px; vertical-align: baseline;">₂</sub>
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                ${t.thankYou}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.6;">
                ${t.greeting}${name ? ` ${name}` : ''}!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                ${t.thankYouFor || t.thankYou} <strong style="color: #333333;">${tournamentName}</strong>!
              </p>
              
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                ${t.confirmText}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                      ${t.confirmButton}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px; line-height: 1.6;">
                ${t.orCopy}
              </p>
              <p style="margin: 0 0 30px 0; color: #667eea; font-size: 14px; word-break: break-all; line-height: 1.6;">
                <a href="${confirmationUrl}" style="color: #667eea; text-decoration: none;">${confirmationUrl}</a>
              </p>
              
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                ${t.ignore}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; font-weight: 600;">
                ${t.footer}
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px;">
                ${t.team}
              </p>
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} PadelO₂. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

