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
      accountCreated: 'Account created',
      welcome: 'Hi',
      welcomeTo: 'welcome to',
      joinedCommunity: 'You\'ve just joined a global community of players, coaches, and clubs who live and breathe padel. Before your first match reminder lands in your inbox, please confirm your email.',
      unlockFeatures: 'One click and you\'ll unlock smart training sessions, tournament updates, and curated padel content tailored for you.',
      confirmButton: 'Confirm email',
      ifButtonDoesntWork: 'If the button doesn\'t work, paste this link into your browser:',
      welcomeToCourt: 'Welcome to the court',
      smartTraining: 'Smart training',
      smartTrainingDesc: 'AI-ready drills, ball-machine routines, and progressive sessions.',
      tournaments: 'Tournaments',
      tournamentsDesc: 'Stay in the loop about UA Padel Open and new local events.',
      ecosystem: 'PadelO₂ ecosystem',
      ecosystemDesc: 'Courts, coaches, rentals, and content — all in one hub.',
      followJourney: 'Follow the journey:',
      receivingEmail: 'You\'re receiving this email because you signed up on',
      unsubscribe: 'Unsubscribe',
      footer: 'See you at the tournament!',
      team: 'PadelO₂ Team'
    },
    ru: {
      subject: 'Подтвердите регистрацию',
      greeting: 'Здравствуйте',
      thankYou: 'Спасибо за регистрацию',
      thankYouFor: 'Спасибо за регистрацию на',
      accountCreated: 'Аккаунт создан',
      welcome: 'Привет',
      welcomeTo: 'добро пожаловать на',
      joinedCommunity: 'Вы только что присоединились к глобальному сообществу игроков, тренеров и клубов, которые живут и дышат паделом. Прежде чем первое напоминание о матче попадет в ваш почтовый ящик, пожалуйста, подтвердите вашу электронную почту.',
      unlockFeatures: 'Один клик, и вы получите доступ к умным тренировкам, обновлениям турниров и кураторскому контенту о паделе, подобранному специально для вас.',
      confirmButton: 'Подтвердить email',
      ifButtonDoesntWork: 'Если кнопка не работает, вставьте эту ссылку в браузер:',
      welcomeToCourt: 'Добро пожаловать на корт',
      smartTraining: 'Умные тренировки',
      smartTrainingDesc: 'Тренировки с ИИ, упражнения с машиной для мячей и прогрессивные сессии.',
      tournaments: 'Турниры',
      tournamentsDesc: 'Будьте в курсе UA Padel Open и новых местных событий.',
      ecosystem: 'Экосистема PadelO₂',
      ecosystemDesc: 'Корты, тренеры, аренда и контент — все в одном месте.',
      followJourney: 'Следите за путешествием:',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на',
      unsubscribe: 'Отписаться',
      footer: 'Увидимся на турнире!',
      team: 'Команда PadelO₂'
    },
    ua: {
      subject: 'Підтвердіть реєстрацію',
      greeting: 'Вітаємо',
      thankYou: 'Дякуємо за реєстрацію',
      thankYouFor: 'Дякуємо за реєстрацію на',
      accountCreated: 'Акаунт створено',
      welcome: 'Привіт',
      welcomeTo: 'ласкаво просимо на',
      joinedCommunity: 'Ви щойно приєдналися до глобальної спільноти гравців, тренерів та клубів, які живуть і дихають паделом. Перш ніж перше нагадування про матч потрапить до вашої поштової скриньки, будь ласка, підтвердіть вашу електронну пошту.',
      unlockFeatures: 'Один клік, і ви отримаєте доступ до розумних тренувань, оновлень турнірів та кураторського контенту про падел, підібраного спеціально для вас.',
      confirmButton: 'Підтвердити email',
      ifButtonDoesntWork: 'Якщо кнопка не працює, вставте це посилання в браузер:',
      welcomeToCourt: 'Ласкаво просимо на корт',
      smartTraining: 'Розумні тренування',
      smartTrainingDesc: 'Тренування з ШІ, вправи з машиною для м\'ячів та прогресивні сесії.',
      tournaments: 'Турніри',
      tournamentsDesc: 'Будьте в курсі UA Padel Open та нових місцевих подій.',
      ecosystem: 'Екосистема PadelO₂',
      ecosystemDesc: 'Корти, тренери, оренда та контент — все в одному місці.',
      followJourney: 'Слідкуйте за подорожжю:',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на',
      unsubscribe: 'Відписатися',
      footer: 'Побачимося на турнірі!',
      team: 'Команда PadelO₂'
    },
    es: {
      subject: 'Confirma tu registro',
      greeting: 'Hola',
      thankYou: 'Gracias por registrarte',
      thankYouFor: 'Gracias por registrarte para',
      accountCreated: 'Cuenta creada',
      welcome: 'Hola',
      welcomeTo: 'bienvenido a',
      joinedCommunity: 'Acabas de unirte a una comunidad global de jugadores, entrenadores y clubes que viven y respiran padel. Antes de que tu primer recordatorio de partido llegue a tu bandeja de entrada, por favor confirma tu correo electrónico.',
      unlockFeatures: 'Un clic y desbloquearás sesiones de entrenamiento inteligente, actualizaciones de torneos y contenido de padel curado adaptado para ti.',
      confirmButton: 'Confirmar email',
      ifButtonDoesntWork: 'Si el botón no funciona, pega este enlace en tu navegador:',
      welcomeToCourt: 'Bienvenido a la cancha',
      smartTraining: 'Entrenamiento inteligente',
      smartTrainingDesc: 'Ejercicios listos para IA, rutinas con máquina de pelotas y sesiones progresivas.',
      tournaments: 'Torneos',
      tournamentsDesc: 'Mantente al día sobre UA Padel Open y nuevos eventos locales.',
      ecosystem: 'Ecosistema PadelO₂',
      ecosystemDesc: 'Canchas, entrenadores, alquileres y contenido — todo en un solo lugar.',
      followJourney: 'Sigue el viaje:',
      receivingEmail: 'Estás recibiendo este correo porque te registraste en',
      unsubscribe: 'Cancelar suscripción',
      footer: '¡Nos vemos en el torneo!',
      team: 'Equipo PadelO₂'
    },
    fr: {
      subject: 'Confirmez votre inscription',
      greeting: 'Bonjour',
      thankYou: 'Merci de vous être inscrit',
      thankYouFor: 'Merci de vous être inscrit pour',
      accountCreated: 'Compte créé',
      welcome: 'Salut',
      welcomeTo: 'bienvenue sur',
      joinedCommunity: 'Vous venez de rejoindre une communauté mondiale de joueurs, entraîneurs et clubs qui vivent et respirent le padel. Avant que votre premier rappel de match n\'arrive dans votre boîte de réception, veuillez confirmer votre adresse e-mail.',
      unlockFeatures: 'Un clic et vous débloquerez des sessions d\'entraînement intelligentes, des mises à jour de tournois et du contenu de padel personnalisé adapté pour vous.',
      confirmButton: 'Confirmer l\'email',
      ifButtonDoesntWork: 'Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur:',
      welcomeToCourt: 'Bienvenue sur le court',
      smartTraining: 'Entraînement intelligent',
      smartTrainingDesc: 'Exercices prêts pour l\'IA, routines avec machine à balles et sessions progressives.',
      tournaments: 'Tournois',
      tournamentsDesc: 'Restez informé sur UA Padel Open et les nouveaux événements locaux.',
      ecosystem: 'Écosystème PadelO₂',
      ecosystemDesc: 'Courts, entraîneurs, locations et contenu — tout en un seul endroit.',
      followJourney: 'Suivez le voyage:',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit sur',
      unsubscribe: 'Se désabonner',
      footer: 'À bientôt au tournoi!',
      team: 'Équipe PadelO₂'
    },
    de: {
      subject: 'Bestätigen Sie Ihre Anmeldung',
      greeting: 'Hallo',
      thankYou: 'Vielen Dank für Ihre Anmeldung',
      thankYouFor: 'Vielen Dank für Ihre Anmeldung für',
      accountCreated: 'Konto erstellt',
      welcome: 'Hallo',
      welcomeTo: 'willkommen bei',
      joinedCommunity: 'Sie sind gerade einer globalen Gemeinschaft von Spielern, Trainern und Clubs beigetreten, die Padel leben und atmen. Bevor Ihre erste Spielerinnerung in Ihrem Postfach landet, bestätigen Sie bitte Ihre E-Mail-Adresse.',
      unlockFeatures: 'Ein Klick und Sie erhalten Zugang zu intelligenten Trainingseinheiten, Turnier-Updates und kuratierten Padel-Inhalten, die auf Sie zugeschnitten sind.',
      confirmButton: 'E-Mail bestätigen',
      ifButtonDoesntWork: 'Wenn die Schaltfläche nicht funktioniert, fügen Sie diesen Link in Ihren Browser ein:',
      welcomeToCourt: 'Willkommen auf dem Platz',
      smartTraining: 'Intelligentes Training',
      smartTrainingDesc: 'KI-bereite Übungen, Ballmaschinen-Routinen und progressive Sitzungen.',
      tournaments: 'Turniere',
      tournamentsDesc: 'Bleiben Sie auf dem Laufenden über UA Padel Open und neue lokale Veranstaltungen.',
      ecosystem: 'PadelO₂ Ökosystem',
      ecosystemDesc: 'Plätze, Trainer, Vermietungen und Inhalte — alles an einem Ort.',
      followJourney: 'Folgen Sie der Reise:',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich auf',
      unsubscribe: 'Abmelden',
      footer: 'Wir sehen uns beim Turnier!',
      team: 'PadelO₂ Team'
    },
    it: {
      subject: 'Conferma la tua registrazione',
      greeting: 'Ciao',
      thankYou: 'Grazie per esserti registrato',
      thankYouFor: 'Grazie per esserti registrato per',
      accountCreated: 'Account creato',
      welcome: 'Ciao',
      welcomeTo: 'benvenuto su',
      joinedCommunity: 'Ti sei appena unito a una comunità globale di giocatori, allenatori e club che vivono e respirano padel. Prima che il tuo primo promemoria di partita arrivi nella tua casella di posta, conferma la tua email.',
      unlockFeatures: 'Un clic e sbloccherai sessioni di allenamento intelligenti, aggiornamenti sui tornei e contenuti di padel curati su misura per te.',
      confirmButton: 'Conferma email',
      ifButtonDoesntWork: 'Se il pulsante non funziona, incolla questo link nel tuo browser:',
      welcomeToCourt: 'Benvenuto in campo',
      smartTraining: 'Allenamento intelligente',
      smartTrainingDesc: 'Esercizi pronti per l\'IA, routine con macchina per palline e sessioni progressive.',
      tournaments: 'Tornei',
      tournamentsDesc: 'Resta aggiornato su UA Padel Open e nuovi eventi locali.',
      ecosystem: 'Ecosistema PadelO₂',
      ecosystemDesc: 'Campi, allenatori, noleggi e contenuti — tutto in un unico posto.',
      followJourney: 'Segui il viaggio:',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato su',
      unsubscribe: 'Annulla iscrizione',
      footer: 'Ci vediamo al torneo!',
      team: 'Team PadelO₂'
    },
    ca: {
      subject: 'Confirma el teu registre',
      greeting: 'Hola',
      thankYou: 'Gràcies per registrar-te',
      thankYouFor: 'Gràcies per registrar-te per a',
      accountCreated: 'Compte creat',
      welcome: 'Hola',
      welcomeTo: 'benvingut a',
      joinedCommunity: 'Acabes d\'unir-te a una comunitat global de jugadors, entrenadors i clubs que viuen i respiren padel. Abans que el teu primer recordatori de partit arribi a la teva safata d\'entrada, si us plau confirma el teu correu electrònic.',
      unlockFeatures: 'Un clic i desbloquejaràs sessions d\'entrenament intel·ligents, actualitzacions de torneigs i contingut de padel comissariat adaptat per a tu.',
      confirmButton: 'Confirmar email',
      ifButtonDoesntWork: 'Si el botó no funciona, enganxa aquest enllaç al teu navegador:',
      welcomeToCourt: 'Benvingut a la pista',
      smartTraining: 'Entrenament intel·ligent',
      smartTrainingDesc: 'Exercicis llestos per a IA, rutines amb màquina de pilotes i sessions progressives.',
      tournaments: 'Torneigs',
      tournamentsDesc: 'Mantingues-te al dia sobre UA Padel Open i nous esdeveniments locals.',
      ecosystem: 'Ecosistema PadelO₂',
      ecosystemDesc: 'Pistes, entrenadors, lloguers i contingut — tot en un sol lloc.',
      followJourney: 'Segueix el viatge:',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar a',
      unsubscribe: 'Cancel·lar subscripció',
      footer: 'Ens veiem al torneig!',
      team: 'Equip PadelO₂'
    },
    nl: {
      subject: 'Bevestig uw registratie',
      greeting: 'Hallo',
      thankYou: 'Bedankt voor uw registratie',
      thankYouFor: 'Bedankt voor uw registratie voor',
      accountCreated: 'Account aangemaakt',
      welcome: 'Hallo',
      welcomeTo: 'welkom bij',
      joinedCommunity: 'U bent zojuist lid geworden van een wereldwijde gemeenschap van spelers, coaches en clubs die padel leven en ademen. Voordat uw eerste wedstrijdherinnering in uw inbox landt, bevestigt u alstublieft uw e-mailadres.',
      unlockFeatures: 'Eén klik en u ontgrendelt slimme trainingssessies, toernooi-updates en gecureerde padel-inhoud op maat voor u.',
      confirmButton: 'E-mail bevestigen',
      ifButtonDoesntWork: 'Als de knop niet werkt, plak deze link in uw browser:',
      welcomeToCourt: 'Welkom op de baan',
      smartTraining: 'Slimme training',
      smartTrainingDesc: 'AI-klare oefeningen, ballmachine-routines en progressieve sessies.',
      tournaments: 'Toernooien',
      tournamentsDesc: 'Blijf op de hoogte van UA Padel Open en nieuwe lokale evenementen.',
      ecosystem: 'PadelO₂ ecosysteem',
      ecosystemDesc: 'Banen, coaches, verhuur en inhoud — alles op één plek.',
      followJourney: 'Volg de reis:',
      receivingEmail: 'U ontvangt deze e-mail omdat u zich heeft geregistreerd op',
      unsubscribe: 'Afmelden',
      footer: 'Tot ziens op het toernooi!',
      team: 'PadelO₂ Team'
    },
    da: {
      subject: 'Bekræft din registrering',
      greeting: 'Hej',
      thankYou: 'Tak for din registrering',
      thankYouFor: 'Tak for din registrering til',
      accountCreated: 'Konto oprettet',
      welcome: 'Hej',
      welcomeTo: 'velkommen til',
      joinedCommunity: 'Du har lige tilsluttet dig et globalt fællesskab af spillere, trænere og klubber, der lever og ånder padel. Før din første kamppåmindelse lander i din indbakke, bekræft venligst din e-mail.',
      unlockFeatures: 'Ét klik, og du låser op for smarte træningssessioner, turneringsopdateringer og kurateret padel-indhold skræddersyet til dig.',
      confirmButton: 'Bekræft e-mail',
      ifButtonDoesntWork: 'Hvis knappen ikke virker, indsæt dette link i din browser:',
      welcomeToCourt: 'Velkommen til banen',
      smartTraining: 'Smart træning',
      smartTrainingDesc: 'AI-klare øvelser, boldmaskine-rutiner og progressive sessioner.',
      tournaments: 'Turneringer',
      tournamentsDesc: 'Hold dig opdateret om UA Padel Open og nye lokale begivenheder.',
      ecosystem: 'PadelO₂ økosystem',
      ecosystemDesc: 'Baner, trænere, udlejning og indhold — alt på ét sted.',
      followJourney: 'Følg rejsen:',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig på',
      unsubscribe: 'Afmeld',
      footer: 'Vi ses til turneringen!',
      team: 'PadelO₂ Team'
    },
    sv: {
      subject: 'Bekräfta din registrering',
      greeting: 'Hej',
      thankYou: 'Tack för din registrering',
      thankYouFor: 'Tack för din registrering för',
      accountCreated: 'Konto skapat',
      welcome: 'Hej',
      welcomeTo: 'välkommen till',
      joinedCommunity: 'Du har precis gått med i en global gemenskap av spelare, tränare och klubbar som lever och andas padel. Innan din första matchpåminnelse landar i din inkorg, bekräfta din e-postadress.',
      unlockFeatures: 'Ett klick och du låser upp smarta träningspass, turneringsuppdateringar och kuraterat padel-innehåll skräddarsytt för dig.',
      confirmButton: 'Bekräfta e-post',
      ifButtonDoesntWork: 'Om knappen inte fungerar, klistra in denna länk i din webbläsare:',
      welcomeToCourt: 'Välkommen till banan',
      smartTraining: 'Smart träning',
      smartTrainingDesc: 'AI-redo övningar, bollmaskinrutiner och progressiva sessioner.',
      tournaments: 'Turneringar',
      tournamentsDesc: 'Håll dig uppdaterad om UA Padel Open och nya lokala evenemang.',
      ecosystem: 'PadelO₂ ekosystem',
      ecosystemDesc: 'Banor, tränare, uthyrning och innehåll — allt på ett ställe.',
      followJourney: 'Följ resan:',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig på',
      unsubscribe: 'Avsluta prenumeration',
      footer: 'Vi ses på turneringen!',
      team: 'PadelO₂ Team'
    },
    no: {
      subject: 'Bekreft din registrering',
      greeting: 'Hei',
      thankYou: 'Takk for din registrering',
      thankYouFor: 'Takk for din registrering til',
      accountCreated: 'Konto opprettet',
      welcome: 'Hei',
      welcomeTo: 'velkommen til',
      joinedCommunity: 'Du har nettopp blitt medlem av et globalt samfunn av spillere, trenere og klubber som lever og puster padel. Før din første kamppåminnelse lander i innboksen din, bekreft e-postadressen din.',
      unlockFeatures: 'Ét klikk og du låser opp smarte treningsøkter, turneringsoppdateringer og kuratert padel-innhold skreddersydd for deg.',
      confirmButton: 'Bekreft e-post',
      ifButtonDoesntWork: 'Hvis knappen ikke fungerer, lim inn denne lenken i nettleseren din:',
      welcomeToCourt: 'Velkommen til banen',
      smartTraining: 'Smart trening',
      smartTrainingDesc: 'AI-klare øvelser, ballmaskinrutiner og progressive økter.',
      tournaments: 'Turneringer',
      tournamentsDesc: 'Hold deg oppdatert om UA Padel Open og nye lokale arrangementer.',
      ecosystem: 'PadelO₂ økosystem',
      ecosystemDesc: 'Baner, trenere, utleie og innhold — alt på ett sted.',
      followJourney: 'Følg reisen:',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg på',
      unsubscribe: 'Avslutt abonnement',
      footer: 'Vi sees på turneringen!',
      team: 'PadelO₂ Team'
    },
    ar: {
      subject: 'أكد تسجيلك',
      greeting: 'مرحبا',
      thankYou: 'شكرا لتسجيلك',
      thankYouFor: 'شكرا لتسجيلك في',
      accountCreated: 'تم إنشاء الحساب',
      welcome: 'مرحبا',
      welcomeTo: 'مرحبا بك في',
      joinedCommunity: 'لقد انضممت للتو إلى مجتمع عالمي من اللاعبين والمدربين والأندية الذين يعيشون ويتنفسون البادل. قبل أن تصل تذكير مباراتك الأولى إلى صندوق الوارد الخاص بك، يرجى تأكيد بريدك الإلكتروني.',
      unlockFeatures: 'نقرة واحدة وستفتح جلسات تدريب ذكية وتحديثات البطولة ومحتوى بادل مختار مخصص لك.',
      confirmButton: 'تأكيد البريد الإلكتروني',
      ifButtonDoesntWork: 'إذا لم يعمل الزر، الصق هذا الرابط في متصفحك:',
      welcomeToCourt: 'مرحبا بك في الملعب',
      smartTraining: 'تدريب ذكي',
      smartTrainingDesc: 'تمارين جاهزة للذكاء الاصطناعي وروتينات آلة الكرة وجلسات تدريجية.',
      tournaments: 'البطولات',
      tournamentsDesc: 'ابق على اطلاع حول UA Padel Open والأحداث المحلية الجديدة.',
      ecosystem: 'نظام PadelO₂ البيئي',
      ecosystemDesc: 'الملاعب والمدربون والإيجارات والمحتوى — كل ذلك في مكان واحد.',
      followJourney: 'تابع الرحلة:',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت على',
      unsubscribe: 'إلغاء الاشتراك',
      footer: 'نراكم في البطولة!',
      team: 'فريق PadelO₂'
    },
    zh: {
      subject: '确认您的注册',
      greeting: '您好',
      thankYou: '感谢您的注册',
      thankYouFor: '感谢您注册',
      accountCreated: '账户已创建',
      welcome: '你好',
      welcomeTo: '欢迎来到',
      joinedCommunity: '您刚刚加入了一个由球员、教练和俱乐部组成的全球社区，他们生活和呼吸着帕德尔。在您的第一场比赛提醒到达您的收件箱之前，请确认您的电子邮件。',
      unlockFeatures: '一次点击，您将解锁智能训练课程、锦标赛更新以及为您量身定制的精选帕德尔内容。',
      confirmButton: '确认电子邮件',
      ifButtonDoesntWork: '如果按钮不起作用，请将此链接粘贴到浏览器中:',
      welcomeToCourt: '欢迎来到球场',
      smartTraining: '智能训练',
      smartTrainingDesc: 'AI就绪的练习、发球机例程和渐进式课程。',
      tournaments: '锦标赛',
      tournamentsDesc: '了解UA Padel Open和新的本地活动的最新信息。',
      ecosystem: 'PadelO₂生态系统',
      ecosystemDesc: '球场、教练、租赁和内容 — 一切尽在一处。',
      followJourney: '跟随旅程:',
      receivingEmail: '您收到此电子邮件是因为您在',
      unsubscribe: '取消订阅',
      footer: '锦标赛见！',
      team: 'PadelO₂ 团队'
    }
  };

  const t = translations[locale] || translations.en;
  const firstNameOnly = firstName || name.split(' ')[0] || 'Participant';

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%);
      }
      table {
        border-spacing: 0;
        border-collapse: collapse;
      }
      img {
        border: 0;
        display: block;
        outline: none;
        text-decoration: none;
      }
      a {
        text-decoration: none;
      }
      .wrapper {
        width: 100%;
        padding: 32px 10px;
      }
      .main {
        width: 100%;
        max-width: 640px;
        margin: 0 auto;
        background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        border: 1px solid rgba(148, 163, 184, 0.25);
      }
      .font-default {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
          Arial, sans-serif;
        color: #0f172a;
      }
      .eyebrow {
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-size: 11px;
        color: #0284c7;
      }
      .h1 {
        font-size: 26px;
        line-height: 1.3;
        font-weight: 700;
        color: #0f172a;
      }
      .lead {
        font-size: 15px;
        line-height: 1.7;
        color: #1f2937;
      }
      .muted {
        font-size: 12px;
        line-height: 1.6;
        color: #6b7280;
      }
      .pill-label {
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #0f172a;
      }
      .btn-primary {
        background: linear-gradient(135deg, #06b6d4, #22c55e);
        border-radius: 999px;
        font-size: 14px;
        font-weight: 600;
        color: #ecfdf5 !important;
        padding: 11px 30px;
        display: inline-block;
        box-shadow: 0 10px 26px rgba(8, 145, 178, 0.35);
      }
      .tag {
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        padding: 6px 11px;
        font-size: 11px;
        color: #374151;
        background-color: rgba(255, 255, 255, 0.9);
      }
      .feature-card {
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.4);
        padding: 10px 12px 11px 12px;
      }
      .feature-title {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #111827;
      }
      .feature-text {
        font-size: 12px;
        line-height: 1.5;
        color: #4b5563;
      }
      .social-pill {
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.55);
        padding: 5px 10px 5px 7px;
        font-size: 11px;
        color: #111827;
        background-color: #ffffff;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .social-icon-circle {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: #ffffff;
      }
      .social-ig {
        background-color: #e1306c;
      }
      .social-yt {
        background-color: #ff0000;
      }
      .social-tt {
        background-color: #000000;
      }
      .social-fb {
        background-color: #1877f2;
      }
      @media screen and (max-width: 600px) {
        .stack {
          display: block !important;
          width: 100% !important;
        }
        .p-hero {
          padding: 20px 18px 10px 18px !important;
        }
        .p-body {
          padding: 0 18px 20px 18px !important;
        }
        .p-footer {
          padding: 14px 18px 24px 18px !important;
        }
        .hide-mobile {
          display: none !important;
        }
        .center-mobile {
          text-align: center !important;
        }
      }
    </style>
  </head>

  <body class="font-default">
    <table role="presentation" class="wrapper" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="main">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <div
                        style="
                          font-weight: 800;
                          font-size: 22px;
                          color: #0f172a;
                          letter-spacing: 0.08em;
                          text-transform: uppercase;
                        "
                      >
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div
                        style="
                          font-size: 12px;
                          color: #0369a1;
                          margin-top: 3px;
                          letter-spacing: 0.16em;
                          text-transform: uppercase;
                        "
                      >
                        Breathe &amp; live padel
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table
                        role="presentation"
                        style="
                          border-radius: 999px;
                          background: linear-gradient(135deg, #e0f2fe, #bbf7d0);
                          padding: 1px;
                        "
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            style="
                              background: #ffffff;
                              border-radius: 999px;
                              padding: 6px 18px 7px 18px;
                            "
                          >
                            <span class="pill-label">${t.welcomeToCourt}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER (PADEL LINE) -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td
                      style="
                        height: 3px;
                        background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%);
                        opacity: 0.9;
                      "
                    ></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td class="p-body" style="padding: 20px 30px 10px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default">
                      <div class="eyebrow">${t.accountCreated}</div>
                      <div class="h1" style="margin: 8px 0 10px 0;">
                        ${t.welcome} ${firstNameOnly}, ${t.welcomeTo}&nbsp;PadelO<span style="font-size:1.40em; vertical-align:-1px; line-height:0;">₂</span>.com !
                      </div>
                      <p class="lead" style="margin: 0 0 12px 0;">
                        ${t.thankYouFor || t.thankYou} <strong>${tournamentName}</strong>! ${t.joinedCommunity}
                      </p>
                      <p class="lead" style="margin: 0 0 18px 0;">
                        ${t.unlockFeatures}
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 6px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${confirmationUrl}" class="btn-primary">${t.confirmButton}</a>
                          </td>
                        </tr>
                      </table>

                      <p class="muted" style="margin: 0 0 18px 0;">
                        ${t.ifButtonDoesntWork}<br />
                        <span style="word-break: break-all; color: #0369a1;">${confirmationUrl}</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FEATURES -->
            <tr>
              <td style="padding: 6px 22px 18px 22px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="stack" width="33.33%" valign="top" style="padding: 8px 8px;">
                      <table role="presentation" width="100%">
                        <tr>
                          <td style="padding: 0;">
                            <div class="feature-card">
                              <div class="feature-title">${t.smartTraining}</div>
                              <div class="feature-text">
                                ${t.smartTrainingDesc}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>

                    <td class="stack" width="33.33%" valign="top" style="padding: 8px 8px;">
                      <table role="presentation" width="100%">
                        <tr>
                          <td style="padding: 0;">
                            <div class="feature-card">
                              <div class="feature-title">${t.tournaments}</div>
                              <div class="feature-text">
                                ${t.tournamentsDesc}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>

                    <td class="stack" width="33.33%" valign="top" style="padding: 8px 8px;">
                      <table role="presentation" width="100%">
                        <tr>
                          <td style="padding: 0%;">
                            <div class="feature-card">
                              <div class="feature-title">
                                ${t.ecosystem}
                              </div>
                              <div class="feature-text">
                                ${t.ecosystemDesc}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
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
                            <a href="#" class="social-pill">
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
                    <td style="padding-top: 16px%;">
                      <p class="muted" style="margin: 0 0 4px 0;">
                        ${t.receivingEmail}
                        <span style="color: #0369a1;">padelo2.com</span>.
                      </p>
                      <p class="muted" style="margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} PadelO<span style="font-size:1.4em; vertical-align:-1px; line-height:0;">₂</span>.
                        All rights reserved.
                      </p>
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; font-weight: 600;">
                        ${t.footer}
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        ${t.team}
                      </p>
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

