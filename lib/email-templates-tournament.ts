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
    translations?: {
      description?: Record<string, string>;
      eventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
    };
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
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  // Получаем переведенное расписание событий из БД
  let eventScheduleToDisplay = tournament.eventSchedule || [];
  if (tournament.translations?.eventSchedule?.[locale]) {
    eventScheduleToDisplay = tournament.translations.eventSchedule[locale];
  }

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
      followJourney: 'Follow the journey:',
      unsubscribe: 'Unsubscribe'
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
  // Расчет цены: если одна категория - priceSingleCategory, если несколько - priceDoubleCategory * количество
  const totalPrice = categoryCount === 1 
    ? tournament.priceSingleCategory 
    : tournament.priceDoubleCategory ? tournament.priceDoubleCategory * categoryCount : (tournament.priceSingleCategory ? tournament.priceSingleCategory * categoryCount : undefined);
  
  // Вычисляем дату оплаты (15 дней до начала)
  const paymentDeadlineDate = new Date(tournament.startDate);
  paymentDeadlineDate.setDate(paymentDeadlineDate.getDate() - 15);
  
  // Получаем subject с названием турнира
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : 'We got your registration - PadelO₂';
    const subjectBaseString = typeof t.subjectBase === 'string' ? t.subjectBase : subjectString;
    const baseSubject: string = subjectBaseString || subjectString;
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
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 8px; background: #e0f2fe; padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 8px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.05em; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                          <div class="detail-value">${localizedCategories.length > 0 ? localizedCategories.join(', ') : (categories && Array.isArray(categories) && categories.length > 0 ? categories.filter((c: any) => c && typeof c === 'string').join(', ') : 'N/A')}</div>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.price}:</div>
                          <div class="detail-value"><strong>${totalPrice && totalPrice > 0 ? totalPrice : (tournament.priceSingleCategory || 0)} EUR</strong>${categoryCount > 1 ? ` (${categoryCount === 2 ? `${tournament.priceDoubleCategory || tournament.priceSingleCategory || 0} + ${tournament.priceDoubleCategory || tournament.priceSingleCategory || 0}` : categoryCount + ' × ' + (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0)})` : ''}</div>
                        </div>
                      </div>

                      <div class="warning-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">${t.paymentDeadline}:</p>
                        <p class="muted" style="margin: 0; color: #92400e;">${formatDate(paymentDeadlineDate.toISOString())}</p>
                        <p class="muted" style="margin: 8px 0 0 0; color: #92400e; font-size: 13px;">${t.paymentNote}</p>
                      </div>

                      ${eventScheduleToDisplay && eventScheduleToDisplay.length > 0 ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.eventSchedule}:</p>
                        ${eventScheduleToDisplay.map((event: any) => `
                          <div class="detail-row">
                            <div class="detail-value"><strong>${event.title}</strong> - ${formatDate(event.date)} ${event.time ? (locale === 'ua' || locale === 'ru' ? 'в' : 'at') + ' ' + event.time : ''}</div>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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
    priceSingleCategory?: number;
    priceDoubleCategory?: number;
    description?: string;
    bannerImageData?: string;
    translations?: {
      description?: Record<string, string>;
      eventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
    };
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

  // Import localization utilities
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');

  // Форматируем даты с локализацией
  const formatDate = (dateString: string) => formatLocalizedDate(dateString, locale);
  
  // Локализуем категории
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  // Получаем переведенное расписание событий
  let eventScheduleToDisplay = tournament.eventSchedule || [];
  if (tournament.translations?.eventSchedule?.[locale]) {
    eventScheduleToDisplay = tournament.translations.eventSchedule[locale];
  }

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
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
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
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
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
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
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
  const categoryCount = categories.length;
  // Расчет цены: если одна категория - priceSingleCategory, если несколько - priceDoubleCategory * количество
  const totalPrice = categoryCount === 1 
    ? tournament.priceSingleCategory 
    : tournament.priceDoubleCategory ? tournament.priceDoubleCategory * categoryCount : (tournament.priceSingleCategory ? tournament.priceSingleCategory * categoryCount : undefined);
  const subjectText = t.subject || 'Payment confirmed - Tournament registration - PadelO₂';

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                          <div class="detail-value">${localizedCategories.length > 0 ? localizedCategories.join(', ') : (categories && Array.isArray(categories) && categories.length > 0 ? categories.filter((c: any) => c && typeof c === 'string').join(', ') : 'N/A')}</div>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.price || 'Price'}:</div>
                          <div class="detail-value"><strong>${totalPrice && totalPrice > 0 ? totalPrice : (tournament.priceSingleCategory || 0)} EUR</strong>${categoryCount > 1 ? ` (${categoryCount === 2 ? `${tournament.priceDoubleCategory || tournament.priceSingleCategory || 0} + ${tournament.priceDoubleCategory || tournament.priceSingleCategory || 0}` : categoryCount + ' × ' + (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0)})` : ''}</div>
                        </div>
                      </div>

                      <div class="info-box" style="background: #f0fdf4; border-left-color: #22c55e;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #166534; font-size: 14px;">${t.paymentInfo}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.amount}:</div>
                          <div class="detail-value"><strong>${paymentAmount || 0} EUR</strong></div>
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

                      ${eventScheduleToDisplay && eventScheduleToDisplay.length > 0 ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.eventSchedule}:</p>
                        ${eventScheduleToDisplay.map((event: any) => `
                          <div class="detail-row">
                            <div class="detail-value"><strong>${event.title}</strong> - ${formatDate(event.date)} ${event.time ? (locale === 'ua' || locale === 'ru' ? 'в' : 'at') + ' ' + event.time : ''}</div>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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


// 12. Tournament Registration - Waiting List
export interface TournamentWaitingListEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    location?: string;
    locationAddress?: string;
  };
  categories: string[];
  locale?: string;
}

export function getTournamentWaitingListEmailTemplate(data: TournamentWaitingListEmailData): string {
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
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `You're on the waiting list for ${tournamentName} - PadelO₂`,
      subjectBase: 'You\'re on the waiting list - PadelO₂',
      greeting: 'Hello',
      message: 'Thank you for your interest in',
      waitingListInfo: 'All spots for this tournament are currently filled. You have been added to our waiting list.',
      notification: 'We will notify you immediately if a spot becomes available.',
      tournamentDetails: 'Tournament Details',
      tournamentName: 'Tournament',
      dates: 'Dates',
      location: 'Location',
      categories: 'Categories',
      viewDashboard: 'View Dashboard',
      footer: 'We\'ll be in touch soon!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you registered for a tournament on',
      followJourney: 'Follow the journey:',
      unsubscribe: 'Unsubscribe',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: (tournamentName: string) => `Вы в списке ожидания на ${tournamentName} - PadelO₂`,
      subjectBase: 'Вы в списке ожидания - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Спасибо за ваш интерес к',
      waitingListInfo: 'Все места на этот турнир в настоящее время заняты. Вы были добавлены в наш список ожидания.',
      notification: 'Мы немедленно уведомим вас, если место освободится.',
      tournamentDetails: 'Детали турнира',
      tournamentName: 'Турнир',
      dates: 'Даты',
      location: 'Место',
      categories: 'Категории',
      viewDashboard: 'Посмотреть панель',
      footer: 'Мы скоро свяжемся с вами!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на турнир на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: (tournamentName: string) => `Ви в списку очікування на ${tournamentName} - PadelO₂`,
      subjectBase: 'Ви в списку очікування - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Дякуємо за ваш інтерес до',
      waitingListInfo: 'Всі місця на цей турнір в даний час зайняті. Вас було додано до нашого списку очікування.',
      notification: 'Ми негайно повідомимо вас, якщо місце звільниться.',
      tournamentDetails: 'Деталі турніру',
      tournamentName: 'Турнір',
      dates: 'Дати',
      location: 'Місце',
      categories: 'Категорії',
      viewDashboard: 'Переглянути панель',
      footer: 'Ми незабаром зв\'яжемося з вами!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на турнір на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: (tournamentName: string) => `Estás en la lista de espera para ${tournamentName} - PadelO₂`,
      subjectBase: 'Estás en la lista de espera - PadelO₂',
      greeting: 'Hola',
      message: 'Gracias por tu interés en',
      waitingListInfo: 'Todas las plazas para este torneo están actualmente ocupadas. Has sido añadido a nuestra lista de espera.',
      notification: 'Te notificaremos inmediatamente si se libera una plaza.',
      tournamentDetails: 'Detalles del Torneo',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      location: 'Ubicación',
      categories: 'Categorías',
      viewDashboard: 'Ver Panel',
      footer: '¡Nos pondremos en contacto pronto!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque te registraste para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: (tournamentName: string) => `Vous êtes sur la liste d'attente pour ${tournamentName} - PadelO₂`,
      subjectBase: 'Vous êtes sur la liste d\'attente - PadelO₂',
      greeting: 'Bonjour',
      message: 'Merci pour votre intérêt pour',
      waitingListInfo: 'Toutes les places pour ce tournoi sont actuellement occupées. Vous avez été ajouté à notre liste d\'attente.',
      notification: 'Nous vous notifierons immédiatement si une place se libère.',
      tournamentDetails: 'Détails du Tournoi',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      location: 'Lieu',
      categories: 'Catégories',
      viewDashboard: 'Voir le Tableau de Bord',
      footer: 'Nous vous contacterons bientôt!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit à un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: (tournamentName: string) => `Sie stehen auf der Warteliste für ${tournamentName} - PadelO₂`,
      subjectBase: 'Sie stehen auf der Warteliste - PadelO₂',
      greeting: 'Hallo',
      message: 'Vielen Dank für Ihr Interesse an',
      waitingListInfo: 'Alle Plätze für dieses Turnier sind derzeit belegt. Sie wurden zu unserer Warteliste hinzugefügt.',
      notification: 'Wir werden Sie sofort benachrichtigen, wenn ein Platz frei wird.',
      tournamentDetails: 'Turnierdetails',
      tournamentName: 'Turnier',
      dates: 'Termine',
      location: 'Ort',
      categories: 'Kategorien',
      viewDashboard: 'Dashboard anzeigen',
      footer: 'Wir werden uns bald melden!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: (tournamentName: string) => `Sei nella lista d'attesa per ${tournamentName} - PadelO₂`,
      subjectBase: 'Sei nella lista d\'attesa - PadelO₂',
      greeting: 'Ciao',
      message: 'Grazie per il tuo interesse per',
      waitingListInfo: 'Tutti i posti per questo torneo sono attualmente occupati. Sei stato aggiunto alla nostra lista d\'attesa.',
      notification: 'Ti avviseremo immediatamente se si libera un posto.',
      tournamentDetails: 'Dettagli del Torneo',
      tournamentName: 'Torneo',
      dates: 'Date',
      location: 'Luogo',
      categories: 'Categorie',
      viewDashboard: 'Visualizza Dashboard',
      footer: 'Ti contatteremo presto!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: (tournamentName: string) => `Estàs a la llista d'espera per a ${tournamentName} - PadelO₂`,
      subjectBase: 'Estàs a la llista d\'espera - PadelO₂',
      greeting: 'Hola',
      message: 'Gràcies pel teu interès en',
      waitingListInfo: 'Tots els llocs per a aquest torneig estan actualment ocupats. Has estat afegit a la nostra llista d\'espera.',
      notification: 'T\'avisarem immediatament si es lliura un lloc.',
      tournamentDetails: 'Detalls del Torneig',
      tournamentName: 'Torneig',
      dates: 'Dates',
      location: 'Ubicació',
      categories: 'Categories',
      viewDashboard: 'Veure Tauler',
      footer: 'Ens posarem en contacte aviat!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: (tournamentName: string) => `Je staat op de wachtlijst voor ${tournamentName} - PadelO₂`,
      subjectBase: 'Je staat op de wachtlijst - PadelO₂',
      greeting: 'Hallo',
      message: 'Bedankt voor je interesse in',
      waitingListInfo: 'Alle plaatsen voor dit toernooi zijn momenteel bezet. Je bent toegevoegd aan onze wachtlijst.',
      notification: 'We zullen je onmiddellijk op de hoogte stellen als er een plek vrijkomt.',
      tournamentDetails: 'Toernooi Details',
      tournamentName: 'Toernooi',
      dates: 'Data',
      location: 'Locatie',
      categories: 'Categorieën',
      viewDashboard: 'Bekijk Dashboard',
      footer: 'We nemen binnenkort contact op!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je je hebt geregistreerd voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: (tournamentName: string) => `Du er på ventelisten for ${tournamentName} - PadelO₂`,
      subjectBase: 'Du er på ventelisten - PadelO₂',
      greeting: 'Hej',
      message: 'Tak for din interesse i',
      waitingListInfo: 'Alle pladser til dette turnering er i øjeblikket optaget. Du er blevet tilføjet til vores venteliste.',
      notification: 'Vi vil meddele dig med det samme, hvis en plads bliver ledig.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Sted',
      categories: 'Kategorier',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi kontakter dig snart!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: (tournamentName: string) => `Du är på väntelistan för ${tournamentName} - PadelO₂`,
      subjectBase: 'Du är på väntelistan - PadelO₂',
      greeting: 'Hej',
      message: 'Tack för ditt intresse för',
      waitingListInfo: 'Alla platser för denna turnering är för närvarande upptagna. Du har lagts till på vår väntelista.',
      notification: 'Vi meddelar dig omedelbart om en plats blir ledig.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datum',
      location: 'Plats',
      categories: 'Kategorier',
      viewDashboard: 'Visa Dashboard',
      footer: 'Vi hör av oss snart!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: (tournamentName: string) => `Du er på ventelisten for ${tournamentName} - PadelO₂`,
      subjectBase: 'Du er på ventelisten - PadelO₂',
      greeting: 'Hei',
      message: 'Takk for din interesse for',
      waitingListInfo: 'Alle plasser til denne turneringen er for øyeblikket opptatt. Du er blitt lagt til på vår venteliste.',
      notification: 'Vi vil varsle deg umiddelbart hvis en plass blir ledig.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Sted',
      categories: 'Kategorier',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi kontakter deg snart!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: (tournamentName: string) => `أنت في قائمة الانتظار لـ ${tournamentName} - PadelO₂`,
      subjectBase: 'أنت في قائمة الانتظار - PadelO₂',
      greeting: 'مرحبا',
      message: 'شكرًا لاهتمامك بـ',
      waitingListInfo: 'جميع الأماكن في هذه البطولة ممتلئة حاليًا. تمت إضافتك إلى قائمة الانتظار الخاصة بنا.',
      notification: 'سنخطرك فورًا إذا أصبح مكان متاحًا.',
      tournamentDetails: 'تفاصيل البطولة',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      location: 'الموقع',
      categories: 'الفئات',
      viewDashboard: 'عرض لوحة التحكم',
      footer: 'سنتواصل معك قريبًا!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت في بطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: (tournamentName: string) => `您在 ${tournamentName} 的候补名单上 - PadelO₂`,
      subjectBase: '您在候补名单上 - PadelO₂',
      greeting: '您好',
      message: '感谢您对',
      waitingListInfo: '本次锦标赛的所有名额目前都已满。您已被添加到我们的候补名单中。',
      notification: '如果有名额空出，我们会立即通知您。',
      tournamentDetails: '锦标赛详情',
      tournamentName: '锦标赛',
      dates: '日期',
      location: '地点',
      categories: '类别',
      viewDashboard: '查看仪表板',
      footer: '我们会尽快与您联系!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  
  // Определяем subjectText
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : (typeof t.subjectBase === 'string' ? t.subjectBase : 'You\'re on the waiting list - PadelO₂');
    subjectText = subjectString.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong>.</p>
                      
                      <div class="warning-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #92400e; font-size: 14px;">${t.waitingListInfo}</p>
                        <p class="muted" style="margin: 0; color: #92400e; font-size: 13px;">${t.notification}</p>
                      </div>
                      
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.tournamentDetails}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.tournamentName}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        ${tournament.locationAddress || tournament.location ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.location}:</div>
                          <div class="detail-value">${tournament.locationAddress || tournament.location || ''}</div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${(categories && Array.isArray(categories) && categories.length > 0) ? (localizedCategories.length > 0 ? localizedCategories.join(', ') : categories.join(', ')) : 'N/A'}</div>
                        </div>
                      </div>
                      
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 13. Tournament Spot Confirmed (from waiting list)
export interface TournamentSpotConfirmedEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    location?: string;
    locationAddress?: string;
    priceSingleCategory?: number;
    priceDoubleCategory?: number;
  };
  categories: string[];
  confirmUrl: string;
  expiresIn?: string;
  locale?: string;
}

export function getTournamentSpotConfirmedEmailTemplate(data: TournamentSpotConfirmedEmailData): string {
  const { firstName, lastName, tournament, categories, confirmUrl, expiresIn = '48 hours', locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  // Import localization utilities
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');

  // Форматируем даты с локализацией
  const formatDate = (dateString: string) => formatLocalizedDate(dateString, locale);
  
  // Локализуем категории
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  // Расчет цены: если одна категория - priceSingleCategory, если несколько - priceDoubleCategory * количество
  const categoryCount = categories.length;
  const totalPrice = categoryCount === 1 
    ? (tournament.priceSingleCategory || 0)
    : (tournament.priceDoubleCategory || tournament.priceSingleCategory || 0) * categoryCount;

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `A spot is available for ${tournamentName} - PadelO₂`,
      subjectBase: 'A spot is available - PadelO₂',
      greeting: 'Hello',
      message: 'Great news! A spot has become available for',
      important: 'Important: Please confirm and pay for your participation within',
      expires: 'This link will expire in',
      tournamentDetails: 'Tournament Details',
      tournamentName: 'Tournament',
      dates: 'Dates',
      location: 'Location',
      categories: 'Categories',
      price: 'Price',
      singleCategory: 'Single category',
      multipleCategories: 'Multiple categories',
      confirmButton: 'Confirm & Pay Now',
      ifButtonDoesntWork: 'If the button doesn\'t work, paste this link into your browser:',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because a spot became available for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: (tournamentName: string) => `Место доступно для ${tournamentName} - PadelO₂`,
      subjectBase: 'Место доступно - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Отличные новости! Место стало доступным для',
      important: 'Важно: Пожалуйста, подтвердите и оплатите ваше участие в течение',
      expires: 'Эта ссылка действительна в течение',
      tournamentDetails: 'Детали турнира',
      tournamentName: 'Турнир',
      dates: 'Даты',
      location: 'Место',
      categories: 'Категории',
      price: 'Цена',
      singleCategory: 'Одна категория',
      multipleCategories: 'Несколько категорий',
      confirmButton: 'Подтвердить и оплатить',
      ifButtonDoesntWork: 'Если кнопка не работает, вставьте эту ссылку в браузер:',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что место стало доступным для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: (tournamentName: string) => `Місце доступне для ${tournamentName} - PadelO₂`,
      subjectBase: 'Місце доступне - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Чудові новини! Місце стало доступним для',
      important: 'Важливо: Будь ласка, підтвердіть та оплатіть вашу участь протягом',
      expires: 'Це посилання дійсне протягом',
      tournamentDetails: 'Деталі турніру',
      tournamentName: 'Турнір',
      dates: 'Дати',
      location: 'Місце',
      categories: 'Категорії',
      price: 'Ціна',
      singleCategory: 'Одна категорія',
      multipleCategories: 'Кілька категорій',
      confirmButton: 'Підтвердити та оплатити',
      ifButtonDoesntWork: 'Якщо кнопка не працює, вставте це посилання в браузер:',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що місце стало доступним для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: (tournamentName: string) => `Hay una plaza disponible para ${tournamentName} - PadelO₂`,
      subjectBase: 'Hay una plaza disponible - PadelO₂',
      greeting: 'Hola',
      message: '¡Buenas noticias! Una plaza está disponible para',
      important: 'Importante: Por favor, confirma y paga tu participación dentro de',
      expires: 'Este enlace expirará en',
      tournamentDetails: 'Detalles del Torneo',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      location: 'Ubicación',
      categories: 'Categorías',
      price: 'Precio',
      singleCategory: 'Una categoría',
      multipleCategories: 'Varias categorías',
      confirmButton: 'Confirmar y Pagar Ahora',
      ifButtonDoesntWork: 'Si el botón no funciona, pega este enlace en tu navegador:',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque una plaza está disponible para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: (tournamentName: string) => `Une place est disponible pour ${tournamentName} - PadelO₂`,
      subjectBase: 'Une place est disponible - PadelO₂',
      greeting: 'Bonjour',
      message: 'Excellente nouvelle! Une place est disponible pour',
      important: 'Important: Veuillez confirmer et payer votre participation dans',
      expires: 'Ce lien expirera dans',
      tournamentDetails: 'Détails du Tournoi',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      location: 'Lieu',
      categories: 'Catégories',
      price: 'Prix',
      singleCategory: 'Une catégorie',
      multipleCategories: 'Plusieurs catégories',
      confirmButton: 'Confirmer et Payer Maintenant',
      ifButtonDoesntWork: 'Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur:',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'une place est disponible pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: (tournamentName: string) => `Ein Platz ist verfügbar für ${tournamentName} - PadelO₂`,
      subjectBase: 'Ein Platz ist verfügbar - PadelO₂',
      greeting: 'Hallo',
      message: 'Großartige Neuigkeiten! Ein Platz ist verfügbar für',
      important: 'Wichtig: Bitte bestätigen und bezahlen Sie Ihre Teilnahme innerhalb von',
      expires: 'Dieser Link läuft ab in',
      tournamentDetails: 'Turnierdetails',
      tournamentName: 'Turnier',
      dates: 'Termine',
      location: 'Ort',
      categories: 'Kategorien',
      price: 'Preis',
      singleCategory: 'Eine Kategorie',
      multipleCategories: 'Mehrere Kategorien',
      confirmButton: 'Jetzt Bestätigen und Bezahlen',
      ifButtonDoesntWork: 'Wenn die Schaltfläche nicht funktioniert, fügen Sie diesen Link in Ihren Browser ein:',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil ein Platz für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: (tournamentName: string) => `Un posto è disponibile per ${tournamentName} - PadelO₂`,
      subjectBase: 'Un posto è disponibile - PadelO₂',
      greeting: 'Ciao',
      message: 'Ottime notizie! Un posto è disponibile per',
      important: 'Importante: Si prega di confermare e pagare la partecipazione entro',
      expires: 'Questo link scadrà tra',
      tournamentDetails: 'Dettagli del Torneo',
      tournamentName: 'Torneo',
      dates: 'Date',
      location: 'Luogo',
      categories: 'Categorie',
      price: 'Prezzo',
      singleCategory: 'Una categoria',
      multipleCategories: 'Più categorie',
      confirmButton: 'Conferma e Paga Ora',
      ifButtonDoesntWork: 'Se il pulsante non funziona, incolla questo link nel tuo browser:',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché un posto è disponibile per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: (tournamentName: string) => `Hi ha un lloc disponible per a ${tournamentName} - PadelO₂`,
      subjectBase: 'Hi ha un lloc disponible - PadelO₂',
      greeting: 'Hola',
      message: 'Bones notícies! Un lloc està disponible per a',
      important: 'Important: Si us plau, confirma i paga la teva participació dins de',
      expires: 'Aquest enllaç expirarà en',
      tournamentDetails: 'Detalls del Torneig',
      tournamentName: 'Torneig',
      dates: 'Dates',
      location: 'Ubicació',
      categories: 'Categories',
      price: 'Preu',
      singleCategory: 'Una categoria',
      multipleCategories: 'Vàries categories',
      confirmButton: 'Confirmar i Pagar Ara',
      ifButtonDoesntWork: 'Si el botó no funciona, enganxa aquest enllaç al teu navegador:',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè un lloc està disponible per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: (tournamentName: string) => `Er is een plek beschikbaar voor ${tournamentName} - PadelO₂`,
      subjectBase: 'Er is een plek beschikbaar - PadelO₂',
      greeting: 'Hallo',
      message: 'Geweldig nieuws! Er is een plek beschikbaar voor',
      important: 'Belangrijk: Bevestig en betaal je deelname binnen',
      expires: 'Deze link verloopt over',
      tournamentDetails: 'Toernooi Details',
      tournamentName: 'Toernooi',
      dates: 'Data',
      location: 'Locatie',
      categories: 'Categorieën',
      price: 'Prijs',
      singleCategory: 'Eén categorie',
      multipleCategories: 'Meerdere categorieën',
      confirmButton: 'Bevestigen en Nu Betalen',
      ifButtonDoesntWork: 'Als de knop niet werkt, plak deze link in je browser:',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat er een plek beschikbaar is voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: (tournamentName: string) => `Der er en plads tilgængelig for ${tournamentName} - PadelO₂`,
      subjectBase: 'Der er en plads tilgængelig - PadelO₂',
      greeting: 'Hej',
      message: 'Fantastiske nyheder! Der er en plads tilgængelig for',
      important: 'Vigtigt: Bekræft og betal din deltagelse inden for',
      expires: 'Dette link udløber om',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Sted',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'Én kategori',
      multipleCategories: 'Flere kategorier',
      confirmButton: 'Bekræft og Betal Nu',
      ifButtonDoesntWork: 'Hvis knappen ikke virker, indsæt dette link i din browser:',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi der er en plads tilgængelig for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: (tournamentName: string) => `En plats är tillgänglig för ${tournamentName} - PadelO₂`,
      subjectBase: 'En plats är tillgänglig - PadelO₂',
      greeting: 'Hej',
      message: 'Fantastiska nyheter! En plats är tillgänglig för',
      important: 'Viktigt: Vänligen bekräfta och betala din deltagande inom',
      expires: 'Denna länk upphör att gälla om',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datum',
      location: 'Plats',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'En kategori',
      multipleCategories: 'Flera kategorier',
      confirmButton: 'Bekräfta och Betala Nu',
      ifButtonDoesntWork: 'Om knappen inte fungerar, klistra in denna länk i din webbläsare:',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en plats är tillgänglig för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: (tournamentName: string) => `En plass er tilgjengelig for ${tournamentName} - PadelO₂`,
      subjectBase: 'En plass er tilgjengelig - PadelO₂',
      greeting: 'Hei',
      message: 'Fantastiske nyheter! En plass er tilgjengelig for',
      important: 'Viktig: Vennligst bekreft og betal din deltakelse innen',
      expires: 'Denne lenken utløper om',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      location: 'Sted',
      categories: 'Kategorier',
      price: 'Pris',
      singleCategory: 'Én kategori',
      multipleCategories: 'Flere kategorier',
      confirmButton: 'Bekreft og Betal Nå',
      ifButtonDoesntWork: 'Hvis knappen ikke fungerer, lim inn denne lenken i nettleseren din:',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en plass er tilgjengelig for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: (tournamentName: string) => `مكان متاح لـ ${tournamentName} - PadelO₂`,
      subjectBase: 'مكان متاح - PadelO₂',
      greeting: 'مرحبا',
      message: 'أخبار رائعة! مكان متاح لـ',
      important: 'مهم: يرجى تأكيد ودفع مشاركتك خلال',
      expires: 'ستنتهي صلاحية هذا الرابط خلال',
      tournamentDetails: 'تفاصيل البطولة',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      location: 'الموقع',
      categories: 'الفئات',
      price: 'السعر',
      singleCategory: 'فئة واحدة',
      multipleCategories: 'عدة فئات',
      confirmButton: 'تأكيد والدفع الآن',
      ifButtonDoesntWork: 'إذا لم يعمل الزر، الصق هذا الرابط في متصفحك:',
      footer: 'نراك في البطولة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأن مكانًا متاحًا لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: (tournamentName: string) => `有 ${tournamentName} 的名额 - PadelO₂`,
      subjectBase: '有名额 - PadelO₂',
      greeting: '您好',
      message: '好消息！有',
      important: '重要提示: 请在',
      expires: '此链接将在',
      tournamentDetails: '锦标赛详情',
      tournamentName: '锦标赛',
      dates: '日期',
      location: '地点',
      categories: '类别',
      price: '价格',
      singleCategory: '一个类别',
      multipleCategories: '多个类别',
      confirmButton: '立即确认并支付',
      ifButtonDoesntWork: '如果按钮不起作用，请将此链接粘贴到浏览器中:',
      footer: '锦标赛见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  
  // Определяем subjectText
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : (typeof t.subjectBase === 'string' ? t.subjectBase : 'A spot is available - PadelO₂');
    subjectText = subjectString.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong>!</p>
                      
                      <div class="success-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.important} <strong>${expiresIn}</strong>.</p>
                        <p class="muted" style="margin: 0; color: #065f46; font-size: 13px;">${t.expires} <strong>${expiresIn}</strong>.</p>
                      </div>
                      
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.tournamentDetails}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.tournamentName}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        ${tournament.locationAddress || tournament.location ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.location}:</div>
                          <div class="detail-value">${tournament.locationAddress || tournament.location || ''}</div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${localizedCategories.length > 0 ? localizedCategories.join(', ') : (categories && Array.isArray(categories) && categories.length > 0 ? categories.filter((c: any) => c && typeof c === 'string').join(', ') : 'N/A')}</div>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.price}:</div>
                          <div class="detail-value"><strong>${totalPrice} EUR</strong>${categoryCount > 1 ? ` (${categoryCount === 2 ? `${tournament.priceSingleCategory || 0} + ${tournament.priceSingleCategory || 0}` : categoryCount + ' ' + t.multipleCategories})` : ''}</div>
                        </div>
                      </div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${confirmUrl}" class="btn-primary">${t.confirmButton}</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p class="muted" style="margin: 20px 0 0 0; font-size: 12px; color: #6b7280;">
                        ${t.ifButtonDoesntWork}
                        <br>
                        <a href="${confirmUrl}" style="color: #0284c7; word-break: break-all; font-size: 11px;">${confirmUrl}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 14. Payment Received / Tournament Entry Paid
export interface PaymentReceivedEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  categories: string[];
  paymentAmount: number;
  paymentMethod: string;
  orderNumber: string;
  transactionId?: string;
  paidAt?: string;
  locale?: string;
}

export function getPaymentReceivedEmailTemplate(data: PaymentReceivedEmailData): string {
  const { firstName, lastName, tournament, categories, paymentAmount, paymentMethod, orderNumber, transactionId, paidAt, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const dashboardUrl = `${siteUrl}/${locale}/dashboard`;
  const paymentTime = paidAt || new Date().toLocaleString(locale);

  // Import localization utilities
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');

  // Форматируем даты с локализацией
  const formatDate = (dateString: string) => formatLocalizedDate(dateString, locale);
  
  // Локализуем категории
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `Payment received for ${tournamentName} - PadelO₂`,
      subjectBase: 'Payment received - PadelO₂',
      greeting: 'Hello',
      thankYou: 'Thank you for your payment!',
      message: 'Your payment for',
      hasBeenReceived: 'has been successfully received.',
      receipt: 'Payment Receipt',
      tournamentName: 'Tournament',
      dates: 'Dates',
      categories: 'Categories',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      orderNumber: 'Order Number',
      transactionId: 'Transaction ID',
      paidAt: 'Paid At',
      viewDashboard: 'View Dashboard',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because your payment was processed for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: (tournamentName: string) => `Оплата получена за ${tournamentName} - PadelO₂`,
      subjectBase: 'Оплата получена - PadelO₂',
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за оплату!',
      message: 'Ваша оплата за',
      hasBeenReceived: 'была успешно получена.',
      receipt: 'Квитанция об оплате',
      tournamentName: 'Турнир',
      dates: 'Даты',
      categories: 'Категории',
      amount: 'Сумма',
      paymentMethod: 'Способ оплаты',
      orderNumber: 'Номер заказа',
      transactionId: 'ID транзакции',
      paidAt: 'Оплачено',
      viewDashboard: 'Посмотреть панель',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что ваша оплата была обработана для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: (tournamentName: string) => `Оплата отримана за ${tournamentName} - PadelO₂`,
      subjectBase: 'Оплата отримана - PadelO₂',
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за оплату!',
      message: 'Ваша оплата за',
      hasBeenReceived: 'була успішно отримана.',
      receipt: 'Квитанція про оплату',
      tournamentName: 'Турнір',
      dates: 'Дати',
      categories: 'Категорії',
      amount: 'Сума',
      paymentMethod: 'Спосіб оплати',
      orderNumber: 'Номер замовлення',
      transactionId: 'ID транзакції',
      paidAt: 'Оплачено',
      viewDashboard: 'Переглянути панель',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що ваша оплата була оброблена для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: (tournamentName: string) => `Pago recibido para ${tournamentName} - PadelO₂`,
      subjectBase: 'Pago recibido - PadelO₂',
      greeting: 'Hola',
      thankYou: '¡Gracias por tu pago!',
      message: 'Tu pago para',
      hasBeenReceived: 'ha sido recibido exitosamente.',
      receipt: 'Recibo de Pago',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      categories: 'Categorías',
      amount: 'Cantidad',
      paymentMethod: 'Método de Pago',
      orderNumber: 'Número de Pedido',
      transactionId: 'ID de Transacción',
      paidAt: 'Pagado En',
      viewDashboard: 'Ver Panel',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tu pago fue procesado para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: (tournamentName: string) => `Paiement reçu pour ${tournamentName} - PadelO₂`,
      subjectBase: 'Paiement reçu - PadelO₂',
      greeting: 'Bonjour',
      thankYou: 'Merci pour votre paiement!',
      message: 'Votre paiement pour',
      hasBeenReceived: 'a été reçu avec succès.',
      receipt: 'Reçu de Paiement',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      categories: 'Catégories',
      amount: 'Montant',
      paymentMethod: 'Méthode de Paiement',
      orderNumber: 'Numéro de Commande',
      transactionId: 'ID de Transaction',
      paidAt: 'Payé Le',
      viewDashboard: 'Voir le Tableau de Bord',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que votre paiement a été traité pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: (tournamentName: string) => `Zahlung erhalten für ${tournamentName} - PadelO₂`,
      subjectBase: 'Zahlung erhalten - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Zahlung!',
      message: 'Ihre Zahlung für',
      hasBeenReceived: 'wurde erfolgreich erhalten.',
      receipt: 'Zahlungsbeleg',
      tournamentName: 'Turnier',
      dates: 'Termine',
      categories: 'Kategorien',
      amount: 'Betrag',
      paymentMethod: 'Zahlungsmethode',
      orderNumber: 'Bestellnummer',
      transactionId: 'Transaktions-ID',
      paidAt: 'Bezahlt Am',
      viewDashboard: 'Dashboard anzeigen',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Ihre Zahlung für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: (tournamentName: string) => `Pagamento ricevuto per ${tournamentName} - PadelO₂`,
      subjectBase: 'Pagamento ricevuto - PadelO₂',
      greeting: 'Ciao',
      thankYou: 'Grazie per il pagamento!',
      message: 'Il tuo pagamento per',
      hasBeenReceived: 'è stato ricevuto con successo.',
      receipt: 'Ricevuta di Pagamento',
      tournamentName: 'Torneo',
      dates: 'Date',
      location: 'Luogo',
      categories: 'Categorie',
      amount: 'Importo',
      paymentMethod: 'Metodo di Pagamento',
      orderNumber: 'Numero Ordine',
      transactionId: 'ID Transazione',
      paidAt: 'Pagato Il',
      viewDashboard: 'Visualizza Dashboard',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché il tuo pagamento è stato elaborato per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: (tournamentName: string) => `Pagament rebut per a ${tournamentName} - PadelO₂`,
      subjectBase: 'Pagament rebut - PadelO₂',
      greeting: 'Hola',
      thankYou: 'Gràcies pel teu pagament!',
      message: 'El teu pagament per a',
      hasBeenReceived: 'ha estat rebut amb èxit.',
      receipt: 'Rebut de Pagament',
      tournamentName: 'Torneig',
      dates: 'Dates',
      categories: 'Categories',
      amount: 'Import',
      paymentMethod: 'Mètode de Pagament',
      orderNumber: 'Número de Comanda',
      transactionId: 'ID de Transacció',
      paidAt: 'Pagat El',
      viewDashboard: 'Veure Tauler',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè el teu pagament va ser processat per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: (tournamentName: string) => `Betaling ontvangen voor ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling ontvangen - PadelO₂',
      greeting: 'Hallo',
      thankYou: 'Bedankt voor je betaling!',
      message: 'Je betaling voor',
      hasBeenReceived: 'is succesvol ontvangen.',
      receipt: 'Betalingsbewijs',
      tournamentName: 'Toernooi',
      dates: 'Data',
      categories: 'Categorieën',
      amount: 'Bedrag',
      paymentMethod: 'Betalingsmethode',
      orderNumber: 'Bestelnummer',
      transactionId: 'Transactie-ID',
      paidAt: 'Betaald Op',
      viewDashboard: 'Bekijk Dashboard',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je betaling is verwerkt voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: (tournamentName: string) => `Betaling modtaget for ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling modtaget - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tak for din betaling!',
      message: 'Din betaling for',
      hasBeenReceived: 'er blevet modtaget med succes.',
      receipt: 'Betalingskvittering',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      categories: 'Kategorier',
      amount: 'Beløb',
      paymentMethod: 'Betalingsmetode',
      orderNumber: 'Ordrenummer',
      transactionId: 'Transaktions-ID',
      paidAt: 'Betalt Den',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi din betaling blev behandlet for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: (tournamentName: string) => `Betalning mottagen för ${tournamentName} - PadelO₂`,
      subjectBase: 'Betalning mottagen - PadelO₂',
      greeting: 'Hej',
      thankYou: 'Tack för din betalning!',
      message: 'Din betalning för',
      hasBeenReceived: 'har mottagits framgångsrikt.',
      receipt: 'Betalningskvitto',
      tournamentName: 'Turnering',
      dates: 'Datum',
      categories: 'Kategorier',
      amount: 'Belopp',
      paymentMethod: 'Betalningsmetod',
      orderNumber: 'Ordernummer',
      transactionId: 'Transaktions-ID',
      paidAt: 'Betalt Den',
      viewDashboard: 'Visa Dashboard',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom din betalning bearbetades för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: (tournamentName: string) => `Betaling mottatt for ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling mottatt - PadelO₂',
      greeting: 'Hei',
      thankYou: 'Takk for din betaling!',
      message: 'Din betaling for',
      hasBeenReceived: 'er blitt mottatt.',
      receipt: 'Betalingskvittering',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      categories: 'Kategorier',
      amount: 'Beløp',
      paymentMethod: 'Betalingsmetode',
      orderNumber: 'Ordrenummer',
      transactionId: 'Transaksjons-ID',
      paidAt: 'Betalt Den',
      viewDashboard: 'Se Dashboard',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi din betaling ble behandlet for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: (tournamentName: string) => `تم استلام الدفع لـ ${tournamentName} - PadelO₂`,
      subjectBase: 'تم استلام الدفع - PadelO₂',
      greeting: 'مرحبا',
      thankYou: 'شكرًا لك على الدفع!',
      message: 'دفعك لـ',
      hasBeenReceived: 'تم استلامه بنجاح.',
      receipt: 'إيصال الدفع',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      categories: 'الفئات',
      amount: 'المبلغ',
      paymentMethod: 'طريقة الدفع',
      orderNumber: 'رقم الطلب',
      transactionId: 'معرف المعاملة',
      paidAt: 'تم الدفع في',
      viewDashboard: 'عرض لوحة التحكم',
      footer: 'نراك في البطولة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأن دفعتك تمت معالجتها لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: (tournamentName: string) => `已收到 ${tournamentName} 的付款 - PadelO₂`,
      subjectBase: '已收到付款 - PadelO₂',
      greeting: '您好',
      thankYou: '感谢您的付款!',
      message: '您对',
      hasBeenReceived: '的付款已成功收到。',
      receipt: '付款收据',
      tournamentName: '锦标赛',
      dates: '日期',
      categories: '类别',
      amount: '金额',
      paymentMethod: '付款方式',
      orderNumber: '订单号',
      transactionId: '交易ID',
      paidAt: '付款时间',
      viewDashboard: '查看仪表板',
      footer: '锦标赛见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  
  // Определяем subjectText
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : (typeof t.subjectBase === 'string' ? t.subjectBase : 'Payment received - PadelO₂');
    subjectText = subjectString.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong> ${t.hasBeenReceived}</p>
                      
                      <div class="success-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.receipt}</p>
                      </div>
                      
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.tournamentName}: ${tournament.name}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${localizedCategories.length > 0 ? localizedCategories.join(', ') : (categories && Array.isArray(categories) && categories.length > 0 ? categories.filter((c: any) => c && typeof c === 'string').join(', ') : 'N/A')}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.amount}:</div>
                          <div class="detail-value"><strong>${paymentAmount} EUR</strong></div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.paymentMethod}:</div>
                          <div class="detail-value">${paymentMethod}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.orderNumber}:</div>
                          <div class="detail-value">${orderNumber}</div>
                        </div>
                        
                        ${transactionId ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.transactionId}:</div>
                          <div class="detail-value">${transactionId}</div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.paidAt}:</div>
                          <div class="detail-value">${paymentTime}</div>
                        </div>
                      </div>
                      
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 15. Payment Failed / Retry
export interface PaymentFailedEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  categories: string[];
  paymentAmount: number;
  retryUrl: string;
  orderNumber?: string;
  errorMessage?: string;
  locale?: string;
}

export function getPaymentFailedEmailTemplate(data: PaymentFailedEmailData): string {
  const { firstName, lastName, tournament, categories, paymentAmount, retryUrl, orderNumber, errorMessage, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  // Import localization utilities
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');

  // Форматируем даты с локализацией
  const formatDate = (dateString: string) => formatLocalizedDate(dateString, locale);
  
  // Локализуем категории
  // Нормализуем и локализуем категории, с fallback на оригинальные значения
  let localizedCategories: string[] = [];
  if (categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.map(cat => {
      if (!cat || typeof cat !== 'string') return cat;
      const normalized = cat.trim();
      if (!normalized) return cat;
      
      const localized = getLocalizedCategoryName(normalized, locale);
      // Если локализация вернула оригинальное значение (не найдено), используем его
      // Если локализация вернула пустую строку, используем оригинальное значение
      const result = localized && localized.trim() !== '' && localized !== normalized ? localized : normalized;
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[email-template] Category localization:', {
          original: cat,
          normalized: normalized,
          localized: localized,
          result: result,
          locale: locale,
        });
      }
      return result;
    }).filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '');
  }
  
  // Если локализация не дала результатов, используем оригинальные категории
  if (localizedCategories.length === 0 && categories && Array.isArray(categories) && categories.length > 0) {
    localizedCategories = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '').map((cat: string) => cat.trim());
  }

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `Payment failed for ${tournamentName} - PadelO₂`,
      subjectBase: 'Payment failed - PadelO₂',
      greeting: 'Hello',
      message: 'We encountered an issue processing your payment for',
      errorInfo: 'Your payment could not be completed. Please try again or update your payment method.',
      tournamentDetails: 'Tournament Details',
      tournamentName: 'Tournament',
      dates: 'Dates',
      categories: 'Categories',
      amount: 'Amount',
      orderNumber: 'Order Number',
      retryButton: 'Retry Payment',
      updateCard: 'Update Payment Method',
      footer: 'We\'re here to help!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because a payment failed for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: (tournamentName: string) => `Оплата не прошла для ${tournamentName} - PadelO₂`,
      subjectBase: 'Оплата не прошла - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Мы столкнулись с проблемой при обработке вашей оплаты за',
      errorInfo: 'Ваша оплата не может быть завершена. Пожалуйста, попробуйте снова или обновите способ оплаты.',
      tournamentDetails: 'Детали турнира',
      tournamentName: 'Турнир',
      dates: 'Даты',
      categories: 'Категории',
      amount: 'Сумма',
      orderNumber: 'Номер заказа',
      retryButton: 'Повторить оплату',
      updateCard: 'Обновить способ оплаты',
      footer: 'Мы здесь, чтобы помочь!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что оплата не прошла для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: (tournamentName: string) => `Оплата не пройшла для ${tournamentName} - PadelO₂`,
      subjectBase: 'Оплата не пройшла - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ми зіткнулися з проблемою при обробці вашої оплати за',
      errorInfo: 'Вашу оплату не може бути завершено. Будь ласка, спробуйте ще раз або оновіть спосіб оплати.',
      tournamentDetails: 'Деталі турніру',
      tournamentName: 'Турнір',
      dates: 'Дати',
      categories: 'Категорії',
      amount: 'Сума',
      orderNumber: 'Номер замовлення',
      retryButton: 'Повторити оплату',
      updateCard: 'Оновити спосіб оплати',
      footer: 'Ми тут, щоб допомогти!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що оплата не пройшла для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: (tournamentName: string) => `Pago fallido para ${tournamentName} - PadelO₂`,
      subjectBase: 'Pago fallido - PadelO₂',
      greeting: 'Hola',
      message: 'Encontramos un problema al procesar tu pago para',
      errorInfo: 'Tu pago no pudo ser completado. Por favor, intenta de nuevo o actualiza tu método de pago.',
      tournamentDetails: 'Detalles del Torneo',
      tournamentName: 'Torneo',
      dates: 'Fechas',
      categories: 'Categorías',
      amount: 'Cantidad',
      orderNumber: 'Número de Pedido',
      retryButton: 'Reintentar Pago',
      updateCard: 'Actualizar Método de Pago',
      footer: '¡Estamos aquí para ayudar!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque un pago falló para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: (tournamentName: string) => `Paiement échoué pour ${tournamentName} - PadelO₂`,
      subjectBase: 'Paiement échoué - PadelO₂',
      greeting: 'Bonjour',
      message: 'Nous avons rencontré un problème lors du traitement de votre paiement pour',
      errorInfo: 'Votre paiement n\'a pas pu être complété. Veuillez réessayer ou mettre à jour votre méthode de paiement.',
      tournamentDetails: 'Détails du Tournoi',
      tournamentName: 'Tournoi',
      dates: 'Dates',
      categories: 'Catégories',
      amount: 'Montant',
      orderNumber: 'Numéro de Commande',
      retryButton: 'Réessayer le Paiement',
      updateCard: 'Mettre à Jour la Méthode de Paiement',
      footer: 'Nous sommes là pour vous aider!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'un paiement a échoué pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: (tournamentName: string) => `Zahlung fehlgeschlagen für ${tournamentName} - PadelO₂`,
      subjectBase: 'Zahlung fehlgeschlagen - PadelO₂',
      greeting: 'Hallo',
      message: 'Wir haben ein Problem bei der Verarbeitung Ihrer Zahlung für',
      errorInfo: 'Ihre Zahlung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut oder aktualisieren Sie Ihre Zahlungsmethode.',
      tournamentDetails: 'Turnierdetails',
      tournamentName: 'Turnier',
      dates: 'Termine',
      categories: 'Kategorien',
      amount: 'Betrag',
      orderNumber: 'Bestellnummer',
      retryButton: 'Zahlung Wiederholen',
      updateCard: 'Zahlungsmethode Aktualisieren',
      footer: 'Wir sind hier, um zu helfen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine Zahlung für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: (tournamentName: string) => `Pagamento fallito per ${tournamentName} - PadelO₂`,
      subjectBase: 'Pagamento fallito - PadelO₂',
      greeting: 'Ciao',
      message: 'Abbiamo riscontrato un problema nell\'elaborazione del tuo pagamento per',
      errorInfo: 'Il tuo pagamento non può essere completato. Per favore, riprova o aggiorna il tuo metodo di pagamento.',
      tournamentDetails: 'Dettagli del Torneo',
      tournamentName: 'Torneo',
      dates: 'Date',
      categories: 'Categorie',
      amount: 'Importo',
      orderNumber: 'Numero Ordine',
      retryButton: 'Riprova Pagamento',
      updateCard: 'Aggiorna Metodo di Pagamento',
      footer: 'Siamo qui per aiutare!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché un pagamento è fallito per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: (tournamentName: string) => `Pagament fallit per a ${tournamentName} - PadelO₂`,
      subjectBase: 'Pagament fallit - PadelO₂',
      greeting: 'Hola',
      message: 'Hem trobat un problema en processar el teu pagament per a',
      errorInfo: 'El teu pagament no s\'ha pogut completar. Si us plau, torna a intentar-ho o actualitza el teu mètode de pagament.',
      tournamentDetails: 'Detalls del Torneig',
      tournamentName: 'Torneig',
      dates: 'Dates',
      categories: 'Categories',
      amount: 'Import',
      orderNumber: 'Número de Comanda',
      retryButton: 'Tornar a Intentar el Pagament',
      updateCard: 'Actualitzar Mètode de Pagament',
      footer: 'Estem aquí per ajudar!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè un pagament ha fallat per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: (tournamentName: string) => `Betaling mislukt voor ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling mislukt - PadelO₂',
      greeting: 'Hallo',
      message: 'We hebben een probleem ondervonden bij het verwerken van je betaling voor',
      errorInfo: 'Je betaling kon niet worden voltooid. Probeer het opnieuw of werk je betaalmethode bij.',
      tournamentDetails: 'Toernooi Details',
      tournamentName: 'Toernooi',
      dates: 'Data',
      categories: 'Categorieën',
      amount: 'Bedrag',
      orderNumber: 'Bestelnummer',
      retryButton: 'Betaling Opnieuw Proberen',
      updateCard: 'Betaalmethode Bijwerken',
      footer: 'We zijn er om te helpen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat een betaling is mislukt voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: (tournamentName: string) => `Betaling mislykkedes for ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling mislykkedes - PadelO₂',
      greeting: 'Hej',
      message: 'Vi stødte på et problem ved behandling af din betaling for',
      errorInfo: 'Din betaling kunne ikke gennemføres. Prøv venligst igen eller opdater din betalingsmetode.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      categories: 'Kategorier',
      amount: 'Beløb',
      orderNumber: 'Ordrenummer',
      retryButton: 'Prøv Betaling Igen',
      updateCard: 'Opdater Betalingsmetode',
      footer: 'Vi er her for at hjælpe!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi en betaling mislykkedes for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: (tournamentName: string) => `Betalning misslyckades för ${tournamentName} - PadelO₂`,
      subjectBase: 'Betalning misslyckades - PadelO₂',
      greeting: 'Hej',
      message: 'Vi stötte på ett problem vid behandling av din betalning för',
      errorInfo: 'Din betalning kunde inte slutföras. Vänligen försök igen eller uppdatera din betalningsmetod.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datum',
      categories: 'Kategorier',
      amount: 'Belopp',
      orderNumber: 'Ordernummer',
      retryButton: 'Försök Betala Igen',
      updateCard: 'Uppdatera Betalningsmetod',
      footer: 'Vi är här för att hjälpa!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en betalning misslyckades för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: (tournamentName: string) => `Betaling mislyktes for ${tournamentName} - PadelO₂`,
      subjectBase: 'Betaling mislyktes - PadelO₂',
      greeting: 'Hei',
      message: 'Vi støtte på et problem ved behandling av din betaling for',
      errorInfo: 'Din betaling kunne ikke fullføres. Vennligst prøv igjen eller oppdater betalingsmetoden din.',
      tournamentDetails: 'Turneringsdetaljer',
      tournamentName: 'Turnering',
      dates: 'Datoer',
      categories: 'Kategorier',
      amount: 'Beløp',
      orderNumber: 'Ordrenummer',
      retryButton: 'Prøv Betaling Igjen',
      updateCard: 'Oppdater Betalingsmetode',
      footer: 'Vi er her for å hjelpe!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en betaling mislyktes for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: (tournamentName: string) => `فشل الدفع لـ ${tournamentName} - PadelO₂`,
      subjectBase: 'فشل الدفع - PadelO₂',
      greeting: 'مرحبا',
      message: 'واجهنا مشكلة في معالجة دفعتك لـ',
      errorInfo: 'لا يمكن إكمال دفعتك. يرجى المحاولة مرة أخرى أو تحديث طريقة الدفع الخاصة بك.',
      tournamentDetails: 'تفاصيل البطولة',
      tournamentName: 'البطولة',
      dates: 'التواريخ',
      categories: 'الفئات',
      amount: 'المبلغ',
      orderNumber: 'رقم الطلب',
      retryButton: 'إعادة محاولة الدفع',
      updateCard: 'تحديث طريقة الدفع',
      footer: 'نحن هنا للمساعدة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأن الدفع فشل لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: (tournamentName: string) => `付款失败 ${tournamentName} - PadelO₂`,
      subjectBase: '付款失败 - PadelO₂',
      greeting: '您好',
      message: '我们在处理您对',
      errorInfo: '您的付款无法完成。请重试或更新您的付款方式。',
      tournamentDetails: '锦标赛详情',
      tournamentName: '锦标赛',
      dates: '日期',
      categories: '类别',
      amount: '金额',
      orderNumber: '订单号',
      retryButton: '重试付款',
      updateCard: '更新付款方式',
      footer: '我们随时为您提供帮助!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  
  // Определяем subjectText
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : (typeof t.subjectBase === 'string' ? t.subjectBase : 'Payment failed - PadelO₂');
    subjectText = subjectString.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .btn-secondary { background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 999px; font-size: 14px; font-weight: 600; color: #ffffff !important; padding: 11px 30px; display: inline-block; box-shadow: 0 10px 26px rgba(245, 158, 11, 0.35); margin-left: 10px; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
        .btn-secondary { margin-left: 0; margin-top: 10px; display: block; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong>.</p>
                      
                      <div class="error-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #991b1b; font-size: 14px;">${t.errorInfo}</p>
                        ${errorMessage ? `<p class="muted" style="margin: 8px 0 0 0; color: #991b1b; font-size: 13px;"><strong>Error:</strong> ${errorMessage}</p>` : ''}
                      </div>
                      
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.tournamentDetails}</p>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.tournamentName}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.dates}:</div>
                          <div class="detail-value">${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.categories}:</div>
                          <div class="detail-value">${localizedCategories.length > 0 ? localizedCategories.join(', ') : (categories && Array.isArray(categories) && categories.length > 0 ? categories.filter((c: any) => c && typeof c === 'string').join(', ') : 'N/A')}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.amount}:</div>
                          <div class="detail-value"><strong>${paymentAmount} EUR</strong></div>
                        </div>
                        
                        ${orderNumber ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.orderNumber}:</div>
                          <div class="detail-value">${orderNumber}</div>
                        </div>
                        ` : ''}
                      </div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${retryUrl}" class="btn-primary">${t.retryButton}</a>
                            <a href="${retryUrl}" class="btn-secondary">${t.updateCard}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 16. Tournament Schedule Published
export interface TournamentSchedulePublishedEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  scheduleUrl: string;
  locale?: string;
}

export function getTournamentSchedulePublishedEmailTemplate(data: TournamentSchedulePublishedEmailData): string {
  const { firstName, lastName, tournament, scheduleUrl, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  const translations: Record<string, Record<string, string | ((tournamentName: string) => string)>> = {
    en: {
      subject: (tournamentName: string) => `Your match schedule is ready for ${tournamentName} - PadelO₂`,
      subjectBase: 'Your match schedule is ready - PadelO₂',
      greeting: 'Hello',
      message: 'Great news! Your match schedule for',
      isReady: 'is ready.',
      viewSchedule: 'View Schedule',
      footer: 'See you on the court!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because the schedule was published for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: (tournamentName: string) => `Ваше расписание матчей готово для ${tournamentName} - PadelO₂`,
      subjectBase: 'Ваше расписание матчей готово - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Отличные новости! Ваше расписание матчей для',
      isReady: 'готово.',
      viewSchedule: 'Посмотреть расписание',
      footer: 'Увидимся на корте!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что расписание было опубликовано для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: (tournamentName: string) => `Ваш розклад матчів готовий для ${tournamentName} - PadelO₂`,
      subjectBase: 'Ваш розклад матчів готовий - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Чудові новини! Ваш розклад матчів для',
      isReady: 'готовий.',
      viewSchedule: 'Переглянути розклад',
      footer: 'Побачимося на корті!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що розклад було опубліковано для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: (tournamentName: string) => `Tu calendario de partidos está listo para ${tournamentName} - PadelO₂`,
      subjectBase: 'Tu calendario de partidos está listo - PadelO₂',
      greeting: 'Hola',
      message: '¡Buenas noticias! Tu calendario de partidos para',
      isReady: 'está listo.',
      viewSchedule: 'Ver Calendario',
      footer: '¡Nos vemos en la cancha!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se publicó el calendario para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: (tournamentName: string) => `Votre calendrier de matchs est prêt pour ${tournamentName} - PadelO₂`,
      subjectBase: 'Votre calendrier de matchs est prêt - PadelO₂',
      greeting: 'Bonjour',
      message: 'Excellente nouvelle! Votre calendrier de matchs pour',
      isReady: 'est prêt.',
      viewSchedule: 'Voir le Calendrier',
      footer: 'À bientôt sur le court!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que le calendrier a été publié pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: (tournamentName: string) => `Ihr Spielplan ist bereit für ${tournamentName} - PadelO₂`,
      subjectBase: 'Ihr Spielplan ist bereit - PadelO₂',
      greeting: 'Hallo',
      message: 'Großartige Neuigkeiten! Ihr Spielplan für',
      isReady: 'ist bereit.',
      viewSchedule: 'Spielplan Anzeigen',
      footer: 'Wir sehen uns auf dem Platz!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil der Spielplan für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: (tournamentName: string) => `Il tuo calendario delle partite è pronto per ${tournamentName} - PadelO₂`,
      subjectBase: 'Il tuo calendario delle partite è pronto - PadelO₂',
      greeting: 'Ciao',
      message: 'Ottime notizie! Il tuo calendario delle partite per',
      isReady: 'è pronto.',
      viewSchedule: 'Visualizza Calendario',
      footer: 'Ci vediamo in campo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché il calendario è stato pubblicato per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: (tournamentName: string) => `El teu calendari de partits està llest per a ${tournamentName} - PadelO₂`,
      subjectBase: 'El teu calendari de partits està llest - PadelO₂',
      greeting: 'Hola',
      message: 'Bones notícies! El teu calendari de partits per a',
      isReady: 'està llest.',
      viewSchedule: 'Veure Calendari',
      footer: 'Ens veiem a la pista!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè es va publicar el calendari per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: (tournamentName: string) => `Je wedstrijdschema is klaar voor ${tournamentName} - PadelO₂`,
      subjectBase: 'Je wedstrijdschema is klaar - PadelO₂',
      greeting: 'Hallo',
      message: 'Geweldig nieuws! Je wedstrijdschema voor',
      isReady: 'is klaar.',
      viewSchedule: 'Bekijk Schema',
      footer: 'Tot ziens op de baan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat het schema is gepubliceerd voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: (tournamentName: string) => `Din kampkalender er klar til ${tournamentName} - PadelO₂`,
      subjectBase: 'Din kampkalender er klar - PadelO₂',
      greeting: 'Hej',
      message: 'Fantastiske nyheder! Din kampkalender til',
      isReady: 'er klar.',
      viewSchedule: 'Se Kalender',
      footer: 'Vi ses på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi kalenderen blev offentliggjort for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: (tournamentName: string) => `Din matchkalender är redo för ${tournamentName} - PadelO₂`,
      subjectBase: 'Din matchkalender är redo - PadelO₂',
      greeting: 'Hej',
      message: 'Fantastiska nyheter! Din matchkalender för',
      isReady: 'är redo.',
      viewSchedule: 'Visa Kalender',
      footer: 'Vi ses på banan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom kalendern publicerades för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: (tournamentName: string) => `Din kampkalender er klar for ${tournamentName} - PadelO₂`,
      subjectBase: 'Din kampkalender er klar - PadelO₂',
      greeting: 'Hei',
      message: 'Fantastiske nyheter! Din kampkalender for',
      isReady: 'er klar.',
      viewSchedule: 'Se Kalender',
      footer: 'Vi sees på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi kalenderen ble publisert for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: (tournamentName: string) => `جدول مبارياتك جاهز لـ ${tournamentName} - PadelO₂`,
      subjectBase: 'جدول مبارياتك جاهز - PadelO₂',
      greeting: 'مرحبا',
      message: 'أخبار رائعة! جدول مبارياتك لـ',
      isReady: 'جاهز.',
      viewSchedule: 'عرض الجدول',
      footer: 'نراك في الملعب!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم نشر الجدول لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: (tournamentName: string) => `您的比赛日程已为 ${tournamentName} 准备好 - PadelO₂`,
      subjectBase: '您的比赛日程已准备好 - PadelO₂',
      greeting: '您好',
      message: '好消息！您对',
      isReady: '的比赛日程已准备好。',
      viewSchedule: '查看日程',
      footer: '球场上见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  
  let subjectText: string;
  if (typeof t.subject === 'function') {
    subjectText = t.subject(tournament.name);
  } else {
    const subjectString = typeof t.subject === 'string' ? t.subject : (typeof t.subjectBase === 'string' ? t.subjectBase : 'Your match schedule is ready - PadelO₂');
    subjectText = subjectString.replace(' - PadelO₂', ` for ${tournament.name} - PadelO₂`);
  }

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${subjectText}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong> ${t.isReady}</p>
                      
                      <div class="success-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.viewSchedule}</p>
                      </div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${scheduleUrl}" class="btn-primary">${t.viewSchedule}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 17. Match Reminder - 1 Day Before
export interface MatchReminder1DayEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  match: {
    date: string;
    time: string;
    courtNumber: number;
    opponent: string;
    format: string;
  };
  locale?: string;
}

export function getMatchReminder1DayEmailTemplate(data: MatchReminder1DayEmailData): string {
  const { firstName, lastName, tournament, match, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const { getLocalizedCategoryName, formatLocalizedDate } = require('@/lib/localization-utils');
  const matchDate = formatLocalizedDate(match.date, locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Match reminder - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      reminder: 'Reminder: Your match is tomorrow!',
      tournament: 'Tournament',
      date: 'Date',
      time: 'Time',
      court: 'Court',
      opponent: 'Opponent',
      format: 'Format',
      footer: 'See you on the court!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you have a match scheduled for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Напоминание о матче - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      reminder: 'Напоминание: Ваш матч завтра!',
      tournament: 'Турнир',
      date: 'Дата',
      time: 'Время',
      court: 'Корт',
      opponent: 'Соперник',
      format: 'Формат',
      footer: 'Увидимся на корте!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что у вас запланирован матч для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Нагадування про матч - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      reminder: 'Нагадування: Ваш матч завтра!',
      tournament: 'Турнір',
      date: 'Дата',
      time: 'Час',
      court: 'Корт',
      opponent: 'Суперник',
      format: 'Формат',
      footer: 'Побачимося на корті!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що у вас запланований матч для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Recordatorio de partido - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      reminder: 'Recordatorio: ¡Tu partido es mañana!',
      tournament: 'Torneo',
      date: 'Fecha',
      time: 'Hora',
      court: 'Cancha',
      opponent: 'Oponente',
      format: 'Formato',
      footer: '¡Nos vemos en la cancha!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tienes un partido programado para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Rappel de match - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      reminder: 'Rappel: Votre match est demain!',
      tournament: 'Tournoi',
      date: 'Date',
      time: 'Heure',
      court: 'Court',
      opponent: 'Adversaire',
      format: 'Format',
      footer: 'À bientôt sur le court!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous avez un match programmé pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Spielerinnerung - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      reminder: 'Erinnerung: Ihr Spiel ist morgen!',
      tournament: 'Turnier',
      date: 'Datum',
      time: 'Uhrzeit',
      court: 'Platz',
      opponent: 'Gegner',
      format: 'Format',
      footer: 'Wir sehen uns auf dem Platz!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie ein Spiel für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Promemoria partita - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      reminder: 'Promemoria: La tua partita è domani!',
      tournament: 'Torneo',
      date: 'Data',
      time: 'Ora',
      court: 'Campo',
      opponent: 'Avversario',
      format: 'Formato',
      footer: 'Ci vediamo in campo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché hai una partita programmata per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Recordatori de partit - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      reminder: 'Recordatori: El teu partit és demà!',
      tournament: 'Torneig',
      date: 'Data',
      time: 'Hora',
      court: 'Pista',
      opponent: 'Oponent',
      format: 'Format',
      footer: 'Ens veiem a la pista!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè tens un partit programat per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Wedstrijdherinnering - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      reminder: 'Herinnering: Je wedstrijd is morgen!',
      tournament: 'Toernooi',
      date: 'Datum',
      time: 'Tijd',
      court: 'Baan',
      opponent: 'Tegenstander',
      format: 'Formaat',
      footer: 'Tot ziens op de baan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je een wedstrijd hebt gepland voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Kamp påmindelse - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      reminder: 'Påmindelse: Din kamp er i morgen!',
      tournament: 'Turnering',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      opponent: 'Modstander',
      format: 'Format',
      footer: 'Vi ses på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du har en kamp planlagt til et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Matchpåminnelse - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      reminder: 'Påminnelse: Din match är imorgon!',
      tournament: 'Turnering',
      date: 'Datum',
      time: 'Tid',
      court: 'Bana',
      opponent: 'Motståndare',
      format: 'Format',
      footer: 'Vi ses på banan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du har en match schemalagd för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Kamp påminnelse - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      reminder: 'Påminnelse: Din kamp er i morgen!',
      tournament: 'Turnering',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      opponent: 'Motstander',
      format: 'Format',
      footer: 'Vi sees på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du har en kamp planlagt for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `تذكير بالمباراة - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      reminder: 'تذكير: مباراتك غدًا!',
      tournament: 'البطولة',
      date: 'التاريخ',
      time: 'الوقت',
      court: 'الملعب',
      opponent: 'الخصم',
      format: 'التنسيق',
      footer: 'نراك في الملعب!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأن لديك مباراة مجدولة لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `比赛提醒 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      reminder: '提醒: 您的比赛在明天!',
      tournament: '锦标赛',
      date: '日期',
      time: '时间',
      court: '球场',
      opponent: '对手',
      format: '格式',
      footer: '球场上见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;"><strong>${t.reminder}</strong></p>
                      
                      <div class="info-box" style="margin-top: 20px;">
                        <div class="detail-row">
                          <div class="detail-label">${t.tournament}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.date}:</div>
                          <div class="detail-value">${matchDate}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.time}:</div>
                          <div class="detail-value">${match.time}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.court}:</div>
                          <div class="detail-value">${t.court} ${match.courtNumber}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.opponent}:</div>
                          <div class="detail-value">${match.opponent}</div>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.format}:</div>
                          <div class="detail-value">${match.format}</div>
                        </div>
                      </div>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 18. Match Reminder - Same Day (1-2 hours before)
export interface MatchReminderSameDayEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  match: {
    date: string;
    time: string;
    courtNumber: number;
  };
  locale?: string;
}

export function getMatchReminderSameDayEmailTemplate(data: MatchReminderSameDayEmailData): string {
  const { firstName, lastName, tournament, match, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const { formatLocalizedDate } = require('@/lib/localization-utils');
  const matchDate = formatLocalizedDate(match.date, locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Don't be late - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      message: 'Don\'t be late, game time!',
      matchInfo: 'Your match starts soon:',
      tournament: 'Tournament',
      date: 'Date',
      time: 'Time',
      court: 'Court',
      footer: 'See you on the court!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you have a match scheduled for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Не опаздывайте - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      message: 'Не опаздывайте, время игры!',
      matchInfo: 'Ваш матч скоро начнется:',
      tournament: 'Турнир',
      date: 'Дата',
      time: 'Время',
      court: 'Корт',
      footer: 'Увидимся на корте!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что у вас запланирован матч для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Не запізнюйтесь - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      message: 'Не запізнюйтесь, час гри!',
      matchInfo: 'Ваш матч скоро почнеться:',
      tournament: 'Турнір',
      date: 'Дата',
      time: 'Час',
      court: 'Корт',
      footer: 'Побачимося на корті!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що у вас запланований матч для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `No llegues tarde - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: '¡No llegues tarde, es hora del juego!',
      matchInfo: 'Tu partido comienza pronto:',
      tournament: 'Torneo',
      date: 'Fecha',
      time: 'Hora',
      court: 'Cancha',
      footer: '¡Nos vemos en la cancha!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tienes un partido programado para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Ne soyez pas en retard - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      message: 'Ne soyez pas en retard, c\'est l\'heure du match!',
      matchInfo: 'Votre match commence bientôt:',
      tournament: 'Tournoi',
      date: 'Date',
      time: 'Heure',
      court: 'Court',
      footer: 'À bientôt sur le court!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous avez un match programmé pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Seien Sie nicht zu spät - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Seien Sie nicht zu spät, Spielzeit!',
      matchInfo: 'Ihr Spiel beginnt bald:',
      tournament: 'Turnier',
      date: 'Datum',
      time: 'Uhrzeit',
      court: 'Platz',
      footer: 'Wir sehen uns auf dem Platz!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie ein Spiel für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Non arrivare in ritardo - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      message: 'Non arrivare in ritardo, è ora di giocare!',
      matchInfo: 'La tua partita inizia presto:',
      tournament: 'Torneo',
      date: 'Data',
      time: 'Ora',
      court: 'Campo',
      footer: 'Ci vediamo in campo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché hai una partita programmata per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `No arribis tard - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'No arribis tard, és hora del joc!',
      matchInfo: 'El teu partit comença aviat:',
      tournament: 'Torneig',
      date: 'Data',
      time: 'Hora',
      court: 'Pista',
      footer: 'Ens veiem a la pista!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè tens un partit programat per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Kom niet te laat - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Kom niet te laat, het is tijd om te spelen!',
      matchInfo: 'Je wedstrijd begint binnenkort:',
      tournament: 'Toernooi',
      date: 'Datum',
      time: 'Tijd',
      court: 'Baan',
      footer: 'Tot ziens op de baan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je een wedstrijd hebt gepland voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Kom ikke for sent - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Kom ikke for sent, det er spilletid!',
      matchInfo: 'Din kamp starter snart:',
      tournament: 'Turnering',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      footer: 'Vi ses på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du har en kamp planlagt til et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Kom inte för sent - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Kom inte för sent, det är matchtid!',
      matchInfo: 'Din match börjar snart:',
      tournament: 'Turnering',
      date: 'Datum',
      time: 'Tid',
      court: 'Bana',
      footer: 'Vi ses på banan!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du har en match schemalagd för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Ikke kom for sent - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      message: 'Ikke kom for sent, det er kamp tid!',
      matchInfo: 'Din kamp starter snart:',
      tournament: 'Turnering',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      footer: 'Vi sees på banen!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du har en kamp planlagt for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `لا تتأخر - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      message: 'لا تتأخر، حان وقت اللعب!',
      matchInfo: 'مباراتك تبدأ قريبًا:',
      tournament: 'البطولة',
      date: 'التاريخ',
      time: 'الوقت',
      court: 'الملعب',
      footer: 'نراك في الملعب!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأن لديك مباراة مجدولة لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `不要迟到 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      message: '不要迟到，比赛时间到了!',
      matchInfo: '您的比赛即将开始:',
      tournament: '锦标赛',
      date: '日期',
      time: '时间',
      court: '球场',
      footer: '球场上见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #92400e; font-size: 16px;">${t.message}</p>
                      </div>
                      
                      <p class="lead" style="margin: 20px 0 12px 0;">${t.matchInfo}</p>
                      
                      <div class="info-box">
                        <div class="detail-row">
                          <div class="detail-label">${t.tournament}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.date}:</div>
                          <div class="detail-value">${matchDate}</div>
                        </div>
                        
                        <div class="detail-row">
                          <div class="detail-label">${t.time}:</div>
                          <div class="detail-value"><strong>${match.time}</strong></div>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.court}:</div>
                          <div class="detail-value">${t.court} ${match.courtNumber}</div>
                        </div>
                      </div>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 19. Change in Schedule / Court Change
export interface ScheduleChangeEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  match: {
    oldDate?: string;
    oldTime?: string;
    oldCourt?: number;
    newDate: string;
    newTime: string;
    newCourt: number;
  };
  reason?: string;
  locale?: string;
}

export function getScheduleChangeEmailTemplate(data: ScheduleChangeEmailData): string {
  const { firstName, lastName, tournament, match, reason, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const { formatLocalizedDate } = require('@/lib/localization-utils');
  const oldDate = match.oldDate ? formatLocalizedDate(match.oldDate, locale) : null;
  const newDate = formatLocalizedDate(match.newDate, locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Schedule change - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      message: 'Important: There has been a change in your match schedule.',
      tournament: 'Tournament',
      oldSchedule: 'Previous Schedule',
      newSchedule: 'New Schedule',
      date: 'Date',
      time: 'Time',
      court: 'Court',
      reason: 'Reason',
      footer: 'We apologize for any inconvenience.',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because there was a schedule change for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Изменение расписания - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      message: 'Важно: Произошло изменение в расписании вашего матча.',
      tournament: 'Турнир',
      oldSchedule: 'Предыдущее расписание',
      newSchedule: 'Новое расписание',
      date: 'Дата',
      time: 'Время',
      court: 'Корт',
      reason: 'Причина',
      footer: 'Приносим извинения за неудобства.',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что произошло изменение расписания для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Зміна розкладу - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      message: 'Важливо: Сталася зміна у вашому розкладі матчу.',
      tournament: 'Турнір',
      oldSchedule: 'Попередній розклад',
      newSchedule: 'Новий розклад',
      date: 'Дата',
      time: 'Час',
      court: 'Корт',
      reason: 'Причина',
      footer: 'Вибачте за незручності.',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що сталася зміна розкладу для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Cambio de horario - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Importante: Ha habido un cambio en el calendario de tu partido.',
      tournament: 'Torneo',
      oldSchedule: 'Horario Anterior',
      newSchedule: 'Nuevo Horario',
      date: 'Fecha',
      time: 'Hora',
      court: 'Cancha',
      reason: 'Razón',
      footer: 'Disculpe las molestias.',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque hubo un cambio de horario para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Changement d'horaire - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      message: 'Important: Il y a eu un changement dans le calendrier de votre match.',
      tournament: 'Tournoi',
      oldSchedule: 'Horaire Précédent',
      newSchedule: 'Nouvel Horaire',
      date: 'Date',
      time: 'Heure',
      court: 'Court',
      reason: 'Raison',
      footer: 'Nous nous excusons pour le désagrément.',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'il y a eu un changement d\'horaire pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Terminänderung - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Wichtig: Es gab eine Änderung in Ihrem Spielplan.',
      tournament: 'Turnier',
      oldSchedule: 'Vorheriger Termin',
      newSchedule: 'Neuer Termin',
      date: 'Datum',
      time: 'Uhrzeit',
      court: 'Platz',
      reason: 'Grund',
      footer: 'Wir entschuldigen uns für die Unannehmlichkeiten.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil es eine Terminänderung für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Cambio di programma - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      message: 'Importante: C\'è stato un cambiamento nel calendario della tua partita.',
      tournament: 'Torneo',
      oldSchedule: 'Programma Precedente',
      newSchedule: 'Nuovo Programma',
      date: 'Data',
      time: 'Ora',
      court: 'Campo',
      reason: 'Motivo',
      footer: 'Ci scusiamo per l\'inconveniente.',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché c\'è stato un cambio di programma per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Canvi d'horari - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Important: Hi ha hagut un canvi en el calendari del teu partit.',
      tournament: 'Torneig',
      oldSchedule: 'Horari Anterior',
      newSchedule: 'Nou Horari',
      date: 'Data',
      time: 'Hora',
      court: 'Pista',
      reason: 'Raó',
      footer: 'Disculpeu les molèsties.',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè hi ha hagut un canvi d\'horari per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Schema wijziging - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Belangrijk: Er is een wijziging in je wedstrijdschema.',
      tournament: 'Toernooi',
      oldSchedule: 'Vorige Schema',
      newSchedule: 'Nieuw Schema',
      date: 'Datum',
      time: 'Tijd',
      court: 'Baan',
      reason: 'Reden',
      footer: 'Onze excuses voor het ongemak.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat er een schema wijziging was voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Tidsplanændring - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Vigtigt: Der er sket en ændring i din kampkalender.',
      tournament: 'Turnering',
      oldSchedule: 'Tidligere Tidsplan',
      newSchedule: 'Ny Tidsplan',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      reason: 'Årsag',
      footer: 'Vi undskylder ulejligheden.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi der var en tidsplanændring for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Schemaändring - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Viktigt: Det har skett en ändring i din matchkalender.',
      tournament: 'Turnering',
      oldSchedule: 'Tidigare Schema',
      newSchedule: 'Nytt Schema',
      date: 'Datum',
      time: 'Tid',
      court: 'Bana',
      reason: 'Anledning',
      footer: 'Vi ber om ursäkt för besväret.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom det var en schemaändring för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Tidsplanendring - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      message: 'Viktig: Det har skjedd en endring i din kampkalender.',
      tournament: 'Turnering',
      oldSchedule: 'Tidligere Tidsplan',
      newSchedule: 'Ny Tidsplan',
      date: 'Dato',
      time: 'Tid',
      court: 'Bane',
      reason: 'Årsak',
      footer: 'Vi beklager uleiligheten.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi det var en tidsplanendring for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `تغيير الجدول - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      message: 'مهم: كان هناك تغيير في جدول مباراتك.',
      tournament: 'البطولة',
      oldSchedule: 'الجدول السابق',
      newSchedule: 'الجدول الجديد',
      date: 'التاريخ',
      time: 'الوقت',
      court: 'الملعب',
      reason: 'السبب',
      footer: 'نعتذر عن الإزعاج.',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه كان هناك تغيير في الجدول لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `日程变更 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      message: '重要提示: 您的比赛日程已更改。',
      tournament: '锦标赛',
      oldSchedule: '原日程',
      newSchedule: '新日程',
      date: '日期',
      time: '时间',
      court: '球场',
      reason: '原因',
      footer: '对于给您带来的不便，我们深表歉意。',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #92400e; font-size: 14px;">${t.message}</p>
                      </div>
                      
                      ${oldDate ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.oldSchedule}</p>
                        <div class="detail-row">
                          <div class="detail-label">${t.date}:</div>
                          <div class="detail-value">${oldDate}</div>
                        </div>
                        ${match.oldTime ? `
                        <div class="detail-row">
                          <div class="detail-label">${t.time}:</div>
                          <div class="detail-value">${match.oldTime}</div>
                        </div>
                        ` : ''}
                        ${match.oldCourt ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.court}:</div>
                          <div class="detail-value">${t.court} ${match.oldCourt}</div>
                        </div>
                        ` : ''}
                      </div>
                      ` : ''}
                      
                      <div class="info-box" style="margin-top: ${oldDate ? '10px' : '20px'}; background: #d1fae5; border-left-color: #10b981;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.newSchedule}</p>
                        <div class="detail-row">
                          <div class="detail-label">${t.tournament}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        <div class="detail-row">
                          <div class="detail-label">${t.date}:</div>
                          <div class="detail-value"><strong>${newDate}</strong></div>
                        </div>
                        <div class="detail-row">
                          <div class="detail-label">${t.time}:</div>
                          <div class="detail-value"><strong>${match.newTime}</strong></div>
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.court}:</div>
                          <div class="detail-value"><strong>${t.court} ${match.newCourt}</strong></div>
                        </div>
                      </div>
                      
                      ${reason ? `
                      <div class="info-box" style="margin-top: 10px;">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e; font-size: 13px;">${t.reason}:</p>
                        <p class="muted" style="margin: 0; color: #1f2937; font-size: 13px;">${reason}</p>
                      </div>
                      ` : ''}
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 20. Group Stage Results / Qualification Results
export interface GroupStageResultsEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  resultsUrl: string;
  nextStage?: string;
  qualified?: boolean;
  locale?: string;
}

export function getGroupStageResultsEmailTemplate(data: GroupStageResultsEmailData): string {
  const { firstName, lastName, tournament, resultsUrl, nextStage, qualified, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Group stage results - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      message: 'The group stage results are now available!',
      qualified: 'Congratulations! You have qualified for the next stage.',
      notQualified: 'Thank you for participating in the tournament.',
      nextStage: 'Next Stage',
      viewResults: 'View Results',
      footer: 'Thank you for being part of PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because the results were published for a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Результаты группового этапа - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      message: 'Результаты группового этапа теперь доступны!',
      qualified: 'Поздравляем! Вы прошли в следующий этап.',
      notQualified: 'Спасибо за участие в турнире.',
      nextStage: 'Следующий этап',
      viewResults: 'Посмотреть результаты',
      footer: 'Спасибо, что вы часть PadelO₂!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что результаты были опубликованы для турнира на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Результати групового етапу - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      message: 'Результати групового етапу тепер доступні!',
      qualified: 'Вітаємо! Ви пройшли до наступного етапу.',
      notQualified: 'Дякуємо за участь у турнірі.',
      nextStage: 'Наступний етап',
      viewResults: 'Переглянути результати',
      footer: 'Дякуємо, що ви частина PadelO₂!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що результати було опубліковано для турніру на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Resultados de la fase de grupos - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: '¡Los resultados de la fase de grupos ya están disponibles!',
      qualified: '¡Felicidades! Has clasificado para la siguiente fase.',
      notQualified: 'Gracias por participar en el torneo.',
      nextStage: 'Siguiente Fase',
      viewResults: 'Ver Resultados',
      footer: '¡Gracias por ser parte de PadelO₂!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se publicaron los resultados para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Résultats de la phase de groupes - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      message: 'Les résultats de la phase de groupes sont maintenant disponibles!',
      qualified: 'Félicitations! Vous avez qualifié pour la prochaine phase.',
      notQualified: 'Merci d\'avoir participé au tournoi.',
      nextStage: 'Phase Suivante',
      viewResults: 'Voir les Résultats',
      footer: 'Merci de faire partie de PadelO₂!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que les résultats ont été publiés pour un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Gruppenphasen-Ergebnisse - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Die Gruppenphasen-Ergebnisse sind jetzt verfügbar!',
      qualified: 'Herzlichen Glückwunsch! Sie haben sich für die nächste Phase qualifiziert.',
      notQualified: 'Vielen Dank für Ihre Teilnahme am Turnier.',
      nextStage: 'Nächste Phase',
      viewResults: 'Ergebnisse Anzeigen',
      footer: 'Vielen Dank, dass Sie Teil von PadelO₂ sind!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil die Ergebnisse für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Risultati della fase a gironi - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      message: 'I risultati della fase a gironi sono ora disponibili!',
      qualified: 'Congratulazioni! Ti sei qualificato per la fase successiva.',
      notQualified: 'Grazie per aver partecipato al torneo.',
      nextStage: 'Fase Successiva',
      viewResults: 'Visualizza Risultati',
      footer: 'Grazie per far parte di PadelO₂!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché i risultati sono stati pubblicati per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Resultats de la fase de grups - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Els resultats de la fase de grups ja estan disponibles!',
      qualified: 'Felicitats! Has classificat per a la següent fase.',
      notQualified: 'Gràcies per participar en el torneig.',
      nextStage: 'Fase Següent',
      viewResults: 'Veure Resultats',
      footer: 'Gràcies per ser part de PadelO₂!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè es van publicar els resultats per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Groepsfase resultaten - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'De groepsfase resultaten zijn nu beschikbaar!',
      qualified: 'Gefeliciteerd! Je bent gekwalificeerd voor de volgende fase.',
      notQualified: 'Bedankt voor je deelname aan het toernooi.',
      nextStage: 'Volgende Fase',
      viewResults: 'Bekijk Resultaten',
      footer: 'Bedankt dat je deel uitmaakt van PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat de resultaten zijn gepubliceerd voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Gruppespil resultater - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Gruppespil resultaterne er nu tilgængelige!',
      qualified: 'Tillykke! Du har kvalificeret dig til næste fase.',
      notQualified: 'Tak for din deltagelse i turneringen.',
      nextStage: 'Næste Fase',
      viewResults: 'Se Resultater',
      footer: 'Tak for at være en del af PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi resultaterne blev offentliggjort for et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Gruppspelsresultat - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Gruppspelsresultaten är nu tillgängliga!',
      qualified: 'Grattis! Du har kvalificerat dig för nästa fas.',
      notQualified: 'Tack för din deltagande i turneringen.',
      nextStage: 'Nästa Fas',
      viewResults: 'Visa Resultat',
      footer: 'Tack för att du är en del av PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom resultaten publicerades för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Gruppespill resultater - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      message: 'Gruppespill resultatene er nå tilgjengelige!',
      qualified: 'Gratulerer! Du har kvalifisert deg til neste fase.',
      notQualified: 'Takk for din deltakelse i turneringen.',
      nextStage: 'Neste Fase',
      viewResults: 'Se Resultater',
      footer: 'Takk for at du er en del av PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi resultatene ble publisert for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `نتائج مرحلة المجموعات - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      message: 'نتائج مرحلة المجموعات متاحة الآن!',
      qualified: 'تهانينا! لقد تأهلت للمرحلة التالية.',
      notQualified: 'شكرًا لك على المشاركة في البطولة.',
      nextStage: 'المرحلة التالية',
      viewResults: 'عرض النتائج',
      footer: 'شكرًا لكونك جزءًا من PadelO₂!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم نشر النتائج لبطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `小组赛结果 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      message: '小组赛结果现已公布!',
      qualified: '恭喜！您已晋级下一阶段。',
      notQualified: '感谢您参加锦标赛。',
      nextStage: '下一阶段',
      viewResults: '查看结果',
      footer: '感谢您成为 PadelO₂ 的一部分!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      
                      ${qualified ? `
                      <div class="success-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.qualified}</p>
                        ${nextStage ? `<p class="muted" style="margin: 8px 0 0 0; color: #065f46; font-size: 13px;">${t.nextStage}: ${nextStage}</p>` : ''}
                      </div>
                      ` : `
                      <div class="info-box">
                        <p class="muted" style="margin: 0; color: #0c4a6e; font-size: 14px;">${t.notQualified}</p>
                      </div>
                      `}
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${resultsUrl}" class="btn-primary">${t.viewResults}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 21. Finals & Winners - Congrats / Tournament Results
export interface FinalsWinnersEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  position?: number;
  prize?: string;
  resultsUrl: string;
  finalStandings?: Array<{ position: number; team: string; prize?: string }>;
  locale?: string;
}

export function getFinalsWinnersEmailTemplate(data: FinalsWinnersEmailData): string {
  const { firstName, lastName, tournament, position, prize, resultsUrl, finalStandings, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const isWinner = position !== undefined && position <= 3;

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: position ? `Congratulations! You finished ${position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : position + 'th'} - ${tournament.name} - PadelO₂` : `Tournament results - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      congratulations: position === 1 ? '🏆 Congratulations! You won!' : position === 2 ? '🥈 Congratulations! You finished 2nd!' : position === 3 ? '🥉 Congratulations! You finished 3rd!' : position ? `Congratulations! You finished ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} place!` : 'Tournament Results',
      message: position ? 'Thank you for participating in' : 'The tournament results are now available.',
      tournament: 'Tournament',
      position: 'Position',
      prize: 'Prize',
      finalStandings: 'Final Standings',
      viewResults: 'View Full Results',
      footer: 'Thank you for being part of PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because the tournament results were published on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: position ? `Поздравляем! Вы заняли ${position === 1 ? '1-е' : position === 2 ? '2-е' : position === 3 ? '3-е' : position + '-е'} место - ${tournament.name} - PadelO₂` : `Результаты турнира - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      congratulations: position === 1 ? '🏆 Поздравляем! Вы победили!' : position === 2 ? '🥈 Поздравляем! Вы заняли 2-е место!' : position === 3 ? '🥉 Поздравляем! Вы заняли 3-е место!' : position ? `Поздравляем! Вы заняли ${position}${position === 1 ? '-е' : position === 2 ? '-е' : position === 3 ? '-е' : '-е'} место!` : 'Результаты турнира',
      message: position ? 'Спасибо за участие в' : 'Результаты турнира теперь доступны.',
      tournament: 'Турнир',
      position: 'Место',
      prize: 'Приз',
      finalStandings: 'Финальная таблица',
      viewResults: 'Посмотреть все результаты',
      footer: 'Спасибо, что вы часть PadelO₂!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что результаты турнира были опубликованы на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: position ? `Вітаємо! Ви зайняли ${position === 1 ? '1-е' : position === 2 ? '2-е' : position === 3 ? '3-є' : position + '-е'} місце - ${tournament.name} - PadelO₂` : `Результати турніру - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      congratulations: position === 1 ? '🏆 Вітаємо! Ви перемогли!' : position === 2 ? '🥈 Вітаємо! Ви зайняли 2-е місце!' : position === 3 ? '🥉 Вітаємо! Ви зайняли 3-є місце!' : position ? `Вітаємо! Ви зайняли ${position}${position === 1 ? '-е' : position === 2 ? '-е' : position === 3 ? '-є' : '-е'} місце!` : 'Результати турніру',
      message: position ? 'Дякуємо за участь у' : 'Результати турніру тепер доступні.',
      tournament: 'Турнір',
      position: 'Місце',
      prize: 'Приз',
      finalStandings: 'Фінальна таблиця',
      viewResults: 'Переглянути всі результати',
      footer: 'Дякуємо, що ви частина PadelO₂!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що результати турніру було опубліковано на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: position ? `¡Felicidades! Terminaste en ${position === 1 ? '1er' : position === 2 ? '2do' : position === 3 ? '3er' : position + 'º'} lugar - ${tournament.name} - PadelO₂` : `Resultados del torneo - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      congratulations: position === 1 ? '🏆 ¡Felicidades! ¡Ganaste!' : position === 2 ? '🥈 ¡Felicidades! Terminaste en 2do lugar!' : position === 3 ? '🥉 ¡Felicidades! Terminaste en 3er lugar!' : position ? `¡Felicidades! Terminaste en ${position}${position === 1 ? 'er' : position === 2 ? 'do' : position === 3 ? 'er' : 'º'} lugar!` : 'Resultados del Torneo',
      message: position ? 'Gracias por participar en' : 'Los resultados del torneo ya están disponibles.',
      tournament: 'Torneo',
      position: 'Posición',
      prize: 'Premio',
      finalStandings: 'Clasificación Final',
      viewResults: 'Ver Todos los Resultados',
      footer: '¡Gracias por ser parte de PadelO₂!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se publicaron los resultados del torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: position ? `Félicitations! Vous avez terminé ${position === 1 ? '1er' : position === 2 ? '2e' : position === 3 ? '3e' : position + 'e'} - ${tournament.name} - PadelO₂` : `Résultats du tournoi - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      congratulations: position === 1 ? '🏆 Félicitations! Vous avez gagné!' : position === 2 ? '🥈 Félicitations! Vous avez terminé 2e!' : position === 3 ? '🥉 Félicitations! Vous avez terminé 3e!' : position ? `Félicitations! Vous avez terminé ${position}${position === 1 ? 'er' : position === 2 ? 'e' : position === 3 ? 'e' : 'e'} place!` : 'Résultats du Tournoi',
      message: position ? 'Merci d\'avoir participé à' : 'Les résultats du tournoi sont maintenant disponibles.',
      tournament: 'Tournoi',
      position: 'Position',
      prize: 'Prix',
      finalStandings: 'Classement Final',
      viewResults: 'Voir Tous les Résultats',
      footer: 'Merci de faire partie de PadelO₂!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que les résultats du tournoi ont été publiés sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: position ? `Herzlichen Glückwunsch! Sie haben den ${position === 1 ? '1.' : position === 2 ? '2.' : position === 3 ? '3.' : position + '.'} Platz belegt - ${tournament.name} - PadelO₂` : `Turnierergebnisse - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      congratulations: position === 1 ? '🏆 Herzlichen Glückwunsch! Sie haben gewonnen!' : position === 2 ? '🥈 Herzlichen Glückwunsch! Sie haben den 2. Platz belegt!' : position === 3 ? '🥉 Herzlichen Glückwunsch! Sie haben den 3. Platz belegt!' : position ? `Herzlichen Glückwunsch! Sie haben den ${position}. Platz belegt!` : 'Turnierergebnisse',
      message: position ? 'Vielen Dank für Ihre Teilnahme an' : 'Die Turnierergebnisse sind jetzt verfügbar.',
      tournament: 'Turnier',
      position: 'Platz',
      prize: 'Preis',
      finalStandings: 'Endstand',
      viewResults: 'Alle Ergebnisse Anzeigen',
      footer: 'Vielen Dank, dass Sie Teil von PadelO₂ sind!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil die Turnierergebnisse auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: position ? `Congratulazioni! Hai finito ${position === 1 ? '1°' : position === 2 ? '2°' : position === 3 ? '3°' : position + '°'} - ${tournament.name} - PadelO₂` : `Risultati del torneo - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      congratulations: position === 1 ? '🏆 Congratulazioni! Hai vinto!' : position === 2 ? '🥈 Congratulazioni! Hai finito 2°!' : position === 3 ? '🥉 Congratulazioni! Hai finito 3°!' : position ? `Congratulazioni! Hai finito ${position}° posto!` : 'Risultati del Torneo',
      message: position ? 'Grazie per aver partecipato a' : 'I risultati del torneo sono ora disponibili.',
      tournament: 'Torneo',
      position: 'Posizione',
      prize: 'Premio',
      finalStandings: 'Classifica Finale',
      viewResults: 'Visualizza Tutti i Risultati',
      footer: 'Grazie per far parte di PadelO₂!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché i risultati del torneo sono stati pubblicati su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: position ? `Felicitats! Has acabat en ${position === 1 ? '1r' : position === 2 ? '2n' : position === 3 ? '3r' : position + 'è'} lloc - ${tournament.name} - PadelO₂` : `Resultats del torneig - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      congratulations: position === 1 ? '🏆 Felicitats! Has guanyat!' : position === 2 ? '🥈 Felicitats! Has acabat en 2n lloc!' : position === 3 ? '🥉 Felicitats! Has acabat en 3r lloc!' : position ? `Felicitats! Has acabat en ${position}${position === 1 ? 'r' : position === 2 ? 'n' : position === 3 ? 'r' : 'è'} lloc!` : 'Resultats del Torneig',
      message: position ? 'Gràcies per participar en' : 'Els resultats del torneig ja estan disponibles.',
      tournament: 'Torneig',
      position: 'Posició',
      prize: 'Premi',
      finalStandings: 'Classificació Final',
      viewResults: 'Veure Tots els Resultats',
      footer: 'Gràcies per ser part de PadelO₂!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè es van publicar els resultats del torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: position ? `Gefeliciteerd! Je eindigde op ${position === 1 ? '1e' : position === 2 ? '2e' : position === 3 ? '3e' : position + 'e'} plaats - ${tournament.name} - PadelO₂` : `Toernooi resultaten - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      congratulations: position === 1 ? '🏆 Gefeliciteerd! Je hebt gewonnen!' : position === 2 ? '🥈 Gefeliciteerd! Je eindigde op 2e plaats!' : position === 3 ? '🥉 Gefeliciteerd! Je eindigde op 3e plaats!' : position ? `Gefeliciteerd! Je eindigde op ${position}e plaats!` : 'Toernooi Resultaten',
      message: position ? 'Bedankt voor je deelname aan' : 'De toernooi resultaten zijn nu beschikbaar.',
      tournament: 'Toernooi',
      position: 'Positie',
      prize: 'Prijs',
      finalStandings: 'Eindstand',
      viewResults: 'Bekijk Alle Resultaten',
      footer: 'Bedankt dat je deel uitmaakt van PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat de toernooi resultaten zijn gepubliceerd op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: position ? `Tillykke! Du endte på ${position === 1 ? '1.' : position === 2 ? '2.' : position === 3 ? '3.' : position + '.'} plads - ${tournament.name} - PadelO₂` : `Turneringsresultater - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      congratulations: position === 1 ? '🏆 Tillykke! Du vandt!' : position === 2 ? '🥈 Tillykke! Du endte på 2. plads!' : position === 3 ? '🥉 Tillykke! Du endte på 3. plads!' : position ? `Tillykke! Du endte på ${position}. plads!` : 'Turneringsresultater',
      message: position ? 'Tak for din deltagelse i' : 'Turneringsresultaterne er nu tilgængelige.',
      tournament: 'Turnering',
      position: 'Plads',
      prize: 'Præmie',
      finalStandings: 'Endelig Stilling',
      viewResults: 'Se Alle Resultater',
      footer: 'Tak for at være en del af PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi turneringsresultaterne blev offentliggjort på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: position ? `Grattis! Du slutade på ${position === 1 ? '1:a' : position === 2 ? '2:a' : position === 3 ? '3:e' : position + ':e'} plats - ${tournament.name} - PadelO₂` : `Turneringsresultat - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      congratulations: position === 1 ? '🏆 Grattis! Du vann!' : position === 2 ? '🥈 Grattis! Du slutade på 2:a plats!' : position === 3 ? '🥉 Grattis! Du slutade på 3:e plats!' : position ? `Grattis! Du slutade på ${position}${position === 1 ? ':a' : position === 2 ? ':a' : position === 3 ? ':e' : ':e'} plats!` : 'Turneringsresultat',
      message: position ? 'Tack för din deltagande i' : 'Turneringsresultaten är nu tillgängliga.',
      tournament: 'Turnering',
      position: 'Plats',
      prize: 'Pris',
      finalStandings: 'Slutställning',
      viewResults: 'Visa Alla Resultat',
      footer: 'Tack för att du är en del av PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom turneringsresultaten publicerades på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: position ? `Gratulerer! Du endte på ${position === 1 ? '1.' : position === 2 ? '2.' : position === 3 ? '3.' : position + '.'} plass - ${tournament.name} - PadelO₂` : `Turneringsresultater - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      congratulations: position === 1 ? '🏆 Gratulerer! Du vant!' : position === 2 ? '🥈 Gratulerer! Du endte på 2. plass!' : position === 3 ? '🥉 Gratulerer! Du endte på 3. plass!' : position ? `Gratulerer! Du endte på ${position}. plass!` : 'Turneringsresultater',
      message: position ? 'Takk for din deltakelse i' : 'Turneringsresultatene er nå tilgjengelige.',
      tournament: 'Turnering',
      position: 'Plass',
      prize: 'Premie',
      finalStandings: 'Endelig Stilling',
      viewResults: 'Se Alle Resultater',
      footer: 'Takk for at du er en del av PadelO₂!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi turneringsresultatene ble publisert på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: position ? `تهانينا! أنهيت في المركز ${position === 1 ? 'الأول' : position === 2 ? 'الثاني' : position === 3 ? 'الثالث' : position} - ${tournament.name} - PadelO₂` : `نتائج البطولة - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      congratulations: position === 1 ? '🏆 تهانينا! لقد فزت!' : position === 2 ? '🥈 تهانينا! أنهيت في المركز الثاني!' : position === 3 ? '🥉 تهانينا! أنهيت في المركز الثالث!' : position ? `تهانينا! أنهيت في المركز ${position}!` : 'نتائج البطولة',
      message: position ? 'شكرًا لك على المشاركة في' : 'نتائج البطولة متاحة الآن.',
      tournament: 'البطولة',
      position: 'المركز',
      prize: 'الجائزة',
      finalStandings: 'الترتيب النهائي',
      viewResults: 'عرض جميع النتائج',
      footer: 'شكرًا لكونك جزءًا من PadelO₂!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم نشر نتائج البطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: position ? `恭喜！您获得了第${position}名 - ${tournament.name} - PadelO₂` : `锦标赛结果 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      congratulations: position === 1 ? '🏆 恭喜！您获胜了!' : position === 2 ? '🥈 恭喜！您获得了第二名!' : position === 3 ? '🥉 恭喜！您获得了第三名!' : position ? `恭喜！您获得了第${position}名!` : '锦标赛结果',
      message: position ? '感谢您参加' : '锦标赛结果现已公布。',
      tournament: '锦标赛',
      position: '名次',
      prize: '奖品',
      finalStandings: '最终排名',
      viewResults: '查看所有结果',
      footer: '感谢您成为 PadelO₂ 的一部分!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      
                      ${isWinner ? `
                      <div class="success-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #065f46; font-size: 18px;">${t.congratulations}</p>
                      </div>
                      ` : ''}
                      
                      <p class="lead" style="margin: ${isWinner ? '20px' : '0'} 0 12px 0;">${t.message} <strong>${tournament.name}</strong>${position ? '!' : '.'}</p>
                      
                      ${position !== undefined ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <div class="detail-row">
                          <div class="detail-label">${t.tournament}:</div>
                          <div class="detail-value">${tournament.name}</div>
                        </div>
                        <div class="detail-row">
                          <div class="detail-label">${t.position}:</div>
                          <div class="detail-value"><strong>${position}${position === 1 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'er' : locale === 'fr' ? 'er' : locale === 'it' ? '°' : locale === 'ca' ? 'r' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':a' : '') : position === 2 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'do' : locale === 'fr' ? 'e' : locale === 'it' ? '°' : locale === 'ca' ? 'n' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':a' : '') : position === 3 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'er' : locale === 'fr' ? 'e' : locale === 'it' ? '°' : locale === 'ca' ? 'r' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':e' : '') : ''}</strong></div>
                        </div>
                        ${prize ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">${t.prize}:</div>
                          <div class="detail-value"><strong>${prize}</strong></div>
                        </div>
                        ` : ''}
                      </div>
                      ` : ''}
                      
                      ${finalStandings && finalStandings.length > 0 ? `
                      <div class="info-box" style="margin-top: ${position !== undefined ? '10px' : '20px'};">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.finalStandings}</p>
                        ${finalStandings.slice(0, 5).map((standing, idx) => `
                        <div class="detail-row" style="${idx === finalStandings.slice(0, 5).length - 1 ? 'border-bottom: none;' : ''}">
                          <div class="detail-label">${standing.position}${standing.position === 1 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'er' : locale === 'fr' ? 'er' : locale === 'it' ? '°' : locale === 'ca' ? 'r' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':a' : '') : standing.position === 2 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'do' : locale === 'fr' ? 'e' : locale === 'it' ? '°' : locale === 'ca' ? 'n' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':a' : '') : standing.position === 3 ? (locale === 'ru' || locale === 'ua' ? '-е' : locale === 'es' ? 'er' : locale === 'fr' ? 'e' : locale === 'it' ? '°' : locale === 'ca' ? 'r' : locale === 'nl' ? 'e' : locale === 'da' || locale === 'no' ? '.' : locale === 'sv' ? ':e' : '') : ''}:</div>
                          <div class="detail-value">${standing.team}${standing.prize ? ` - ${standing.prize}` : ''}</div>
                        </div>
                        `).join('')}
                      </div>
                      ` : ''}
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${resultsUrl}" class="btn-primary">${t.viewResults}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 22. Post-Tournament Recap & Photos
export interface PostTournamentRecapEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  mediaUrl: string;
  recap?: string;
  nextEventUrl?: string;
  locale?: string;
}

export function getPostTournamentRecapEmailTemplate(data: PostTournamentRecapEmailData): string {
  const { firstName, lastName, tournament, mediaUrl, recap, nextEventUrl, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const { formatLocalizedDate } = require('@/lib/localization-utils');
  const startDate = formatLocalizedDate(tournament.startDate, locale);
  const endDate = formatLocalizedDate(tournament.endDate, locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Tournament recap & photos - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      thankYou: 'Thank you for participating in',
      recap: 'Tournament Recap',
      message: 'We hope you enjoyed the tournament! Check out the photos and videos from the event.',
      viewMedia: 'View Photos & Videos',
      followUs: 'Follow Us',
      registerNext: 'Register for Next Event',
      footer: 'See you at the next tournament!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you participated in a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Итоги турнира и фото - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за участие в',
      recap: 'Итоги турнира',
      message: 'Мы надеемся, что вам понравился турнир! Посмотрите фото и видео с мероприятия.',
      viewMedia: 'Посмотреть фото и видео',
      followUs: 'Подписаться',
      registerNext: 'Зарегистрироваться на следующее событие',
      footer: 'Увидимся на следующем турнире!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что участвовали в турнире на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Підсумки турніру та фото - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за участь у',
      recap: 'Підсумки турніру',
      message: 'Ми сподіваємося, що вам сподобався турнір! Перегляньте фото та відео з події.',
      viewMedia: 'Переглянути фото та відео',
      followUs: 'Підписатися',
      registerNext: 'Зареєструватися на наступну подію',
      footer: 'Побачимося на наступному турнірі!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що брали участь у турнірі на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Resumen del torneo y fotos - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      thankYou: 'Gracias por participar en',
      recap: 'Resumen del Torneo',
      message: '¡Esperamos que hayas disfrutado del torneo! Echa un vistazo a las fotos y videos del evento.',
      viewMedia: 'Ver Fotos y Videos',
      followUs: 'Síguenos',
      registerNext: 'Registrarse para el Próximo Evento',
      footer: '¡Nos vemos en el próximo torneo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque participaste en un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Récapitulatif du tournoi et photos - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      thankYou: 'Merci d\'avoir participé à',
      recap: 'Récapitulatif du Tournoi',
      message: 'Nous espérons que vous avez apprécié le tournoi! Découvrez les photos et vidéos de l\'événement.',
      viewMedia: 'Voir les Photos et Vidéos',
      followUs: 'Suivez-nous',
      registerNext: 'S\'inscrire au Prochain Événement',
      footer: 'À bientôt au prochain tournoi!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous avez participé à un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Turnier-Zusammenfassung und Fotos - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Teilnahme an',
      recap: 'Turnier-Zusammenfassung',
      message: 'Wir hoffen, Sie haben das Turnier genossen! Schauen Sie sich die Fotos und Videos der Veranstaltung an.',
      viewMedia: 'Fotos und Videos Anzeigen',
      followUs: 'Folgen Sie uns',
      registerNext: 'Für Nächstes Event Registrieren',
      footer: 'Wir sehen uns beim nächsten Turnier!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie an einem Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Riepilogo del torneo e foto - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      thankYou: 'Grazie per aver partecipato a',
      recap: 'Riepilogo del Torneo',
      message: 'Speriamo che tu abbia apprezzato il torneo! Dai un\'occhiata alle foto e ai video dell\'evento.',
      viewMedia: 'Visualizza Foto e Video',
      followUs: 'Seguici',
      registerNext: 'Registrati per il Prossimo Evento',
      footer: 'Ci vediamo al prossimo torneo!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché hai partecipato a un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Resum del torneig i fotos - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      thankYou: 'Gràcies per participar en',
      recap: 'Resum del Torneig',
      message: 'Esperem que hagis gaudit del torneig! Fes una ullada a les fotos i vídeos de l\'esdeveniment.',
      viewMedia: 'Veure Fotos i Vídeos',
      followUs: 'Segueix-nos',
      registerNext: 'Registrar-se per al Pròxim Esdeveniment',
      footer: 'Ens veiem al proper torneig!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè vas participar en un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Toernooi samenvatting en foto's - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      thankYou: 'Bedankt voor je deelname aan',
      recap: 'Toernooi Samenvatting',
      message: 'We hopen dat je van het toernooi hebt genoten! Bekijk de foto\'s en video\'s van het evenement.',
      viewMedia: 'Bekijk Foto\'s en Video\'s',
      followUs: 'Volg Ons',
      registerNext: 'Registreer voor Volgende Evenement',
      footer: 'Tot ziens bij het volgende toernooi!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je hebt deelgenomen aan een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Turneringsopsummering og billeder - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      thankYou: 'Tak for din deltagelse i',
      recap: 'Turneringsopsummering',
      message: 'Vi håber, du nød turneringen! Tjek billederne og videoerne fra begivenheden.',
      viewMedia: 'Se Billeder og Videoer',
      followUs: 'Følg Os',
      registerNext: 'Tilmeld Dig Næste Begivenhed',
      footer: 'Vi ses til næste turnering!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du deltog i et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Turneringssammanfattning och foton - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      thankYou: 'Tack för din deltagande i',
      recap: 'Turneringssammanfattning',
      message: 'Vi hoppas att du gillade turneringen! Kolla in foton och videor från evenemanget.',
      viewMedia: 'Visa Foton och Videor',
      followUs: 'Följ Oss',
      registerNext: 'Registrera Dig för Nästa Evenemang',
      footer: 'Vi ses på nästa turnering!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du deltog i en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Turneringssammendrag og bilder - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      thankYou: 'Takk for din deltakelse i',
      recap: 'Turneringssammendrag',
      message: 'Vi håper du likte turneringen! Sjekk ut bildene og videoene fra arrangementet.',
      viewMedia: 'Se Bilder og Videoer',
      followUs: 'Følg Oss',
      registerNext: 'Registrer Deg for Neste Arrangement',
      footer: 'Vi sees på neste turnering!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du deltok i en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `ملخص البطولة والصور - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      thankYou: 'شكرًا لك على المشاركة في',
      recap: 'ملخص البطولة',
      message: 'نأمل أن تكون قد استمتعت بالبطولة! تحقق من الصور ومقاطع الفيديو من الحدث.',
      viewMedia: 'عرض الصور ومقاطع الفيديو',
      followUs: 'تابعنا',
      registerNext: 'التسجيل للحدث القادم',
      footer: 'نراك في البطولة القادمة!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك شاركت في بطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `锦标赛总结和照片 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      thankYou: '感谢您参加',
      recap: '锦标赛总结',
      message: '我们希望您喜欢这次锦标赛！查看活动中的照片和视频。',
      viewMedia: '查看照片和视频',
      followUs: '关注我们',
      registerNext: '注册下一个活动',
      footer: '下一场锦标赛见!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您参加了在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .btn-secondary { background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 999px; font-size: 14px; font-weight: 600; color: #ffffff !important; padding: 11px 30px; display: inline-block; box-shadow: 0 10px 26px rgba(245, 158, 11, 0.35); margin-left: 10px; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
        .btn-secondary { margin-left: 0; margin-top: 10px; display: block; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.thankYou} <strong>${tournament.name}</strong>!</p>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      
                      ${recap ? `
                      <div class="info-box" style="margin-top: 20px;">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.recap}</p>
                        <p class="muted" style="margin: 0; color: #1f2937; font-size: 13px; line-height: 1.6;">${recap}</p>
                      </div>
                      ` : ''}
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${mediaUrl}" class="btn-primary">${t.viewMedia}</a>
                            ${nextEventUrl ? `<a href="${nextEventUrl}" class="btn-secondary">${t.registerNext}</a>` : ''}
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 23. Tournament Feedback / NPS
export interface TournamentFeedbackEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
  };
  feedbackUrl: string;
  locale?: string;
}

export function getTournamentFeedbackEmailTemplate(data: TournamentFeedbackEmailData): string {
  const { firstName, lastName, tournament, feedbackUrl, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Share your feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      message: 'We would love to hear your thoughts about',
      feedbackRequest: 'Please take a moment to share your feedback about the tournament organization, venue, and format.',
      provideFeedback: 'Provide Feedback',
      footer: 'Your opinion matters to us!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you participated in a tournament on',
      followJourney: 'Follow the journey:',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Поделитесь своим мнением - ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      message: 'Мы хотели бы услышать ваше мнение о',
      feedbackRequest: 'Пожалуйста, уделите немного времени, чтобы поделиться своим мнением об организации турнира, площадке и формате.',
      provideFeedback: 'Оставить отзыв',
      footer: 'Ваше мнение важно для нас!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что участвовали в турнире на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Поділіться своєю думкою - ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      message: 'Ми хотіли б почути вашу думку про',
      feedbackRequest: 'Будь ласка, знайдіть хвилину, щоб поділитися своєю думкою про організацію турніру, майданчик та формат.',
      provideFeedback: 'Залишити відгук',
      footer: 'Ваша думка важлива для нас!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що брали участь у турнірі на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Comparte tu opinión - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Nos encantaría escuchar tus comentarios sobre',
      feedbackRequest: 'Por favor, tómate un momento para compartir tus comentarios sobre la organización del torneo, el lugar y el formato.',
      provideFeedback: 'Proporcionar Comentarios',
      footer: '¡Tu opinión es importante para nosotros!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque participaste en un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Partagez vos commentaires - ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      message: 'Nous aimerions connaître votre avis sur',
      feedbackRequest: 'Veuillez prendre un moment pour partager vos commentaires sur l\'organisation du tournoi, le lieu et le format.',
      provideFeedback: 'Fournir des Commentaires',
      footer: 'Votre avis compte pour nous!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous avez participé à un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Teilen Sie Ihr Feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Wir würden gerne Ihre Meinung zu',
      feedbackRequest: 'Bitte nehmen Sie sich einen Moment Zeit, um Ihr Feedback zur Turnierorganisation, dem Veranstaltungsort und dem Format zu teilen.',
      provideFeedback: 'Feedback Geben',
      footer: 'Ihre Meinung ist uns wichtig!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie an einem Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Condividi il tuo feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      message: 'Ci piacerebbe sentire la tua opinione su',
      feedbackRequest: 'Per favore, prenditi un momento per condividere il tuo feedback sull\'organizzazione del torneo, la sede e il formato.',
      provideFeedback: 'Fornire Feedback',
      footer: 'La tua opinione è importante per noi!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché hai partecipato a un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Comparteix el teu feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Ens encantaria escoltar la teva opinió sobre',
      feedbackRequest: 'Si us plau, pren-te un moment per compartir el teu feedback sobre l\'organització del torneig, el lloc i el format.',
      provideFeedback: 'Proporcionar Feedback',
      footer: 'La teva opinió és important per a nosaltres!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè vas participar en un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Deel je feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'We horen graag je mening over',
      feedbackRequest: 'Neem even de tijd om je feedback te delen over de toernooiorganisatie, locatie en formaat.',
      provideFeedback: 'Feedback Geven',
      footer: 'Jouw mening is belangrijk voor ons!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je hebt deelgenomen aan een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Del din feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Vi vil gerne høre dine tanker om',
      feedbackRequest: 'Tag venligst et øjeblik til at dele din feedback om turneringsorganisationen, stedet og formatet.',
      provideFeedback: 'Giv Feedback',
      footer: 'Din mening betyder noget for os!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du deltog i et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Dela din feedback - ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Vi skulle gärna vilja höra dina tankar om',
      feedbackRequest: 'Ta en stund att dela din feedback om turneringsorganisationen, platsen och formatet.',
      provideFeedback: 'Ge Feedback',
      footer: 'Din åsikt betyder något för oss!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du deltog i en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Del din tilbakemelding - ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      message: 'Vi vil gjerne høre dine tanker om',
      feedbackRequest: 'Ta deg et øyeblikk til å dele din tilbakemelding om turneringsorganisasjonen, stedet og formatet.',
      provideFeedback: 'Gi Tilbakemelding',
      footer: 'Din mening betyr noe for oss!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du deltok i en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `شارك ملاحظاتك - ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      message: 'نود أن نسمع رأيك حول',
      feedbackRequest: 'يرجى قضاء لحظة لمشاركة ملاحظاتك حول تنظيم البطولة والمكان والتنسيق.',
      provideFeedback: 'تقديم الملاحظات',
      footer: 'رأيك مهم بالنسبة لنا!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك شاركت في بطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `分享您的反馈 - ${tournament.name} - PadelO₂`,
      greeting: '您好',
      message: '我们很想听听您对',
      feedbackRequest: '请花一点时间分享您对锦标赛组织、场地和格式的反馈。',
      provideFeedback: '提供反馈',
      footer: '您的意见对我们很重要!',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您参加了在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: #06b6d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #ffffff; padding: 11px 30px; display: inline-block; text-decoration: none; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong>.</p>
                      
                      <div class="info-box">
                        <p class="muted" style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.6;">${t.feedbackRequest}</p>
                      </div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${feedbackUrl}" class="btn-primary">${t.provideFeedback}</a>
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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

// 24. Tournament Cancelled / Postponed
export interface TournamentCancelledEmailData {
  firstName?: string;
  lastName?: string;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  reason: string;
  refundInfo?: string;
  newDates?: {
    startDate?: string;
    endDate?: string;
  };
  options?: string;
  locale?: string;
}

export function getTournamentCancelledEmailTemplate(data: TournamentCancelledEmailData): string {
  const { firstName, lastName, tournament, reason, refundInfo, newDates, options, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Participant';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const { formatLocalizedDate } = require('@/lib/localization-utils');
  const newStartDate = newDates?.startDate ? formatLocalizedDate(newDates.startDate, locale) : null;
  const newEndDate = newDates?.endDate ? formatLocalizedDate(newDates.endDate, locale) : null;

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: `Important: Tournament ${tournament.name} - PadelO₂`,
      greeting: 'Hello',
      message: 'We regret to inform you that',
      hasBeenCancelled: 'has been cancelled',
      hasBeenPostponed: 'has been postponed',
      reason: 'Reason',
      refundInfo: 'Refund Information',
      newDates: 'New Dates',
      options: 'Options',
      footer: 'We apologize for any inconvenience.',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you registered for a tournament on',
      followJourney: 'Follow the journey:',
      unsubscribe: 'Unsubscribe',
      welcomeToCourt: 'Welcome to the court'
    },
    ru: {
      subject: `Важно: Турнир ${tournament.name} - PadelO₂`,
      greeting: 'Здравствуйте',
      message: 'К сожалению, мы должны сообщить вам, что',
      hasBeenCancelled: 'был отменен',
      hasBeenPostponed: 'был перенесен',
      reason: 'Причина',
      refundInfo: 'Информация о возврате',
      newDates: 'Новые даты',
      options: 'Варианты',
      footer: 'Приносим извинения за неудобства.',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на турнир на',
      followJourney: 'Следите за путешествием:',
      welcomeToCourt: 'Добро пожаловать на корт'
    },
    ua: {
      subject: `Важливо: Турнір ${tournament.name} - PadelO₂`,
      greeting: 'Вітаємо',
      message: 'На жаль, ми повинні повідомити вам, що',
      hasBeenCancelled: 'було скасовано',
      hasBeenPostponed: 'було перенесено',
      reason: 'Причина',
      refundInfo: 'Інформація про повернення',
      newDates: 'Нові дати',
      options: 'Варіанти',
      footer: 'Вибачте за незручності.',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на турнір на',
      followJourney: 'Слідкуйте за подорожжю:',
      welcomeToCourt: 'Ласкаво просимо на корт'
    },
    es: {
      subject: `Importante: Torneo ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Lamentamos informarle que',
      hasBeenCancelled: 'ha sido cancelado',
      hasBeenPostponed: 'ha sido pospuesto',
      reason: 'Razón',
      refundInfo: 'Información de Reembolso',
      newDates: 'Nuevas Fechas',
      options: 'Opciones',
      footer: 'Nos disculpamos por las molestias.',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque te registraste para un torneo en',
      followJourney: 'Sigue el viaje:',
      welcomeToCourt: 'Bienvenido a la cancha'
    },
    fr: {
      subject: `Important: Tournoi ${tournament.name} - PadelO₂`,
      greeting: 'Bonjour',
      message: 'Nous regrettons de vous informer que',
      hasBeenCancelled: 'a été annulé',
      hasBeenPostponed: 'a été reporté',
      reason: 'Raison',
      refundInfo: 'Informations de Remboursement',
      newDates: 'Nouvelles Dates',
      options: 'Options',
      footer: 'Nous nous excusons pour le désagrément.',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit à un tournoi sur',
      followJourney: 'Suivez le voyage:',
      welcomeToCourt: 'Bienvenue sur le court'
    },
    de: {
      subject: `Wichtig: Turnier ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Wir bedauern, Ihnen mitteilen zu müssen, dass',
      hasBeenCancelled: 'abgesagt wurde',
      hasBeenPostponed: 'verschoben wurde',
      reason: 'Grund',
      refundInfo: 'Rückerstattungsinformationen',
      newDates: 'Neue Termine',
      options: 'Optionen',
      footer: 'Wir entschuldigen uns für die Unannehmlichkeiten.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich für ein Turnier auf',
      followJourney: 'Folgen Sie der Reise:',
      welcomeToCourt: 'Willkommen auf dem Platz'
    },
    it: {
      subject: `Importante: Torneo ${tournament.name} - PadelO₂`,
      greeting: 'Ciao',
      message: 'Ci dispiace informarti che',
      hasBeenCancelled: 'è stato cancellato',
      hasBeenPostponed: 'è stato rinviato',
      reason: 'Motivo',
      refundInfo: 'Informazioni sul Rimborso',
      newDates: 'Nuove Date',
      options: 'Opzioni',
      footer: 'Ci scusiamo per l\'inconveniente.',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato per un torneo su',
      followJourney: 'Segui il viaggio:',
      welcomeToCourt: 'Benvenuto in campo'
    },
    ca: {
      subject: `Important: Torneig ${tournament.name} - PadelO₂`,
      greeting: 'Hola',
      message: 'Lamentem informar-te que',
      hasBeenCancelled: 'ha estat cancel·lat',
      hasBeenPostponed: 'ha estat ajornat',
      reason: 'Raó',
      refundInfo: 'Informació de Reemborsament',
      newDates: 'Noves Dates',
      options: 'Opcions',
      footer: 'Ens disculpem per les molèsties.',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar per a un torneig a',
      followJourney: 'Segueix el viatge:',
      welcomeToCourt: 'Benvingut a la pista'
    },
    nl: {
      subject: `Belangrijk: Toernooi ${tournament.name} - PadelO₂`,
      greeting: 'Hallo',
      message: 'Het spijt ons u te moeten informeren dat',
      hasBeenCancelled: 'is geannuleerd',
      hasBeenPostponed: 'is uitgesteld',
      reason: 'Reden',
      refundInfo: 'Terugbetalingsinformatie',
      newDates: 'Nieuwe Data',
      options: 'Opties',
      footer: 'Onze excuses voor het ongemak.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je je hebt geregistreerd voor een toernooi op',
      followJourney: 'Volg de reis:',
      welcomeToCourt: 'Welkom op de baan'
    },
    da: {
      subject: `Vigtigt: Turnering ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Vi beklager at informere dig om, at',
      hasBeenCancelled: 'er blevet annulleret',
      hasBeenPostponed: 'er blevet udskudt',
      reason: 'Årsag',
      refundInfo: 'Refusionsinformation',
      newDates: 'Nye Datoer',
      options: 'Muligheder',
      footer: 'Vi undskylder ulejligheden.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig et turnering på',
      followJourney: 'Følg rejsen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    sv: {
      subject: `Viktigt: Turnering ${tournament.name} - PadelO₂`,
      greeting: 'Hej',
      message: 'Vi beklagar att informera dig om att',
      hasBeenCancelled: 'har blivit inställd',
      hasBeenPostponed: 'har blivit uppskjuten',
      reason: 'Anledning',
      refundInfo: 'Återbetalningsinformation',
      newDates: 'Nya Datum',
      options: 'Alternativ',
      footer: 'Vi ber om ursäkt för besväret.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig för en turnering på',
      followJourney: 'Följ resan:',
      welcomeToCourt: 'Välkommen till banan'
    },
    no: {
      subject: `Viktig: Turnering ${tournament.name} - PadelO₂`,
      greeting: 'Hei',
      message: 'Vi beklager å informere deg om at',
      hasBeenCancelled: 'er blitt avlyst',
      hasBeenPostponed: 'er blitt utsatt',
      reason: 'Årsak',
      refundInfo: 'Refusjonsinformasjon',
      newDates: 'Nye Datoer',
      options: 'Alternativer',
      footer: 'Vi beklager uleiligheten.',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg for en turnering på',
      followJourney: 'Følg reisen:',
      welcomeToCourt: 'Velkommen til banen'
    },
    ar: {
      subject: `مهم: بطولة ${tournament.name} - PadelO₂`,
      greeting: 'مرحبا',
      message: 'نأسف لإبلاغك بأن',
      hasBeenCancelled: 'تم إلغاؤها',
      hasBeenPostponed: 'تم تأجيلها',
      reason: 'السبب',
      refundInfo: 'معلومات الاسترداد',
      newDates: 'تواريخ جديدة',
      options: 'خيارات',
      footer: 'نعتذر عن الإزعاج.',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت في بطولة على',
      followJourney: 'تابع الرحلة:',
      welcomeToCourt: 'مرحبًا بك في الملعب'
    },
    zh: {
      subject: `重要: 锦标赛 ${tournament.name} - PadelO₂`,
      greeting: '您好',
      message: '我们很遗憾地通知您，',
      hasBeenCancelled: '已取消',
      hasBeenPostponed: '已推迟',
      reason: '原因',
      refundInfo: '退款信息',
      newDates: '新日期',
      options: '选项',
      footer: '对于给您带来的不便，我们深表歉意。',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:',
      welcomeToCourt: '欢迎来到球场'
    }
  };

  const t = translations[locale] || translations.en;
  const isPostponed = newDates && (newDates.startDate || newDates.endDate);

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Убраны стили для темного режима - они могут вызывать проблемы с доставляемостью */
      /* Email клиенты часто не поддерживают @media queries и помечают такие письма как спам */
      body { 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc;
      }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
      .detail-label { font-weight: 600; color: #0c4a6e; font-size: 13px; }
      .detail-value { color: #1f2937; font-size: 14px; margin-top: 4px; }
      .hide-mobile { display: table-cell; }
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
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="background-color:#f8fafc;">
          <table role="presentation" class="main" style="background-color:#ffffff;">
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-header.png" alt="PadelO₂" style="height: 40px; width: auto; margin-bottom: 8px; display: block;" />
                      <div style="font-weight: 600; font-size: 22px; color: #0f172a; letter-spacing: 0.05em;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.1em;">
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.welcomeToCourt || (locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court')}</span>
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
                    <td style="height: 3px; background: #06b6d4;"></td>
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
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${tournament.name}</strong> ${isPostponed ? t.hasBeenPostponed : t.hasBeenCancelled}.</p>
                      
                      <div class="error-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b; font-size: 14px;">${t.reason}:</p>
                        <p class="muted" style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.6;">${reason}</p>
                      </div>
                      
                      ${newStartDate || newEndDate ? `
                      <div class="info-box" style="margin-top: 20px; background: #d1fae5; border-left-color: #10b981;">
                        <p class="muted" style="margin: 0 0 12px 0; font-weight: 600; color: #065f46; font-size: 14px;">${t.newDates}</p>
                        ${newStartDate ? `
                        <div class="detail-row">
                          <div class="detail-label">${newEndDate ? 'Start Date' : 'Date'}:</div>
                          <div class="detail-value"><strong>${newStartDate}</strong></div>
                        </div>
                        ` : ''}
                        ${newEndDate ? `
                        <div class="detail-row" style="border-bottom: none;">
                          <div class="detail-label">End Date:</div>
                          <div class="detail-value"><strong>${newEndDate}</strong></div>
                        </div>
                        ` : ''}
                      </div>
                      ` : ''}
                      
                      ${refundInfo ? `
                      <div class="info-box" style="margin-top: ${newStartDate || newEndDate ? '10px' : '20px'};">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.refundInfo}:</p>
                        <p class="muted" style="margin: 0; color: #1f2937; font-size: 13px; line-height: 1.6;">${refundInfo}</p>
                      </div>
                      ` : ''}
                      
                      ${options ? `
                      <div class="info-box" style="margin-top: ${refundInfo ? '10px' : (newStartDate || newEndDate ? '10px' : '20px')};">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e; font-size: 14px;">${t.options}:</p>
                        <p class="muted" style="margin: 0; color: #1f2937; font-size: 13px; line-height: 1.6;">${options}</p>
                      </div>
                      ` : ''}
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
                      <p class="muted" style="margin: 0 0 8px 0;">
                        <a href="${siteUrl}/${locale}/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${t.unsubscribe || 'Unsubscribe'}</a>
                      </p>
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
