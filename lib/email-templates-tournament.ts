// Tournament email templates - will be merged into email-templates.ts
// This is a temporary file to avoid file size issues

// 10. Tournament Registration - "We got your registration"
export interface TournamentRegistrationEmailData {
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
}

export function getTournamentRegistrationEmailTemplate(data: TournamentRegistrationEmailData): string {
  const { firstName, lastName, tournament, categories, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const dashboardUrl = `${siteUrl}/${locale}/dashboard`;

  // Import localization utilities
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');

  // Форматируем даты с локализацией
  const formatDate = (dateString: string) => formatLocalizedDate(dateString, locale);
  
  // Локализуем категории
  const localizedCategories = categories.map(cat => getLocalizedCategoryName(cat, locale));

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `We got your registration for ${tournamentName} - PadelO₂`,
      subjectBase: 'We got your registration - PadelO₂',
      greeting: 'Hello',
      thankYou: 'Thank you for registering',
      message: 'We received your registration for',
      registrationDetails: 'Registration Details',
      tournamentName: 'Tournament',
      dates: 'Dates',
      location: 'Location',
      categories: 'Categories',
      price: 'Price',
      singleCategory: 'Single category',
      multipleCategories: 'Multiple categories',
      paymentDeadline: 'Payment Deadline',
      paymentNote: 'Please complete your payment no later than 15 days before the tournament starts, so we can reserve your spot and prepare properly for the event.',
      paymentDeadlineText: 'Final payment deadline:',
      eventSchedule: 'Event Schedule',
      viewDashboard: 'View Dashboard',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you registered for a tournament on',
      followJourney: 'Follow the journey:'
    },
    ru: {
      subject: (tournamentName: string) => `Мы получили вашу регистрацию на ${tournamentName} - PadelO₂`,
      subjectBase: 'Мы получили вашу регистрацию - PadelO₂',
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за регистрацию',
      message: 'Мы получили вашу регистрацию на',
      registrationDetails: 'Детали регистрации',
      tournamentName: 'Турнир',
      dates: 'Даты',
      location: 'Место проведения',
      categories: 'Категории',
      price: 'Стоимость',
      singleCategory: 'Одна категория',
      multipleCategories: 'Несколько категорий',
      paymentDeadline: 'Срок оплаты',
      paymentNote: 'Пожалуйста, осуществите оплату не позднее чем за 15 дней до старта турнира, чтобы мы могли зарезервировать за вами место и качественно подготовиться к событию.',
      paymentDeadlineText: 'Крайний срок оплаты:',
      eventSchedule: 'Расписание событий',
      viewDashboard: 'Перейти в Панель',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на турнир на',
      followJourney: 'Следите за путешествием:'
    },
    ua: {
      subject: (tournamentName: string) => `Ми отримали вашу реєстрацію на ${tournamentName} - PadelO₂`,
      subjectBase: 'Ми отримали вашу реєстрацію - PadelO₂',
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за реєстрацію',
      message: 'Ми отримали вашу реєстрацію на',
      registrationDetails: 'Деталі реєстрації',
      tournamentName: 'Турнір',
      dates: 'Дати',
      location: 'Місце проведення',
      categories: 'Категорії',
      price: 'Вартість',
      singleCategory: 'Одна категорія',
      multipleCategories: 'Кілька категорій',
      paymentDeadline: 'Термін оплати',
      paymentNote: 'Будь ласка, здійсніть оплату не пізніше ніж за 15 днів до старту турніру, щоб ми могли зарезервувати за вами місце та якісно підготуватися до події.',
      paymentDeadlineText: 'Кінцевий термін оплати:',
      eventSchedule: 'Розклад подій',
      viewDashboard: 'Перейти до Панелі',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на турнір на',
      followJourney: 'Слідкуйте за подорожжю:'
    },
    es: {
      subject: 'Recibimos tu registro - PadelO₂',
      greeting: 'Hola',
      thankYou: 'Gracias por registrarte',
      message: 'Recibimos tu registro para',
      registrationDetails: 'Detalles de Registro',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      location: 'Ubicación',
      categories: 'Categorías',
      price: 'Precio',
      singleCategory: 'Una categoría',
      multipleCategories: 'Múltiples categorías',
      paymentDeadline: 'Fecha Límite de Pago',
      paymentNote: 'Por favor, complete su pago a más tardar 15 días antes del inicio del torneo, para que podamos reservar su lugar y prepararnos adecuadamente para el evento.',
      paymentDeadlineText: 'Fecha límite de pago final:',
      eventSchedule: 'Calendario de Eventos',
      viewDashboard: 'Ver Panel',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque te registraste para un torneo en',
      followJourney: 'Sigue el viaje:'
    },
    fr: {
      subject: 'Nous avons reçu votre inscription - PadelO₂',
      greeting: 'Bonjour',
      thankYou: 'Merci de vous être inscrit',
      message: 'Nous avons reçu votre inscription pour',
      registrationDetails: 'Détails de l\'Inscription',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      location: 'Lieu',
      categories: 'Catégories',
      price: 'Prix',
      singleCategory: 'Une catégorie',
      multipleCategories: 'Plusieurs catégories',
      paymentDeadline: 'Date Limite de Paiement',
      paymentNote: 'Veuillez effectuer votre paiement au plus tard 15 jours avant le début du tournoi, afin que nous puissions réserver votre place et nous préparer correctement à l\'événement.',
      paymentDeadlineText: 'Date limite de paiement finale:',
      eventSchedule: 'Calendrier des Événements',
      viewDashboard: 'Voir le Tableau de bord',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit à un tournoi sur',
      followJourney: 'Suivez le voyage:'
    },
    de: {
      subject: 'Wir haben Ihre Anmeldung erhalten - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Anmeldung',
      message: 'Wir haben Ihre Anmeldung für',
      registrationDetails: 'Anmeldedetails',
      tournamentName: 'Turnier',
      dates: 'Termine',
      location: 'Ort',
      categories: 'Kategorien',
      price: 'Preis',
      singleCategory: 'Eine Kategorie',
      multipleCategories: 'Mehrere Kategorien',
      paymentDeadline: 'Zahlungsfrist',
      paymentNote: 'Bitte zahlen Sie spätestens 15 Tage vor Turnierbeginn, damit wir Ihren Platz reservieren und uns ordnungsgemäß auf die Veranstaltung vorbereiten können.',
      paymentDeadlineText: 'Endgültige Zahlungsfrist:',
      eventSchedule: 'Veranstaltungskalender',
      viewDashboard: 'Dashboard anzeigen',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:'
    },
    it: {
      subject: 'Abbiamo ricevuto la tua registrazione - PadelO₂',
      greeting: 'Ciao',
      thankYou: 'Grazie per esserti registrato',
      message: 'Abbiamo ricevuto la tua registrazione per',
      registrationDetails: 'Dettagli di Registrazione',
      tournamentName: 'Torneo',
      dates: 'Date',
      location: 'Luogo',
      categories: 'Categorie',
      price: 'Prezzo',
      singleCategory: 'Una categoria',
      multipleCategories: 'Più categorie',
      paymentDeadline: 'Scadenza Pagamento',
      paymentNote: 'Si prega di completare il pagamento entro 15 giorni prima dell\'inizio del torneo, in modo da poter riservare il vostro posto e prepararci adeguatamente per l\'evento.',
      paymentDeadlineText: 'Scadenza finale del pagamento:',
      eventSchedule: 'Calendario Eventi',
      viewDashboard: 'Vedi Dashboard',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato per un torneo su',
      followJourney: 'Segui il viaggio:'
    },
    ca: {
      subject: 'Hem rebut el teu registre - PadelO₂',
      greeting: 'Hola',
      thankYou: 'Gràcies per registrar-te',
      message: 'Hem rebut el teu registre per a',
      registrationDetails: 'Detalls del Registre',
      tournamentName: 'Torneig',
      dates: 'Dates',
      location: 'Ubicació',
      categories: 'Categories',
      price: 'Preu',
      singleCategory: 'Una categoria',
      multipleCategories: 'Múltiples categories',
      paymentDeadline: 'Termini de Pagament',
      paymentNote: 'Si us plau, completeu el pagament com a màxim 15 dies abans de l\'inici del torneig, perquè puguem reservar el vostre lloc i preparar-nos adequadament per a l\'esdeveniment.',
      paymentDeadlineText: 'Termini final de pagament:',
      eventSchedule: 'Calendari d\'Esdeveniments',
      viewDashboard: 'Veure Tauler',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar per a un torneig a',
      followJourney: 'Segueix el viatge:'
    },
    nl: {
      subject: 'We hebben uw registratie ontvangen - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Bedankt voor uw registratie',
      message: 'We hebben uw registratie ontvangen voor',
      registrationDetails: 'Registratiedetails',
      tournamentName: 'Toernooi',
      dates: 'Data',
      location: 'Locatie',
      categories: 'Categorieën',
      price: 'Prijs',
      singleCategory: 'Één categorie',
      multipleCategories: 'Meerdere categorieën',
      paymentDeadline: 'Betaaltermijn',
      paymentNote: 'Gelieve uw betaling uiterlijk 15 dagen voor aanvang van het toernooi te voltooien, zodat we uw plaats kunnen reserveren en ons goed kunnen voorbereiden op het evenement.',
      paymentDeadlineText: 'Einddatum betaling:',
      eventSchedule: 'Evenementenkalender',
      viewDashboard: 'Dashboard bekijken',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat u zich heeft geregistreerd voor een toernooi op',
      followJourney: 'Volg de reis:'
    },
    da: {
      subject: 'Vi har modtaget din registrering - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tak for din registrering',
      message: 'Vi har modtaget din registrering til',
      registrationDetails: 'Registreringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Placering',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'Én kategori',
      multipleCategories: 'Flere kategorier',
      paymentDeadline: 'Betalingsfrist',
      paymentNote: 'Udfør venligst din betaling senest 15 dage før turneringen starter, så vi kan reservere din plads og forberede os ordentligt til begivenheden.',
      paymentDeadlineText: 'Sidste betalingsfrist:',
      eventSchedule: 'Begivenhedskalender',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig en turnering på',
      followJourney: 'Følg rejsen:'
    },
    sv: {
      subject: 'Vi har mottagit din registrering - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tack för din registrering',
      message: 'Vi har mottagit din registrering för',
      registrationDetails: 'Registreringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datum',
      location: 'Plats',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'En kategori',
      multipleCategories: 'Flera kategorier',
      paymentDeadline: 'Betalningsfrist',
      paymentNote: 'Vänligen slutför din betalning senast 15 dagar före turneringens start, så att vi kan reservera din plats och förbereda oss ordentligt för evenemanget.',
      paymentDeadlineText: 'Sista betalningsdatum:',
      eventSchedule: 'Evenemangskalender',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig för en turnering på',
      followJourney: 'Följ resan:'
    },
    no: {
      subject: 'Vi har mottatt din registrering - PadelO₂',
      greeting: 'Hei',
      thankYou: 'Takk for din registrering',
      message: 'Vi har mottatt din registrering for',
      registrationDetails: 'Registreringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Plassering',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'Én kategori',
      multipleCategories: 'Flere kategorier',
      paymentDeadline: 'Betalingsfrist',
      paymentNote: 'Vennligst fullfør betalingen din senest 15 dager før turneringen starter, slik at vi kan reservere plassen din og forberede oss ordentlig for arrangementet.',
      paymentDeadlineText: 'Siste betalingsfrist:',
      eventSchedule: 'Arrangementskalender',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg for en turnering på',
      followJourney: 'Följ reisen:'
    },
    ar: {
      subject: 'لقد استلمنا تسجيلك - PadelO₂',
      greeting: 'مرحبا',
      thankYou: 'شكرا لتسجيلك',
      message: 'لقد استلمنا تسجيلك لـ',
      registrationDetails: 'تفاصيل التسجيل',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      location: 'الموقع',
      categories: 'الفئات',
      price: 'السعر',
      singleCategory: 'فئة واحدة',
      multipleCategories: 'فئات متعددة',
      paymentDeadline: 'موعد الدفع',
      paymentNote: 'يرجى إتمام الدفع في موعد أقصاه 15 يومًا قبل بدء البطولة، حتى نتمكن من حجز مكانك والاستعداد بشكل صحيح للحدث.',
      paymentDeadlineText: 'الموعد النهائي للدفع:',
      eventSchedule: 'جدول الأحداث',
      viewDashboard: 'عرض لوحة التحكم',
      footer: 'نراكم في البطولة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت في بطولة على',
      followJourney: 'تابع الرحلة:'
    },
    zh: {
      subject: '我们已收到您的注册 - PadelO₂',
      greeting: '您好',
      thankYou: '感谢您的注册',
      message: '我们已收到您对',
      registrationDetails: '注册详情',
      tournamentName: '锦标赛',
      dates: '日期',
      location: '地点',
      categories: '类别',
      price: '价格',
      singleCategory: '单一类别',
      multipleCategories: '多个类别',
      paymentDeadline: '付款截止日期',
      paymentNote: '请最迟在锦标赛开始前15天完成付款，以便我们为您预留位置并为活动做好充分准备。',
      paymentDeadlineText: '最终付款截止日期:',
      eventSchedule: '活动日程',
      viewDashboard: '查看仪表板',
      footer: '锦标赛见！',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:'
    }
  };

  const t = translations[locale] || translations.en;
  const categoryCount = categories.length;
  // Расчет цены: если одна категория - priceSingleCategory, если несколько - priceSingleCategory * количество
  const totalPrice = categoryCount === 1 
    ? tournament.priceSingleCategory 
    : tournament.priceSingleCategory ? tournament.priceSingleCategory * categoryCount : undefined;
  
  // Вычисляем дату оплаты (15 дней до начала)
  const paymentDeadlineDate = new Date(tournament.startDate);
  paymentDeadlineDate.setDate(paymentDeadlineDate.getDate() - 15);
  
  // Получаем subject с названием турнира
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : 'We got your registration - PadelO₂';
    const baseSubject: string = t.subjectBase || subjectString;
    subjectText = baseSubject.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
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
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
      }
    </style>
  </head>
  <body class="font-default">
    <table role="presentation" class="wrapper" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="main">
            <tr>
              <td style="padding: 22px 30px 12px 30px;">
                <div style="font-weight: 800; font-size: 22px; color: #0f172a; letter-spacing: 0.08em; text-transform: uppercase;">
                  PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                </div>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.thankYou}! ${t.message} <strong>${tournament.name}</strong>.</p>
                      
                      <div class="info-box">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.registrationDetails}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.tournamentName}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        ${tournament.location || tournament.locationAddress ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.location}:</div>
                          <div class="detail-value">${tournament.locationAddress || tournament.location || ''}</div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${localizedCategories.join(', ')}</div>
                        </div>
                        
                        ${totalPrice ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.price}:</div>
                          <div class="detail-value"><strong>${totalPrice} EUR</strong>${categoryCount > 1 ? ` (${categoryCount === 2 ? `${tournament.priceSingleCategory} + ${tournament.priceSingleCategory}` : categoryCount + ' ' + t.multipleCategories})` : ''}</div>
                        </div>
                        ` : ''}
                      </div>

                      <div class="warning-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">${t.paymentDeadline}:</p>
                        <p class="muted" style="margin: 0; color: #92400e;">${formatDate(paymentDeadlineDate.toISOString())}</p>
                        <p class="muted" style="margin: 8px 0 0 0; color: #92400e; font-size: 13px;">${t.paymentNote}</p>
                      </div>

                      ${tournament.eventSchedule && tournament.eventSchedule.length > 0 ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.eventSchedule}:</p>
                        ${tournament.eventSchedule.map((event: any) => `
                          <div class="detail-row">
                            <div class="detail-value"><strong>${event.title}</strong> - ${formatDate(event.date)} ${event.time ? `в ${event.time}` : ''}</div>
                            ${event.description ? `<div class="detail-value" style="margin-top: 4px; font-size: 12px; color: #6b7280;">${event.description}</div>` : ''}
                          </div>
                        `).join('')}
                      </div>
                      ` : ''}

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${dashboardUrl}" class="btn-primary">${t.viewDashboard}</a>
                          </td>
                        </tr>
                      </table>
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
}

// 11. Tournament Registration Confirmed - After Payment
export interface TournamentRegistrationConfirmedEmailData {
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
    description?: string;
    bannerImageData?: string;
  };
  categories: string[];
  paymentAmount: number;
  paymentMethod?: string;
  orderNumber?: string;
  locale?: string;
}

export function getTournamentRegistrationConfirmedEmailTemplate(data: TournamentRegistrationConfirmedEmailData): string {
  const { firstName, lastName, tournament, categories, paymentAmount, paymentMethod, orderNumber, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const dashboardUrl = `${siteUrl}/${locale}/dashboard`;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Payment confirmed - Tournament registration - PadelO₂',
      greeting: 'Hello',
      thankYou: 'Thank you for your payment!',
      message: 'Your payment for',
      hasBeenConfirmed: 'has been confirmed.',
      registrationConfirmed: 'Your tournament registration is now confirmed.',
      tournamentDetails: 'Tournament Details',
      tournamentName: 'Tournament',
      dates: 'Dates',
      location: 'Location',
      categories: 'Categories',
      paymentInfo: 'Payment Information',
      amount: 'Amount',
      method: 'Payment Method',
      orderNumber: 'Order Number',
      eventSchedule: 'Event Schedule',
      whatToBring: 'What to Bring',
      welcomePack: 'Welcome Pack',
      lottery: 'Lottery',
      rules: 'Rules',
      viewDashboard: 'View Dashboard',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because your payment was confirmed for a tournament on',
      followJourney: 'Follow the journey:'
    },
    ru: {
      subject: 'Оплата подтверждена - Регистрация на турнир - PadelO₂',
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за оплату!',
      message: 'Ваша оплата за',
      hasBeenConfirmed: 'была подтверждена.',
      registrationConfirmed: 'Ваша регистрация на турнир теперь подтверждена.',
      tournamentDetails: 'Детали турнира',
      tournamentName: 'Турнир',
      dates: 'Даты',
      location: 'Место проведения',
      categories: 'Категории',
      paymentInfo: 'Информация об оплате',
      amount: 'Сумма',
      method: 'Способ оплаты',
      orderNumber: 'Номер заказа',
      eventSchedule: 'Расписание событий',
      whatToBring: 'Что взять с собой',
      welcomePack: 'Welcome Pack',
      lottery: 'Лотерея',
      rules: 'Правила',
      viewDashboard: 'Перейти в Панель',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что ваша оплата была подтверждена за турнир на',
      followJourney: 'Следите за путешествием:'
    },
    ua: {
      subject: 'Оплата підтверджена - Реєстрація на турнір - PadelO₂',
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за оплату!',
      message: 'Ваша оплата за',
      hasBeenConfirmed: 'була підтверджена.',
      registrationConfirmed: 'Ваша реєстрація на турнір тепер підтверджена.',
      tournamentDetails: 'Деталі турніру',
      tournamentName: 'Турнір',
      dates: 'Дати',
      location: 'Місце проведення',
      categories: 'Категорії',
      paymentInfo: 'Інформація про оплату',
      amount: 'Сума',
      method: 'Спосіб оплати',
      orderNumber: 'Номер замовлення',
      eventSchedule: 'Розклад подій',
      whatToBring: 'Що взяти з собою',
      welcomePack: 'Welcome Pack',
      lottery: 'Лотерея',
      rules: 'Правила',
      viewDashboard: 'Перейти до Панелі',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що ваша оплата була підтверджена за турнір на',
      followJourney: 'Слідкуйте за подорожжю:'
    },
    es: {
      subject: 'Pago confirmado - Registro de torneo - PadelO₂',
      greeting: 'Hola',
      thankYou: '¡Gracias por tu pago!',
      message: 'Tu pago por',
      hasBeenConfirmed: 'ha sido confirmado.',
      registrationConfirmed: 'Tu registro en el torneo ahora está confirmado.',
      tournamentDetails: 'Detalles del Torneo',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      location: 'Ubicación',
      categories: 'Categorías',
      paymentInfo: 'Información de Pago',
      amount: 'Cantidad',
      method: 'Método de Pago',
      orderNumber: 'Número de Pedido',
      eventSchedule: 'Calendario de Eventos',
      whatToBring: 'Qué Traer',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotería',
      rules: 'Reglas',
      viewDashboard: 'Ver Panel',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tu pago fue confirmado para un torneo en',
      followJourney: 'Sigue el viaje:'
    },
    fr: {
      subject: 'Paiement confirmé - Inscription au tournoi - PadelO₂',
      greeting: 'Bonjour',
      thankYou: 'Merci pour votre paiement!',
      message: 'Votre paiement pour',
      hasBeenConfirmed: 'a été confirmé.',
      registrationConfirmed: 'Votre inscription au tournoi est maintenant confirmée.',
      tournamentDetails: 'Détails du Tournoi',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      location: 'Lieu',
      categories: 'Catégories',
      paymentInfo: 'Informations de Paiement',
      amount: 'Montant',
      method: 'Méthode de Paiement',
      orderNumber: 'Numéro de Commande',
      eventSchedule: 'Calendrier des Événements',
      whatToBring: 'À Apporter',
      welcomePack: 'Welcome Pack',
      lottery: 'Loterie',
      rules: 'Règles',
      viewDashboard: 'Voir le Tableau de bord',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que votre paiement a été confirmé pour un tournoi sur',
      followJourney: 'Suivez le voyage:'
    },
    de: {
      subject: 'Zahlung bestätigt - Turnieranmeldung - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Zahlung!',
      message: 'Ihre Zahlung für',
      hasBeenConfirmed: 'wurde bestätigt.',
      registrationConfirmed: 'Ihre Turnieranmeldung ist jetzt bestätigt.',
      tournamentDetails: 'Turnierdetails',
      tournamentName: 'Turnier',
      dates: 'Termine',
      location: 'Ort',
      categories: 'Kategorien',
      paymentInfo: 'Zahlungsinformationen',
      amount: 'Betrag',
      method: 'Zahlungsmethode',
      orderNumber: 'Bestellnummer',
      eventSchedule: 'Veranstaltungskalender',
      whatToBring: 'Was Mitzubringen',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotterie',
      rules: 'Regeln',
      viewDashboard: 'Dashboard anzeigen',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Ihre Zahlung für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:'
    },
    it: {
      subject: 'Pagamento confermato - Registrazione torneo - PadelO₂',
      greeting: 'Ciao',
      thankYou: 'Grazie per il pagamento!',
      message: 'Il tuo pagamento per',
      hasBeenConfirmed: 'è stato confermato.',
      registrationConfirmed: 'La tua registrazione al torneo è ora confermata.',
      tournamentDetails: 'Dettagli del Torneo',
      tournamentName: 'Torneo',
      dates: 'Date',
      location: 'Luogo',
      categories: 'Categorie',
      paymentInfo: 'Informazioni di Pagamento',
      amount: 'Importo',
      method: 'Metodo di Pagamento',
      orderNumber: 'Numero Ordine',
      eventSchedule: 'Calendario Eventi',
      whatToBring: 'Cosa Portare',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotteria',
      rules: 'Regole',
      viewDashboard: 'Vedi Dashboard',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché il tuo pagamento è stato confermato per un torneo su',
      followJourney: 'Segui il viaggio:'
    },
    ca: {
      subject: 'Pagament confirmat - Registre de torneig - PadelO₂',
      greeting: 'Hola',
      thankYou: 'Gràcies pel teu pagament!',
      message: 'El teu pagament per',
      hasBeenConfirmed: 'ha estat confirmat.',
      registrationConfirmed: 'El teu registre al torneig ara està confirmat.',
      tournamentDetails: 'Detalls del Torneig',
      tournamentName: 'Torneig',
      dates: 'Dates',
      location: 'Ubicació',
      categories: 'Categories',
      paymentInfo: 'Informació de Pagament',
      amount: 'Import',
      method: 'Mètode de Pagament',
      orderNumber: 'Número de Comanda',
      eventSchedule: 'Calendari d\'Esdeveniments',
      whatToBring: 'Què Portar',
      welcomePack: 'Welcome Pack',
      lottery: 'Loteria',
      rules: 'Regles',
      viewDashboard: 'Veure Tauler',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè el teu pagament va ser confirmat per a un torneig a',
      followJourney: 'Segueix el viatge:'
    },
    nl: {
      subject: 'Betaling bevestigd - Toernooiregistratie - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Bedankt voor uw betaling!',
      message: 'Uw betaling voor',
      hasBeenConfirmed: 'is bevestigd.',
      registrationConfirmed: 'Uw toernooiregistratie is nu bevestigd.',
      tournamentDetails: 'Toernooidetails',
      tournamentName: 'Toernooi',
      dates: 'Data',
      location: 'Locatie',
      categories: 'Categorieën',
      paymentInfo: 'Betalingsinformatie',
      amount: 'Bedrag',
      method: 'Betalingsmethode',
      orderNumber: 'Bestelnummer',
      eventSchedule: 'Evenementenkalender',
      whatToBring: 'Wat Mee te Nemen',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotterij',
      rules: 'Regels',
      viewDashboard: 'Dashboard bekijken',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat uw betaling is bevestigd voor een toernooi op',
      followJourney: 'Volg de reis:'
    },
    da: {
      subject: 'Betaling bekræftet - Turneringsregistrering - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tak for din betaling!',
      message: 'Din betaling for',
      hasBeenConfirmed: 'er blevet bekræftet.',
      registrationConfirmed: 'Din turneringsregistrering er nu bekræftet.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Placering',
      categories: 'Kategorier',
      paymentInfo: 'Betalingsinformation',
      amount: 'Beløb',
      method: 'Betalingsmetode',
      orderNumber: 'Ordrenummer',
      eventSchedule: 'Begivenhedskalender',
      whatToBring: 'Hvad Man Skal Medbringe',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotteri',
      rules: 'Regler',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi din betaling blev bekræftet for en turnering på',
      followJourney: 'Følg rejsen:'
    },
    sv: {
      subject: 'Betalning bekräftad - Turneringsregistrering - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tack för din betalning!',
      message: 'Din betalning för',
      hasBeenConfirmed: 'har bekräftats.',
      registrationConfirmed: 'Din turneringsregistrering är nu bekräftad.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datum',
      location: 'Plats',
      categories: 'Kategorier',
      paymentInfo: 'Betalningsinformation',
      amount: 'Belopp',
      method: 'Betalningsmetod',
      orderNumber: 'Ordernummer',
      eventSchedule: 'Evenemangskalender',
      whatToBring: 'Vad Man Ska Ta Med',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotteri',
      rules: 'Regler',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom din betalning bekräftades för en turnering på',
      followJourney: 'Följ resan:'
    },
    no: {
      subject: 'Betaling bekreftet - Turneringsregistrering - PadelO₂',
      greeting: 'Hei',
      thankYou: 'Takk for din betaling!',
      message: 'Din betaling for',
      hasBeenConfirmed: 'er blitt bekreftet.',
      registrationConfirmed: 'Din turneringsregistrering er nå bekreftet.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Plassering',
      categories: 'Kategorier',
      paymentInfo: 'Betalingsinformasjon',
      amount: 'Beløp',
      method: 'Betalingsmetode',
      orderNumber: 'Ordrenummer',
      eventSchedule: 'Arrangementskalender',
      whatToBring: 'Hva Man Skal Ta Med',
      welcomePack: 'Welcome Pack',
      lottery: 'Lotteri',
      rules: 'Regler',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi din betaling ble bekreftet for en turnering på',
      followJourney: 'Følg reisen:'
    },
    ar: {
      subject: 'تم تأكيد الدفع - تسجيل البطولة - PadelO₂',
      greeting: 'مرحبا',
      thankYou: 'شكرا لدفعك!',
      message: 'دفعتك لـ',
      hasBeenConfirmed: 'تم تأكيدها.',
      registrationConfirmed: 'تم تأكيد تسجيلك في البطولة الآن.',
      tournamentDetails: 'تفاصيل البطولة',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      location: 'الموقع',
      categories: 'الفئات',
      paymentInfo: 'معلومات الدفع',
      amount: 'المبلغ',
      method: 'طريقة الدفع',
      orderNumber: 'رقم الطلب',
      eventSchedule: 'جدول الأحداث',
      whatToBring: 'ما يجب إحضاره',
      welcomePack: 'Welcome Pack',
      lottery: 'اليانصيب',
      rules: 'القواعد',
      viewDashboard: 'عرض لوحة التحكم',
      footer: 'نراكم في البطولة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم تأكيد دفعتك لبطولة على',
      followJourney: 'تابع الرحلة:'
    },
    zh: {
      subject: '付款已确认 - 锦标赛注册 - PadelO₂',
      greeting: '您好',
      thankYou: '感谢您的付款！',
      message: '您对',
      hasBeenConfirmed: '的付款已确认。',
      registrationConfirmed: '您的锦标赛注册现已确认。',
      tournamentDetails: '锦标赛详情',
      tournamentName: '锦标赛',
      dates: '日期',
      location: '地点',
      categories: '类别',
      paymentInfo: '付款信息',
      amount: '金额',
      method: '付款方式',
      orderNumber: '订单号',
      eventSchedule: '活动日程',
      whatToBring: '需要携带的物品',
      welcomePack: 'Welcome Pack',
      lottery: '抽奖',
      rules: '规则',
      viewDashboard: '查看仪表板',
      footer: '锦标赛见！',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
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
      .success-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .social-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f1f5f9; border-radius: 999px; font-size: 11px; color: #475569; text-decoration: none; }
      .social-icon-circle { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; }
      .social-ig { background-color: #E4405F; }
      .social-yt { background-color: #FF0000; }
      .social-tt { background-color: #000000; }
      .social-fb { background-color: #1877F2; }
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
      }
    </style>
  </head>
  <body class="font-default">
    <table role="presentation" class="wrapper" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="main">
            <tr>
              <td style="padding: 22px 30px 12px 30px;">
                <div style="font-weight: 800; font-size: 22px; color: #0f172a; letter-spacing: 0.08em; text-transform: uppercase;">
                  PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                </div>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.thankYou}</p>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong> ${t.hasBeenConfirmed}</p>
                      
                      <div class="success-box">
                        <p class="muted" style="margin: 0; color: #166534; font-weight: 600; font-size: 14px;">✓ ${t.registrationConfirmed}</p>
                      </div>

                      <div class="info-box">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.tournamentDetails}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.tournamentName}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        ${tournament.location || tournament.locationAddress ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.location}:</div>
                          <div class="detail-value">${tournament.locationAddress || tournament.location || ''}</div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${categories.join(', ')}</div>
                        </div>
                      </div>

                      <div class="info-box" style="background: #f0fdf4; border-left-color: #22c55e;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #166534; font-size: 14px;">${t.paymentInfo}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.amount}:</div>
                          <div class="detail-value"><strong>${paymentAmount} ${locale === 'ru' || locale === 'ua' ? 'UAH' : 'EUR'}</strong></div>
                        </div>
                        
                        ${paymentMethod ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.method}:</div>
                          <div class="detail-value">${paymentMethod}</div>
                        </div>
                        ` : ''}
                        
                        ${orderNumber ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.orderNumber}:</div>
                          <div class="detail-value">${orderNumber}</div>
                        </div>
                        ` : ''}
                      </div>

                      ${tournament.eventSchedule && tournament.eventSchedule.length > 0 ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.eventSchedule}:</p>
                        ${tournament.eventSchedule.map((event: any) => `
                          <div class="detail-row">
                            <div class="detail-value"><strong>${event.title}</strong> - ${formatDate(event.date)} ${event.time ? `в ${event.time}` : ''}</div>
                            ${event.description ? `<div class="detail-value" style="margin-top: 4px; font-size: 12px; color: #6b7280;">${event.description}</div>` : ''}
                          </div>
                        `).join('')}
                      </div>
                      ` : ''}

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${dashboardUrl}" class="btn-primary">${t.viewDashboard}</a>
                          </td>
                        </tr>
                      </table>
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
}

