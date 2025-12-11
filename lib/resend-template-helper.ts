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
    es: 'Respira y vive el pádel',
  };

  // Translations for sponsorship email
  const translations: Record<string, any> = {
    en: {
      greeting: `Hi${partnerName ? `, ${partnerName}` : ''}`,
      intro: `My name is Sergii, I'm the organizer of <strong>${tournamentName}</strong> together with <strong>PadelO₂.com</strong> and <strong>Padel La Masia</strong>.`,
      dates: `On <strong>${tournamentDates}</strong> we are hosting a 2-day international padel tournament at <strong>${tournamentLocation}</strong>.`,
      event: `It's a Ukrainian–Spanish community event that brings together:`,
      players: `<strong>50+ players</strong> (men, women, mixed &amp; kids categories)`,
      families: `<strong>Families, tourists</strong> and local padel fans`,
      guests: `<strong>Guests from Spain, Ukraine</strong> and other European countries`,
      invite: `We're currently opening partnership &amp; sponsorship slots and I'd like to invite${partnerCompany ? ` <strong>${partnerCompany}</strong>` : ' you'} to become one of the key partners of the event.`,
      whyTitle: 'Why it can be interesting for you',
      audienceTitle: 'Audience &amp; reach',
      days: `<strong>2 days</strong> of matches, activities and social program on-site`,
      activeAudience: `<strong>Active audience:</strong> players 10–80 y.o., families with kids, sport-oriented tourists`,
      promotion: `<strong>Promotion</strong> through PadelO₂ digital channels (website, social media, email), club channels of Padel La Masia and partners`,
      visibilityTitle: 'Visibility for sponsors',
      depending: 'Depending on the package, sponsors can receive:',
      logoPlacement: '<strong>Logo placement on:</strong>',
      tshirts: 'Official tournament T-shirts',
      banners: 'On-court banners / backdrops',
      materials: 'Printed materials (posters, roll-ups, schedules)',
      graphics: 'Tournament graphics on social media &amp; website',
      mentions: '<strong>Mentions in:</strong>',
      socialMedia: 'Social media posts and stories before, during and after the event',
      ceremonies: 'Opening &amp; awards ceremonies',
      optionTo: '<strong>Option to:</strong>',
      promoStand: 'Place a promo stand / tasting / product demo during the event',
      welcomePack: 'Include gifts, vouchers or samples in the players\' Welcome Pack',
      activities: 'Sponsor special activities: Varenyky Party, Lottery, Happy Hours, kids\' zone etc.',
      formatsTitle: 'Sponsorship formats (flexible)',
      structure: 'We usually structure partnerships as:',
      mainPartner: '<strong>Main Partner / Title Partner €650</strong> – maximum visibility everywhere',
      officialSponsor: '<strong>Official Sponsor €350</strong> – strong presence on-site and online',
      flexible: 'We\'re flexible and can adapt a package to match your marketing goals (local visibility, brand awareness, product trials, new clients, etc.).',
      callToAction: 'If this sounds interesting, please call me to discuss details.',
      bestRegards: 'Best regards,',
      followUs: 'Follow us:',
      receivingEmail: 'You received this email from',
      unsubscribe: 'Unsubscribe',
    },
    es: {
      greeting: `Hola${partnerName ? `, ${partnerName}` : ''}`,
      intro: `Mi nombre es Sergii, soy el organizador de <strong>${tournamentName}</strong> junto con <strong>PadelO₂.com</strong> y <strong>Padel La Masia</strong>.`,
      dates: `El <strong>${tournamentDates}</strong> organizamos un torneo internacional de pádel de 2 días en <strong>${tournamentLocation}</strong>.`,
      event: `Es un evento comunitario ucraniano-español que reúne:`,
      players: `<strong>Más de 50 jugadores</strong> (categorías masculina, femenina, mixta e infantil)`,
      families: `<strong>Familias, turistas</strong> y aficionados locales al pádel`,
      guests: `<strong>Invitados de España, Ucrania</strong> y otros países europeos`,
      invite: `Actualmente estamos abriendo espacios de asociación y patrocinio y me gustaría invitar${partnerCompany ? ` a <strong>${partnerCompany}</strong>` : 'te'} a convertirte en uno de los socios clave del evento.`,
      whyTitle: 'Por qué puede ser interesante para ti',
      audienceTitle: 'Audiencia y alcance',
      days: `<strong>2 días</strong> de partidos, actividades y programa social en el lugar`,
      activeAudience: `<strong>Audiencia activa:</strong> jugadores de 10 a 80 años, familias con niños, turistas orientados al deporte`,
      promotion: `<strong>Promoción</strong> a través de los canales digitales de PadelO₂ (sitio web, redes sociales, correo electrónico), canales del club Padel La Masia y socios`,
      visibilityTitle: 'Visibilidad para patrocinadores',
      depending: 'Dependiendo del paquete, los patrocinadores pueden recibir:',
      logoPlacement: '<strong>Colocación de logo en:</strong>',
      tshirts: 'Camisetas oficiales del torneo',
      banners: 'Banderas / fondos en la cancha',
      materials: 'Materiales impresos (carteles, roll-ups, horarios)',
      graphics: 'Gráficos del torneo en redes sociales y sitio web',
      mentions: '<strong>Menciones en:</strong>',
      socialMedia: 'Publicaciones y historias en redes sociales antes, durante y después del evento',
      ceremonies: 'Ceremonias de apertura y premiación',
      optionTo: '<strong>Opción de:</strong>',
      promoStand: 'Colocar un stand promocional / degustación / demostración de productos durante el evento',
      welcomePack: 'Incluir regalos, vales o muestras en el Welcome Pack de los jugadores',
      activities: 'Patrocinar actividades especiales: Fiesta de Varenyky, Lotería, Happy Hours, zona infantil, etc.',
      formatsTitle: 'Formatos de patrocinio (flexibles)',
      structure: 'Normalmente estructuramos las asociaciones como:',
      mainPartner: '<strong>Patrocinador Principal / Patrocinador Titular €650</strong> – máxima visibilidad en todas partes',
      officialSponsor: '<strong>Patrocinador Oficial €350</strong> – fuerte presencia en el lugar y en línea',
      flexible: 'Somos flexibles y podemos adaptar un paquete para que coincida con tus objetivos de marketing (visibilidad local, reconocimiento de marca, pruebas de productos, nuevos clientes, etc.).',
      callToAction: 'Si esto te parece interesante, por favor llámame para discutir los detalles.',
      bestRegards: 'Saludos cordiales,',
      followUs: 'Síguenos:',
      receivingEmail: 'Recibiste este correo de',
      unsubscribe: 'Cancelar suscripción',
    },
  };

  const t = translations[locale] || translations.en;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const brandTagline = brandTaglines[locale] || brandTaglines.en;

  // Format tournament dates based on locale
  let formattedDates = tournamentDates;
  if (locale === 'es' && tournament?.startDate && tournament?.endDate) {
    formattedDates = `${new Date(tournament.startDate).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}–${new Date(tournament.endDate).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }

  // Форматируем текст письма
  const sponsorshipContent = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">${tournamentName}</h2>
      
      <p class="lead" style="margin: 0 0 16px 0;">${t.greeting},</p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        ${t.intro}
      </p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        ${locale === 'es' ? t.dates.replace('${tournamentDates}', formattedDates) : t.dates}
      </p>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        ${t.event}
      </p>
      
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.players}</li>
        <li style="margin-bottom: 8px;">${t.families}</li>
        <li style="margin-bottom: 8px;">${t.guests}</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 16px 0;">
        ${t.invite}
      </p>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">${t.whyTitle}</h3>
      
      <h4 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 16px 0 8px 0;">${t.audienceTitle}</h4>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.days}</li>
        <li style="margin-bottom: 8px;">${t.activeAudience}</li>
        <li style="margin-bottom: 8px;">${t.promotion}</li>
      </ul>
      
      <h4 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 16px 0 8px 0;">${t.visibilityTitle}</h4>
      <p class="lead" style="margin: 0 0 12px 0;">${t.depending}</p>
      
      <p class="lead" style="margin: 0 0 8px 0;">${t.logoPlacement}</p>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.tshirts}</li>
        <li style="margin-bottom: 8px;">${t.banners}</li>
        <li style="margin-bottom: 8px;">${t.materials}</li>
        <li style="margin-bottom: 8px;">${t.graphics}</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 8px 0;">${t.mentions}</p>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.socialMedia}</li>
        <li style="margin-bottom: 8px;">${t.ceremonies}</li>
      </ul>
      
      <p class="lead" style="margin: 0 0 8px 0;">${t.optionTo}</p>
      <ul style="margin: 0 0 0 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.promoStand}</li>
        <li style="margin-bottom: 8px;">${t.welcomePack}</li>
        <li style="margin-bottom: 8px;">${t.activities}</li>
      </ul>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">${t.formatsTitle}</h3>
      <p class="lead" style="margin: 0 0 12px 0;">${t.structure}</p>
      <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #1f2937;">
        <li style="margin-bottom: 8px;">${t.mainPartner}</li>
        <li style="margin-bottom: 8px;">${t.officialSponsor}</li>
      </ul>
      <p class="lead" style="margin: 0 0 0 0;">
        ${t.flexible}
      </p>
    </div>

    <div style="margin: 24px 0;">
      <p class="lead" style="margin: 0 0 32px 0; text-align: center;">
        ${t.callToAction}
      </p>
    </div>

    <!-- Contact Information -->
    <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(148, 163, 184, 0.2); text-align: center;">
      <p class="muted" style="margin: 0 0 8px 0; text-align: center; font-size: 15px; color: #1f2937; font-weight: 600;">
        ${t.bestRegards}
      </p>
      <p class="muted" style="margin: 16px 0 8px 0; text-align: center; font-size: 14px; font-weight: 600; color: #0f172a;">
        ${contactName}
      </p>
      <p class="muted" style="margin: 0 0 8px 0; text-align: center; font-size: 12px; color: #6b7280;">
        ${contactTitle}
      </p>
      <p class="muted" style="margin: 0 0 4px 0; text-align: center; font-size: 12px; color: #6b7280;">
        PadelO<span style="font-size:1.3em; vertical-align:-1px;">₂</span>.com
      </p>
      <p class="muted" style="margin: 0; text-align: center; font-size: 12px; color: #0284c7;">
        ${phone} · <a href="mailto:${email}" style="color: #0284c7; text-decoration: underline;">${email}</a>
      </p>
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
      followJourney: t.followUs,
      receivingEmail: t.receivingEmail,
      siteUrl,
      unsubscribeUrl: `${siteUrl}/${locale}/unsubscribe`,
      unsubscribeText: t.unsubscribe,
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

