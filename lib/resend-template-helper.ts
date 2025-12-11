// Helper для работы с шаблоном Resend
// Генерирует HTML из шаблона с заменой переменных

import fs from 'fs';
import path from 'path';

interface TemplateVariables {
  [key: string]: string | boolean | undefined;
}

/**
 * Заменяет переменные в HTML шаблоне
 * Поддерживает простые переменные {{variable}} и условные блоки {{#if variable}}...{{/if}}
 */
export function renderTemplate(html: string, variables: TemplateVariables): string {
  let result = html;

  // Заменяем простые переменные {{variable}}
  Object.keys(variables).forEach((key) => {
    const value = variables[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });

  // Обрабатываем условные блоки {{#if variable}}...{{/if}}
  // Обрабатываем несколько раз для вложенных блоков
  let previousResult = '';
  while (previousResult !== result) {
    previousResult = result;
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(ifRegex, (match, varName, content) => {
      const value = variables[varName];
      // Проверяем, что значение существует и не является false/пустой строкой
      if (value !== undefined && value !== null) {
        // Если это boolean false, пропускаем
        if (typeof value === 'boolean' && value === false) {
          return '';
        }
        const stringValue = String(value);
        // Если это строка 'false' или пустая строка, пропускаем
        if (stringValue !== 'false' && stringValue.trim() !== '') {
          return content;
        }
      }
      return '';
    });
  }

  // Удаляем оставшиеся необработанные условные блоки (на случай если что-то пропустили)
  result = result.replace(/\{\{#if\s+\w+\}\}/g, '');
  result = result.replace(/\{\{\/if\}\}/g, '');

  return result;
}

/**
 * Загружает шаблон из файла и рендерит его с переменными
 */
export function loadAndRenderTemplate(
  templatePath: string,
  variables: TemplateVariables
): string {
  const fullPath = path.join(process.cwd(), templatePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template file not found: ${fullPath}`);
  }

  const template = fs.readFileSync(fullPath, 'utf-8');
  return renderTemplate(template, variables);
}

/**
 * Генерирует HTML для письма партнеру
 */
export function generatePartnerEmailHTML(data: {
  partnerName?: string;
  partnerCompany?: string;
  message: string;
  locale?: string;
  buttonUrl?: string;
  buttonText?: string;
}): string {
  const {
    partnerName = 'Партнер',
    partnerCompany = '',
    message,
    locale = 'ru',
    buttonUrl,
    buttonText = 'Связаться с нами',
  } = data;

  const brandTaglines: Record<string, string> = {
    en: 'Breathe &amp; live padel',
    ru: 'Дыши и живи паделем',
    ua: 'Дихай та живи паделем',
  };

  const translations: Record<string, Record<string, string>> = {
    ru: {
      greeting: `Здравствуйте${partnerCompany ? `, ${partnerCompany}` : ''}!`,
      title: `Привет, ${partnerName}!`,
      footerText: 'С уважением,',
      team: 'Команда PadelO₂',
      followJourney: 'Следите за нами:',
      receivingEmail: 'Вы получили это письмо от',
      unsubscribeText: 'Отписаться',
    },
    en: {
      greeting: `Hello${partnerCompany ? `, ${partnerCompany}` : ''}!`,
      title: `Hi ${partnerName}!`,
      footerText: 'Best regards,',
      team: 'PadelO₂ Team',
      followJourney: 'Follow us:',
      receivingEmail: 'You received this email from',
      unsubscribeText: 'Unsubscribe',
    },
    ua: {
      greeting: `Вітаємо${partnerCompany ? `, ${partnerCompany}` : ''}!`,
      title: `Привіт, ${partnerName}!`,
      footerText: 'З повагою,',
      team: 'Команда PadelO₂',
      followJourney: 'Слідкуйте за нами:',
      receivingEmail: 'Ви отримали цей лист від',
      unsubscribeText: 'Відписатися',
    },
  };

  const t = translations[locale] || translations.ru;
  const brandTagline = brandTaglines[locale] || brandTaglines.ru;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  // Используем базовый шаблон из resend-template.html
  const templatePath = path.join(process.cwd(), 'resend-template.html');
  
  if (fs.existsSync(templatePath)) {
    // Формируем переменные для шаблона
    const variables: TemplateVariables = {
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      subject: locale === 'ru' ? 'Партнерство с PadelO₂' : 'Partnership with PadelO₂',
      brandTagline,
      welcomeBadge: locale === 'ru' ? 'Партнерство' : 'Partnership',
      eyebrow: locale === 'ru' ? 'Партнерство' : 'Partnership',
      title: t.title,
      greeting: `<p class="lead" style="margin: 0 0 12px 0;">${t.greeting}</p>`,
      content: `<p class="lead" style="margin: 0 0 18px 0;">${message.replace(/\n/g, '<br>')}</p>`,
      buttonUrl: buttonUrl || `${siteUrl}/${locale}/contact`,
      buttonText,
      linkText: buttonUrl ? (locale === 'ru' ? 'Если кнопка не работает, скопируйте ссылку:' : 'If the button doesn\'t work, copy the link:') : '',
      linkUrl: buttonUrl || '',
      linkNote: '',
      showFeatures: false,
      footerText: t.footerText,
      followJourney: t.followJourney,
      receivingEmail: `${t.receivingEmail} ${siteUrl}`,
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe`,
      unsubscribeText: t.unsubscribeText,
      team: t.team,
      instagramUrl: 'https://www.instagram.com/padelo2com/',
      youtubeUrl: 'https://www.youtube.com/@PadelO2',
      tiktokUrl: 'https://www.tiktok.com/@padelo2com',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61583860325680',
    };

    return loadAndRenderTemplate('resend-template.html', variables);
  }

  // Fallback: простой HTML если шаблон не найден
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Партнерство с PadelO₂</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0f172a;">${t.title}</h1>
  <p>${t.greeting}</p>
  <div style="margin: 20px 0;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  ${buttonUrl ? `<a href="${buttonUrl}" style="background: linear-gradient(135deg, #06b6d4, #22c55e); color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block;">${buttonText}</a>` : ''}
  <p style="margin-top: 30px; color: #666; font-size: 12px;">
    ${t.footerText}<br>
    ${t.team}
  </p>
</body>
</html>
  `.trim();
}

/**
 * Генерирует HTML для письма о спонсорстве UA PADEL OPEN
 */
export function generateSponsorshipProposalEmailHTML(data: {
  partnerName?: string;
  partnerCompany?: string;
  locale?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  contactTitle?: string;
  tournament?: any;
}): string {
  const {
    partnerName = '',
    partnerCompany = '',
    locale = 'en',
    phone = '+34 662 423 738',
    email = 'partner@padelO2.com',
    contactName = 'Sergii Shchurenko',
    contactTitle = 'Organizer, UA PADEL OPEN',
    tournament,
  } = data;

  // Extract tournament info
  const tournamentName = tournament?.name || 'UA PADEL OPEN 2025';
  const tournamentDates = tournament?.startDate && tournament?.endDate
    ? `${new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : '20–21 December 2025';
  const tournamentLocation = tournament?.location || 'Camping La Masia (Blanes, Costa Brava)';

  const brandTaglines: Record<string, string> = {
    en: 'Breathe &amp; live padel',
    ru: 'Дыши и живи паделем',
    ua: 'Дихай та живи паделем',
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const brandTagline = brandTaglines[locale] || brandTaglines.en;

  // Форматируем текст письма
  const sponsorshipContent = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">${tournamentName}</h2>
      
      <p class="lead" style="margin: 0 0 16px 0;">Hi${partnerCompany ? `, ${partnerCompany}` : ''},</p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        My name is Sergii, I'm the organizer of <strong>${tournamentName}</strong> together with <strong>PadelO₂.com</strong> and <strong>Padel La Masia</strong>.
      </p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        On <strong>${tournamentDates}</strong> we are hosting a 2-day international padel tournament at <strong>${tournamentLocation}</strong>.
      </p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        It's a Ukrainian–Spanish community event that brings together:
      </p>
      
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;"><strong>50+ players</strong> (men, women, mixed &amp; kids categories)</li>
        <li style="margin-bottom: 8px;"><strong>Families, tourists</strong> and local padel fans</li>
        <li style="margin-bottom: 8px;"><strong>Guests from Spain, Ukraine</strong> and other European countries</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        We're currently opening partnership &amp; sponsorship slots and I'd like to invite${partnerCompany ? ` <strong>${partnerCompany}</strong>` : ' you'} to become one of the key partners of the event.
      </p>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Why it can be interesting for you</h3>
      
      <h4 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 16px 0 8px 0;">Audience &amp; reach</h4>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;"><strong>2 days</strong> of matches, activities and social program on-site</li>
        <li style="margin-bottom: 8px;"><strong>Active audience:</strong> players 10–80 y.o., families with kids, sport-oriented tourists</li>
        <li style="margin-bottom: 8px;"><strong>Promotion</strong> through PadelO₂ digital channels (website, social media, email), club channels of Padel La Masia and partners</li>
      </ul>
      
      <h4 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 16px 0 8px 0;">Visibility for sponsors</h4>
      <p class="lead" style="margin: 0 0 12px 0;">Depending on the package, sponsors can receive:</p>
      
      <p class="lead" style="margin: 0 0 8px 0;"><strong>Logo placement on:</strong></p>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">Official tournament T-shirts</li>
        <li style="margin-bottom: 8px;">On-court banners / backdrops</li>
        <li style="margin-bottom: 8px;">Printed materials (posters, roll-ups, schedules)</li>
        <li style="margin-bottom: 8px;">Tournament graphics on social media &amp; website</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 8px 0;"><strong>Mentions in:</strong></p>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">Social media posts and stories before, during and after the event</li>
        <li style="margin-bottom: 8px;">Opening &amp; awards ceremonies</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 8px 0;"><strong>Option to:</strong></p>
      <ul style="margin: 0 0 0 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">Place a promo stand / tasting / product demo during the event</li>
        <li style="margin-bottom: 8px;">Include gifts, vouchers or samples in the players' Welcome Pack</li>
        <li style="margin-bottom: 8px;">Sponsor special activities: Varenyky Party, Lottery, Happy Hours, kids' zone etc.</li>
      </ul>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Sponsorship formats (flexible)</h3>
      <p class="lead" style="margin: 0 0 12px 0;">We usually structure partnerships as:</p>
      <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;"><strong>Main Partner / Title Partner €650</strong> – maximum visibility everywhere</li>
        <li style="margin-bottom: 8px;"><strong>Official Sponsor €350</strong> – strong presence on-site and online</li>
      </ul>
      <p class="lead" style="margin: 0 0 0 0;">
        We're flexible and can adapt a package to match your marketing goals (local visibility, brand awareness, product trials, new clients, etc.).
      </p>
    </div>

    <div style="margin: 24px 0;">
      <p class="lead" style="margin: 0 0 32px 0; text-align: center;">
        If this sounds interesting, please call me to discuss details.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(148, 163, 184, 0.2); text-align: center;">
      <p class="lead" style="margin: 0 0 20px 0; text-align: center; font-size: 15px; color: #1f2937;">
        Best regards,
      </p>
      
      <p class="muted" style="margin: 0 0 16px 0; text-align: center; font-size: 12px; color: #6b7280;">
        Follow us:
      </p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
        <tr>
          <td align="center" style="padding: 0 4px;">
            <a href="https://www.instagram.com/padelo2com/" style="border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.55); padding: 5px 10px 5px 7px; font-size: 11px; color: #111827; background-color: #ffffff; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
              <span style="width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #ffffff; background-color: #e1306c;">IG</span>
              <span>Instagram</span>
            </a>
          </td>
          <td align="center" style="padding: 0 4px;">
            <a href="https://www.youtube.com/@PadelO2" style="border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.55); padding: 5px 10px 5px 7px; font-size: 11px; color: #111827; background-color: #ffffff; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
              <span style="width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #ffffff; background-color: #ff0000;">YT</span>
              <span>YouTube</span>
            </a>
          </td>
          <td align="center" style="padding: 0 4px;">
            <a href="https://www.tiktok.com/@padelo2com" style="border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.55); padding: 5px 10px 5px 7px; font-size: 11px; color: #111827; background-color: #ffffff; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
              <span style="width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #ffffff; background-color: #000000;">TT</span>
              <span>TikTok</span>
            </a>
          </td>
          <td align="center" style="padding: 0 4px;">
            <a href="https://www.facebook.com/profile.php?id=61583860325680" style="border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.55); padding: 5px 10px 5px 7px; font-size: 11px; color: #111827; background-color: #ffffff; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
              <span style="width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #ffffff; background-color: #1877f2;">FB</span>
              <span>Facebook</span>
            </a>
          </td>
        </tr>
      </table>
      
      <p class="muted" style="margin: 0 0 8px 0; text-align: center; font-size: 11px; color: #6b7280;">
        You received this email from <a href="${siteUrl}" style="color: #0284c7; text-decoration: underline;">${siteUrl}</a>
      </p>
      
      <p class="muted" style="margin: 0 0 24px 0; text-align: center; font-size: 11px; color: #6b7280;">
        <a href="${siteUrl}/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
      </p>
      
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
        <p class="muted" style="margin: 0 0 8px 0; text-align: center; font-size: 14px; font-weight: 600; color: #0f172a;">
          ${data.contactName || 'Sergii Shchurenko'}
        </p>
        <p class="muted" style="margin: 0 0 8px 0; text-align: center; font-size: 12px; color: #6b7280;">
          ${data.contactTitle || 'Organizer, UA PADEL OPEN'}
        </p>
        <p class="muted" style="margin: 0 0 4px 0; text-align: center; font-size: 12px; color: #6b7280;">
          PadelO<span style="font-size:1.3em; vertical-align:-1px;">₂</span>.com
        </p>
        <p class="muted" style="margin: 0; text-align: center; font-size: 12px; color: #0284c7;">
          ${phone} · <a href="mailto:${email}" style="color: #0284c7; text-decoration: underline;">${email}</a>
        </p>
      </div>
    </div>
  `;

  // Используем базовый шаблон из resend-template.html
  const templatePath = path.join(process.cwd(), 'resend-template.html');
  
  if (fs.existsSync(templatePath)) {
    const variables: TemplateVariables = {
      locale,
      dir: 'ltr',
      subject: 'Sponsorship Proposal – UA PADEL OPEN 2025 (Costa Brava)',
      brandTagline,
      welcomeBadge: 'Partnership Opportunity',
      eyebrow: 'Sponsorship',
      title: 'Sponsorship Proposal',
      greeting: '',
      content: sponsorshipContent,
      buttonUrl: '',
      buttonText: '',
      linkText: '',
      linkUrl: '',
      linkNote: '',
      showFeatures: false,
      footerText: '',
      followJourney: '',
      receivingEmail: '',
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe`,
      unsubscribeText: '',
      team: '',
      contactPhone: phone,
      contactEmail: email,
      contactName: 'Sergii Shchurenko',
      contactTitle: 'Organizer, UA PADEL OPEN',
      instagramUrl: 'https://www.instagram.com/padelo2com/',
      youtubeUrl: 'https://www.youtube.com/@PadelO2',
      tiktokUrl: 'https://www.tiktok.com/@padelo2com',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61583860325680',
    };

    return loadAndRenderTemplate('resend-template.html', variables);
  }

  // Fallback: простой HTML если шаблон не найден
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsorship Proposal – UA PADEL OPEN</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0f172a;">PadelO<span style="font-size:1.4em; vertical-align:-1px;">₂</span></h1>
  ${sponsorshipContent}
</body>
</html>
  `.trim();
}

