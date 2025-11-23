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

  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
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
                            <a href="${confirmationUrl}" class="btn-primary" style="text-decoration: none;">${t.confirmButton}</a>
                          </td>
                        </tr>
                      </table>

                      <div class="info-box" style="margin: 20px 0;">
                        <p class="muted" style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #0c4a6e;">
                          ${t.ifButtonDoesntWork}
                        </p>
                        <p class="muted" style="margin: 0; font-size: 12px; word-break: break-all;">
                          <a href="${confirmationUrl}" style="color: #0284c7; text-decoration: underline;">${confirmationUrl}</a>
                        </p>
                        <p class="muted" style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
                          ${locale === 'ru' || locale === 'ua' ? 'Эта ссылка действительна в течение 7 дней. Если вы не регистрировались на турнир, проигнорируйте это письмо.' : locale === 'en' ? 'This link is valid for 7 days. If you did not register for this tournament, please ignore this email.' : 'This link is valid for 7 days. If you did not register for this tournament, please ignore this email.'}
                        </p>
                      </div>
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

// ============================================
// NEW EMAIL TEMPLATES FOR USER ACCOUNT MANAGEMENT
// ============================================

// 1. Welcome Account (без турнира)
export interface WelcomeEmailData {
  firstName?: string;
  lastName?: string;
  locale?: string;
  email?: string;
  temporaryPassword?: string;
}

export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
  const { firstName, lastName, locale = 'en', email, temporaryPassword } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'User';
  const firstNameOnly = firstName || name.split(' ')[0] || 'User';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Welcome to PadelO₂.com',
      greeting: 'Welcome',
      welcomeText: 'Hi',
      welcomeTo: 'welcome to',
      message: 'Your email has been verified successfully! You\'re now part of the PadelO₂ community.',
      description: 'You can now access all features, register for tournaments, track your matches, and connect with other players.',
      accountInfo: 'Your account credentials:',
      loginLabel: 'Email (Login):',
      passwordLabel: 'Password:',
      passwordNote: 'Please save this password. You can change it later in your profile settings.',
      button: 'Go to Dashboard',
      footer: 'Welcome to the court',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you signed up on',
      followJourney: 'Follow the journey:'
    },
    ru: {
      subject: 'Добро пожаловать на PadelO₂.com',
      greeting: 'Добро пожаловать',
      welcomeText: 'Привет',
      welcomeTo: 'добро пожаловать на',
      message: 'Ваш email успешно подтвержден! Теперь вы часть сообщества PadelO₂.',
      description: 'Теперь вы можете получить доступ ко всем функциям, регистрироваться на турниры, отслеживать свои матчи и общаться с другими игроками.',
      accountInfo: 'Данные для входа в аккаунт:',
      loginLabel: 'Email (Логин):',
      passwordLabel: 'Пароль:',
      passwordNote: 'Пожалуйста, сохраните этот пароль. Вы сможете изменить его позже в настройках профиля.',
      button: 'Перейти в Панель',
      footer: 'Добро пожаловать на корт',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что зарегистрировались на',
      followJourney: 'Следите за путешествием:'
    },
    ua: {
      subject: 'Ласкаво просимо на PadelO₂.com',
      greeting: 'Ласкаво просимо',
      welcomeText: 'Привіт',
      welcomeTo: 'ласкаво просимо на',
      message: 'Ваш email успішно підтверджено! Тепер ви частина спільноти PadelO₂.',
      description: 'Тепер ви можете отримати доступ до всіх функцій, реєструватися на турніри, відстежувати свої матчі та спілкуватися з іншими гравцями.',
      accountInfo: 'Дані для входу в акаунт:',
      loginLabel: 'Email (Логін):',
      passwordLabel: 'Пароль:',
      passwordNote: 'Будь ласка, збережіть цей пароль. Ви зможете змінити його пізніше в налаштуваннях профілю.',
      button: 'Перейти до Панелі',
      footer: 'Ласкаво просимо на корт',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що зареєструвалися на',
      followJourney: 'Слідкуйте за подорожжю:'
    },
    es: {
      subject: 'Bienvenido a PadelO₂.com',
      greeting: 'Bienvenido',
      welcomeText: 'Hola',
      welcomeTo: 'bienvenido a',
      message: '¡Tu correo electrónico ha sido verificado con éxito! Ahora eres parte de la comunidad PadelO₂.',
      description: 'Ahora puedes acceder a todas las funciones, registrarte en torneos, seguir tus partidos y conectar con otros jugadores.',
      accountInfo: 'Tus credenciales de cuenta:',
      loginLabel: 'Email (Inicio de sesión):',
      passwordLabel: 'Contraseña:',
      passwordNote: 'Por favor, guarda esta contraseña. Podrás cambiarla más tarde en la configuración de tu perfil.',
      button: 'Ir al Panel',
      footer: 'Bienvenido a la cancha',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque te registraste en',
      followJourney: 'Sigue el viaje:'
    },
    fr: {
      subject: 'Bienvenue sur PadelO₂.com',
      greeting: 'Bienvenue',
      welcomeText: 'Salut',
      welcomeTo: 'bienvenue sur',
      message: 'Votre adresse e-mail a été vérifiée avec succès ! Vous faites maintenant partie de la communauté PadelO₂.',
      description: 'Vous pouvez maintenant accéder à toutes les fonctionnalités, vous inscrire aux tournois, suivre vos matchs et vous connecter avec d\'autres joueurs.',
      accountInfo: 'Vos identifiants de compte:',
      loginLabel: 'Email (Connexion):',
      passwordLabel: 'Mot de passe:',
      passwordNote: 'Veuillez enregistrer ce mot de passe. Vous pourrez le modifier plus tard dans les paramètres de votre profil.',
      button: 'Aller au Tableau de bord',
      footer: 'Bienvenue sur le court',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que vous vous êtes inscrit sur',
      followJourney: 'Suivez le voyage:'
    },
    de: {
      subject: 'Willkommen bei PadelO₂.com',
      greeting: 'Willkommen',
      welcomeText: 'Hallo',
      welcomeTo: 'willkommen bei',
      message: 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt! Sie sind jetzt Teil der PadelO₂-Community.',
      description: 'Sie können jetzt auf alle Funktionen zugreifen, sich für Turniere anmelden, Ihre Spiele verfolgen und sich mit anderen Spielern verbinden.',
      accountInfo: 'Ihre Kontodaten:',
      loginLabel: 'E-Mail (Anmeldung):',
      passwordLabel: 'Passwort:',
      passwordNote: 'Bitte speichern Sie dieses Passwort. Sie können es später in Ihren Profileinstellungen ändern.',
      button: 'Zum Dashboard gehen',
      footer: 'Willkommen auf dem Platz',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Sie sich auf',
      followJourney: 'Folgen Sie der Reise:'
    },
    it: {
      subject: 'Benvenuto su PadelO₂.com',
      greeting: 'Benvenuto',
      welcomeText: 'Ciao',
      welcomeTo: 'benvenuto su',
      message: 'Il tuo indirizzo email è stato verificato con successo! Ora fai parte della comunità PadelO₂.',
      description: 'Ora puoi accedere a tutte le funzionalità, registrarti per i tornei, tracciare le tue partite e connetterti con altri giocatori.',
      accountInfo: 'Le tue credenziali account:',
      loginLabel: 'Email (Accesso):',
      passwordLabel: 'Password:',
      passwordNote: 'Si prega di salvare questa password. Potrai cambiarla successivamente nelle impostazioni del profilo.',
      button: 'Vai alla Dashboard',
      footer: 'Benvenuto in campo',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti sei registrato su',
      followJourney: 'Segui il viaggio:'
    },
    ca: {
      subject: 'Benvingut a PadelO₂.com',
      greeting: 'Benvingut',
      welcomeText: 'Hola',
      welcomeTo: 'benvingut a',
      message: 'El teu correu electrònic ha estat verificat amb èxit! Ara ets part de la comunitat PadelO₂.',
      description: 'Ara pots accedir a totes les funcionalitats, registrar-te per a torneigs, fer un seguiment dels teus partits i connectar-te amb altres jugadors.',
      accountInfo: 'Les teves credencials de compte:',
      loginLabel: 'Email (Inici de sessió):',
      passwordLabel: 'Contrasenya:',
      passwordNote: 'Si us plau, guarda aquesta contrasenya. Podràs canviar-la més tard a la configuració del teu perfil.',
      button: 'Anar al Tauler',
      footer: 'Benvingut a la pista',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè et vas registrar a',
      followJourney: 'Segueix el viatge:'
    },
    nl: {
      subject: 'Welkom bij PadelO₂.com',
      greeting: 'Welkom',
      welcomeText: 'Hallo',
      welcomeTo: 'welkom bij',
      message: 'Uw e-mailadres is succesvol geverifieerd! U maakt nu deel uit van de PadelO₂-community.',
      description: 'U kunt nu toegang krijgen tot alle functies, u aanmelden voor toernooien, uw wedstrijden volgen en contact maken met andere spelers.',
      accountInfo: 'Uw accountgegevens:',
      loginLabel: 'E-mail (Aanmelding):',
      passwordLabel: 'Wachtwoord:',
      passwordNote: 'Sla dit wachtwoord op. U kunt het later wijzigen in uw profielinstellingen.',
      button: 'Ga naar Dashboard',
      footer: 'Welkom op de baan',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat u zich heeft geregistreerd op',
      followJourney: 'Volg de reis:'
    },
    da: {
      subject: 'Velkommen til PadelO₂.com',
      greeting: 'Velkommen',
      welcomeText: 'Hej',
      welcomeTo: 'velkommen til',
      message: 'Din e-mail er blevet bekræftet! Du er nu en del af PadelO₂-fællesskabet.',
      description: 'Du kan nu få adgang til alle funktioner, tilmelde dig turneringer, spore dine kampe og oprette forbindelse med andre spillere.',
      accountInfo: 'Dine kontoplysninger:',
      loginLabel: 'E-mail (Login):',
      passwordLabel: 'Adgangskode:',
      passwordNote: 'Gem venligst denne adgangskode. Du kan ændre den senere i dine profilindstillinger.',
      button: 'Gå til Dashboard',
      footer: 'Velkommen til banen',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du tilmeldte dig på',
      followJourney: 'Følg rejsen:'
    },
    sv: {
      subject: 'Välkommen till PadelO₂.com',
      greeting: 'Välkommen',
      welcomeText: 'Hej',
      welcomeTo: 'välkommen till',
      message: 'Din e-postadress har verifierats! Du är nu en del av PadelO₂-gemenskapen.',
      description: 'Du kan nu komma åt alla funktioner, registrera dig för turneringar, spåra dina matcher och ansluta med andra spelare.',
      accountInfo: 'Dina kontouppgifter:',
      loginLabel: 'E-post (Inloggning):',
      passwordLabel: 'Lösenord:',
      passwordNote: 'Vänligen spara detta lösenord. Du kan ändra det senare i dina profilinställningar.',
      button: 'Gå till Dashboard',
      footer: 'Välkommen till banan',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du registrerade dig på',
      followJourney: 'Följ resan:'
    },
    no: {
      subject: 'Velkommen til PadelO₂.com',
      greeting: 'Velkommen',
      welcomeText: 'Hei',
      welcomeTo: 'velkommen til',
      message: 'Din e-post er bekreftet! Du er nå en del av PadelO₂-fellesskapet.',
      description: 'Du kan nå få tilgang til alle funksjoner, registrere deg for turneringer, spore kampene dine og koble til med andre spillere.',
      accountInfo: 'Dine kontoopplysninger:',
      loginLabel: 'E-post (Innlogging):',
      passwordLabel: 'Passord:',
      passwordNote: 'Vennligst lagre dette passordet. Du kan endre det senere i profilinnstillingene.',
      button: 'Gå til Dashboard',
      footer: 'Velkommen til banen',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du registrerte deg på',
      followJourney: 'Følg reisen:'
    },
    ar: {
      subject: 'مرحبا بك في PadelO₂.com',
      greeting: 'مرحبا بك',
      welcomeText: 'مرحبا',
      welcomeTo: 'مرحبا بك في',
      message: 'تم التحقق من بريدك الإلكتروني بنجاح! أنت الآن جزء من مجتمع PadelO₂.',
      description: 'يمكنك الآن الوصول إلى جميع الميزات والتسجيل في البطولات وتتبع مبارياتك والتواصل مع اللاعبين الآخرين.',
      accountInfo: 'بيانات حسابك:',
      loginLabel: 'البريد الإلكتروني (تسجيل الدخول):',
      passwordLabel: 'كلمة المرور:',
      passwordNote: 'يرجى حفظ كلمة المرور هذه. يمكنك تغييرها لاحقًا في إعدادات ملفك الشخصي.',
      button: 'انتقل إلى لوحة التحكم',
      footer: 'مرحبا بك في الملعب',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنك سجلت على',
      followJourney: 'تابع الرحلة:'
    },
    zh: {
      subject: '欢迎来到 PadelO₂.com',
      greeting: '欢迎',
      welcomeText: '你好',
      welcomeTo: '欢迎来到',
      message: '您的电子邮件已验证成功！您现在已成为 PadelO₂ 社区的一员。',
      description: '您现在可以访问所有功能、注册锦标赛、跟踪您的比赛并与其他玩家联系。',
      accountInfo: '您的账户凭据：',
      loginLabel: '电子邮件（登录）：',
      passwordLabel: '密码：',
      passwordNote: '请保存此密码。您稍后可以在个人资料设置中更改它。',
      button: '前往仪表板',
      footer: '欢迎来到球场',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
      followJourney: '跟随旅程:'
    }
  };

  const t = translations[locale] || translations.en;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const dashboardUrl = `${siteUrl}/${locale}/dashboard`;

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

  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.footer}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
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
                      <div class="eyebrow">${t.greeting}</div>
                      <div class="h1" style="margin: 8px 0 10px 0;">
                        ${t.welcomeText} ${firstNameOnly}, ${t.welcomeTo}&nbsp;PadelO<span style="font-size:1.40em; vertical-align:-1px; line-height:0;">₂</span>.com !
                      </div>
                      <p class="lead" style="margin: 0 0 12px 0;">
                        ${t.message}
                      </p>
                      <p class="lead" style="margin: 0 0 18px 0;">
                        ${t.description}
                      </p>

                      ${temporaryPassword ? `
                      <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <p class="lead" style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e;">
                          ${t.accountInfo}
                        </p>
                        <table role="presentation" width="100%" style="margin: 8px 0;">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #bae6fd;">
                              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">${t.loginLabel}</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Courier New', monospace;">${email || ''}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">${t.passwordLabel}</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 1px;">${temporaryPassword}</p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                          ${t.passwordNote}
                        </p>
                      </div>
                      ` : ''}

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 6px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${dashboardUrl}" class="btn-primary">${t.button}</a>
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
                      <p class="muted" style="margin: 0 0 4px 0;">
                        ${t.receivingEmail}
                        <span style="color: #0369a1;">padelo2.com</span>.
                      </p>
                      <p class="muted" style="margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} PadelO<span style="font-size:1.4em; vertical-align:-1px; line-height:0;">₂</span>.
                        All rights reserved.
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

// 2. Password Reset
export interface PasswordResetEmailData {
  firstName?: string;
  resetUrl: string;
  locale?: string;
  expiresIn?: string;
}

export function getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
  const { firstName, resetUrl, locale = 'en', expiresIn = '1 hour' } = data;
  const firstNameOnly = firstName || 'User';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Reset your password - PadelO₂',
      greeting: 'Hello',
      message: 'We received a request to reset your password. Click the button below to create a new password:',
      expires: 'This link will expire in',
      button: 'Reset Password',
      ifButtonDoesntWork: 'If the button doesn\'t work, paste this link into your browser:',
      notYou: 'If you didn\'t request this, please ignore this email. Your password will remain unchanged.',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because a password reset was requested for your account on',
      followJourney: 'Follow the journey:'
    },
    ru: {
      subject: 'Сброс пароля - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Мы получили запрос на сброс вашего пароля. Нажмите кнопку ниже, чтобы создать новый пароль:',
      expires: 'Эта ссылка действительна в течение',
      button: 'Сбросить пароль',
      ifButtonDoesntWork: 'Если кнопка не работает, вставьте эту ссылку в браузер:',
      notYou: 'Если вы не запрашивали это, проигнорируйте это письмо. Ваш пароль останется без изменений.',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что был запрошен сброс пароля для вашего аккаунта на',
      followJourney: 'Следите за путешествием:'
    },
    ua: {
      subject: 'Скидання пароля - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ми отримали запит на скидання вашого пароля. Натисніть кнопку нижче, щоб створити новий пароль:',
      expires: 'Це посилання дійсне протягом',
      button: 'Скинути пароль',
      ifButtonDoesntWork: 'Якщо кнопка не працює, вставте це посилання в браузер:',
      notYou: 'Якщо ви не запитували це, проігноруйте цей лист. Ваш пароль залишиться без змін.',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що був запрошений скидання пароля для вашого акаунта на',
      followJourney: 'Слідкуйте за подорожжю:'
    },
    es: {
      subject: 'Restablecer tu contraseña - PadelO₂',
      greeting: 'Hola',
      message: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón a continuación para crear una nueva contraseña:',
      expires: 'Este enlace expirará en',
      button: 'Restablecer contraseña',
      ifButtonDoesntWork: 'Si el botón no funciona, pega este enlace en tu navegador:',
      notYou: 'Si no solicitaste esto, ignora este correo. Tu contraseña permanecerá sin cambios.',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se solicitó un restablecimiento de contraseña para tu cuenta en'
    },
    fr: {
      subject: 'Réinitialiser votre mot de passe - PadelO₂',
      greeting: 'Bonjour',
      message: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:',
      expires: 'Ce lien expirera dans',
      button: 'Réinitialiser le mot de passe',
      ifButtonDoesntWork: 'Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur:',
      notYou: 'Si vous n\'avez pas demandé cela, ignorez cet e-mail. Votre mot de passe restera inchangé.',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'une réinitialisation de mot de passe a été demandée pour votre compte sur'
    },
    de: {
      subject: 'Passwort zurücksetzen - PadelO₂',
      greeting: 'Hallo',
      message: 'Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen:',
      expires: 'Dieser Link läuft ab in',
      button: 'Passwort zurücksetzen',
      ifButtonDoesntWork: 'Wenn die Schaltfläche nicht funktioniert, fügen Sie diesen Link in Ihren Browser ein:',
      notYou: 'Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine Passwort-Zurücksetzung für Ihr Konto auf'
    },
    it: {
      subject: 'Reimposta la tua password - PadelO₂',
      greeting: 'Ciao',
      message: 'Abbiamo ricevuto una richiesta per reimpostare la tua password. Fai clic sul pulsante qui sotto per creare una nuova password:',
      expires: 'Questo link scadrà tra',
      button: 'Reimposta password',
      ifButtonDoesntWork: 'Se il pulsante non funziona, incolla questo link nel tuo browser:',
      notYou: 'Se non hai richiesto questo, ignora questa email. La tua password rimarrà invariata.',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché è stata richiesta una reimpostazione della password per il tuo account su'
    },
    ca: {
      subject: 'Restablir la teva contrasenya - PadelO₂',
      greeting: 'Hola',
      message: 'Hem rebut una sol·licitud per restablir la teva contrasenya. Fes clic al botó a continuació per crear una nova contrasenya:',
      expires: 'Aquest enllaç expirarà en',
      button: 'Restablir contrasenya',
      ifButtonDoesntWork: 'Si el botó no funciona, enganxa aquest enllaç al teu navegador:',
      notYou: 'Si no has sol·licitat això, ignora aquest correu. La teva contrasenya romandrà sense canvis.',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè s\'ha sol·licitat un restabliment de contrasenya per al teu compte a'
    },
    nl: {
      subject: 'Reset uw wachtwoord - PadelO₂',
      greeting: 'Hallo',
      message: 'We hebben een verzoek ontvangen om uw wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord aan te maken:',
      expires: 'Deze link verloopt over',
      button: 'Wachtwoord resetten',
      ifButtonDoesntWork: 'Als de knop niet werkt, plak deze link in uw browser:',
      notYou: 'Als u dit niet heeft aangevraagd, negeer deze e-mail dan. Uw wachtwoord blijft ongewijzigd.',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat een wachtwoordreset is aangevraagd voor uw account op'
    },
    da: {
      subject: 'Nulstil din adgangskode - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har modtaget en anmodning om at nulstille din adgangskode. Klik på knappen nedenfor for at oprette en ny adgangskode:',
      expires: 'Dette link udløber om',
      button: 'Nulstil adgangskode',
      ifButtonDoesntWork: 'Hvis knappen ikke virker, indsæt dette link i din browser:',
      notYou: 'Hvis du ikke har anmodet om dette, ignorer denne e-mail. Din adgangskode forbliver uændret.',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi en adgangskodenulstilling blev anmodet for din konto på'
    },
    sv: {
      subject: 'Återställ ditt lösenord - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har mottagit en begäran om att återställa ditt lösenord. Klicka på knappen nedan för att skapa ett nytt lösenord:',
      expires: 'Denna länk upphör att gälla om',
      button: 'Återställ lösenord',
      ifButtonDoesntWork: 'Om knappen inte fungerar, klistra in denna länk i din webbläsare:',
      notYou: 'Om du inte begärde detta, ignorera detta e-postmeddelande. Ditt lösenord förblir oförändrat.',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en lösenordsåterställning begärdes för ditt konto på'
    },
    no: {
      subject: 'Tilbakestill passordet ditt - PadelO₂',
      greeting: 'Hei',
      message: 'Vi har mottatt en forespørsel om å tilbakestille passordet ditt. Klikk på knappen nedenfor for å opprette et nytt passord:',
      expires: 'Denne lenken utløper om',
      button: 'Tilbakestill passord',
      ifButtonDoesntWork: 'Hvis knappen ikke fungerer, lim inn denne lenken i nettleseren din:',
      notYou: 'Hvis du ikke ba om dette, ignorer denne e-posten. Passordet ditt forblir uendret.',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en passordtilbakestilling ble forespurt for kontoen din på'
    },
    ar: {
      subject: 'إعادة تعيين كلمة المرور - PadelO₂',
      greeting: 'مرحبا',
      message: 'لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:',
      expires: 'ستنتهي صلاحية هذا الرابط خلال',
      button: 'إعادة تعيين كلمة المرور',
      ifButtonDoesntWork: 'إذا لم يعمل الزر، الصق هذا الرابط في متصفحك:',
      notYou: 'إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني. ستبقى كلمة المرور الخاصة بك دون تغيير.',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم طلب إعادة تعيين كلمة المرور لحسابك على'
    },
    zh: {
      subject: '重置您的密码 - PadelO₂',
      greeting: '您好',
      message: '我们收到了重置您密码的请求。点击下面的按钮创建新密码:',
      expires: '此链接将在',
      button: '重置密码',
      ifButtonDoesntWork: '如果按钮不起作用，请将此链接粘贴到浏览器中:',
      notYou: '如果您没有请求此操作，请忽略此电子邮件。您的密码将保持不变。',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在'
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
      body {
        margin: 0;
        padding: 0;
        background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%);
      }
      table {
        border-spacing: 0;
        border-collapse: collapse;
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
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
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
      .warning-box {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .hide-mobile { display: table-cell; }
      @media screen and (max-width: 600px) {
        .p-body {
          padding: 0 18px 20px 18px !important;
        }
        .p-footer {
          padding: 14px 18px 24px 18px !important;
        }
        .center-mobile {
          text-align: center !important;
        }
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>

  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">
                        ${t.greeting} ${firstNameOnly}!
                      </div>
                      <p class="lead" style="margin: 0 0 12px 0;">
                        ${t.message}
                      </p>
                      <p class="muted" style="margin: 0 0 18px 0;">
                        ${t.expires} <strong>${expiresIn}</strong>.
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 6px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${resetUrl}" class="btn-primary">${t.button}</a>
                          </td>
                        </tr>
                      </table>

                      <p class="muted" style="margin: 0 0 18px 0;">
                        ${t.ifButtonDoesntWork}<br />
                        <span style="word-break: break-all; color: #0369a1;">${resetUrl}</span>
                      </p>

                      <div class="warning-box">
                        <p class="muted" style="margin: 0; color: #92400e;">
                          ${t.notYou}
                        </p>
                      </div>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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
                      <p class="muted" style="margin: 0 0 4px 0;">
                        ${t.receivingEmail}
                        <span style="color: #0369a1;">padelo2.com</span>.
                      </p>
                      <p class="muted" style="margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} PadelO<span style="font-size:1.4em; vertical-align:-1px; line-height:0;">₂</span>. All rights reserved.
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

// 3. Password Changed
export interface PasswordChangedEmailData {
  firstName?: string;
  locale?: string;
  timestamp?: string;
  supportUrl?: string;
}

export function getPasswordChangedEmailTemplate(data: PasswordChangedEmailData): string {
  const { firstName, locale = 'en', timestamp, supportUrl } = data;
  const firstNameOnly = firstName || 'User';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const supportLink = supportUrl || `${siteUrl}/${locale}/contact`;

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Your password has been changed - PadelO₂',
      greeting: 'Hello',
      message: 'Your password was successfully changed.',
      timestamp: 'This change was made on',
      notYou: 'If you didn\'t make this change, please contact us immediately to secure your account.',
      button: 'Contact Support',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because your password was changed on'
    },
    ru: {
      subject: 'Ваш пароль был изменен - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Ваш пароль был успешно изменен.',
      timestamp: 'Это изменение было сделано',
      notYou: 'Если вы не делали это изменение, пожалуйста, свяжитесь с нами немедленно, чтобы защитить ваш аккаунт.',
      button: 'Связаться с поддержкой',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что ваш пароль был изменен на'
    },
    ua: {
      subject: 'Ваш пароль було змінено - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ваш пароль було успішно змінено.',
      timestamp: 'Це зміну було зроблено',
      notYou: 'Якщо ви не робили цю зміну, будь ласка, зв\'яжіться з нами негайно, щоб захистити ваш акаунт.',
      button: 'Зв\'язатися з підтримкою',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що ваш пароль було змінено на'
    },
    es: {
      subject: 'Tu contraseña ha sido cambiada - PadelO₂',
      greeting: 'Hola',
      message: 'Tu contraseña fue cambiada exitosamente.',
      timestamp: 'Este cambio se realizó el',
      notYou: 'Si no realizaste este cambio, contáctanos inmediatamente para asegurar tu cuenta.',
      button: 'Contactar Soporte',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tu contraseña fue cambiada en'
    },
    fr: {
      subject: 'Votre mot de passe a été modifié - PadelO₂',
      greeting: 'Bonjour',
      message: 'Votre mot de passe a été modifié avec succès.',
      timestamp: 'Ce changement a été effectué le',
      notYou: 'Si vous n\'avez pas effectué ce changement, contactez-nous immédiatement pour sécuriser votre compte.',
      button: 'Contacter le Support',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que votre mot de passe a été modifié sur'
    },
    de: {
      subject: 'Ihr Passwort wurde geändert - PadelO₂',
      greeting: 'Hallo',
      message: 'Ihr Passwort wurde erfolgreich geändert.',
      timestamp: 'Diese Änderung wurde vorgenommen am',
      notYou: 'Wenn Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie uns bitte sofort, um Ihr Konto zu sichern.',
      button: 'Support kontaktieren',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Ihr Passwort auf'
    },
    it: {
      subject: 'La tua password è stata modificata - PadelO₂',
      greeting: 'Ciao',
      message: 'La tua password è stata modificata con successo.',
      timestamp: 'Questa modifica è stata effettuata il',
      notYou: 'Se non hai effettuato questa modifica, contattaci immediatamente per proteggere il tuo account.',
      button: 'Contatta il Supporto',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché la tua password è stata modificata su'
    },
    ca: {
      subject: 'La teva contrasenya ha estat canviada - PadelO₂',
      greeting: 'Hola',
      message: 'La teva contrasenya ha estat canviada amb èxit.',
      timestamp: 'Aquest canvi es va fer el',
      notYou: 'Si no has fet aquest canvi, contacta\'ns immediatament per assegurar el teu compte.',
      button: 'Contactar Suport',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè la teva contrasenya ha estat canviada a'
    },
    nl: {
      subject: 'Uw wachtwoord is gewijzigd - PadelO₂',
      greeting: 'Hallo',
      message: 'Uw wachtwoord is succesvol gewijzigd.',
      timestamp: 'Deze wijziging is gemaakt op',
      notYou: 'Als u deze wijziging niet heeft aangebracht, neem dan onmiddellijk contact met ons op om uw account te beveiligen.',
      button: 'Contact Ondersteuning',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat uw wachtwoord is gewijzigd op'
    },
    da: {
      subject: 'Din adgangskode er blevet ændret - PadelO₂',
      greeting: 'Hej',
      message: 'Din adgangskode er blevet ændret med succes.',
      timestamp: 'Denne ændring blev foretaget den',
      notYou: 'Hvis du ikke har foretaget denne ændring, kontakt os straks for at sikre din konto.',
      button: 'Kontakt Support',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi din adgangskode er blevet ændret på'
    },
    sv: {
      subject: 'Ditt lösenord har ändrats - PadelO₂',
      greeting: 'Hej',
      message: 'Ditt lösenord har ändrats.',
      timestamp: 'Denna ändring gjordes den',
      notYou: 'Om du inte gjorde denna ändring, kontakta oss omedelbart för att säkra ditt konto.',
      button: 'Kontakta Support',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom ditt lösenord har ändrats på'
    },
    no: {
      subject: 'Passordet ditt har blitt endret - PadelO₂',
      greeting: 'Hei',
      message: 'Passordet ditt har blitt endret.',
      timestamp: 'Denne endringen ble gjort',
      notYou: 'Hvis du ikke gjorde denne endringen, kontakt oss umiddelbart for å sikre kontoen din.',
      button: 'Kontakt Support',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi passordet ditt har blitt endret på'
    },
    ar: {
      subject: 'تم تغيير كلمة المرور الخاصة بك - PadelO₂',
      greeting: 'مرحبا',
      message: 'تم تغيير كلمة المرور الخاصة بك بنجاح.',
      timestamp: 'تم إجراء هذا التغيير في',
      notYou: 'إذا لم تقم بإجراء هذا التغيير، يرجى الاتصال بنا على الفور لتأمين حسابك.',
      button: 'اتصل بالدعم',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم تغيير كلمة المرور الخاصة بك على'
    },
    zh: {
      subject: '您的密码已更改 - PadelO₂',
      greeting: '您好',
      message: '您的密码已成功更改。',
      timestamp: '此更改是在',
      notYou: '如果您没有进行此更改，请立即联系我们以保护您的账户。',
      button: '联系支持',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您的密码已在'
    }
  };

  const t = translations[locale] || translations.en;
  const changeTime = timestamp || new Date().toLocaleString(locale);

  return `
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
      .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      <p class="muted" style="margin: 0 0 18px 0;">${t.timestamp} <strong>${changeTime}</strong>.</p>
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; color: #991b1b;">${t.notYou}</p>
                      </div>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${supportLink}" class="btn-primary">${t.button}</a>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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

// 4. New Device / New Location Login
export interface NewDeviceLoginEmailData {
  firstName?: string;
  deviceInfo?: string;
  location?: string;
  ipAddress?: string;
  timestamp?: string;
  locale?: string;
  supportUrl?: string;
}

export function getNewDeviceLoginEmailTemplate(data: NewDeviceLoginEmailData): string {
  const { firstName, deviceInfo, location, ipAddress, timestamp, locale = 'en', supportUrl } = data;
  const firstNameOnly = firstName || 'User';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  const supportLink = supportUrl || `${siteUrl}/${locale}/contact`;
  const loginTime = timestamp || new Date().toLocaleString(locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'New device login detected - PadelO₂',
      greeting: 'Hello',
      message: 'We detected a login from a new device or location.',
      details: 'Login details:',
      device: 'Device',
      location: 'Location',
      ip: 'IP Address',
      time: 'Time',
      notYou: 'If this wasn\'t you, please secure your account immediately.',
      button: 'Secure Account',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because a new login was detected on your account on'
    },
    ru: {
      subject: 'Обнаружен вход с нового устройства - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Мы обнаружили вход с нового устройства или местоположения.',
      details: 'Детали входа:',
      device: 'Устройство',
      location: 'Местоположение',
      ip: 'IP адрес',
      time: 'Время',
      notYou: 'Если это были не вы, пожалуйста, немедленно защитите свой аккаунт.',
      button: 'Защитить аккаунт',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что был обнаружен новый вход в ваш аккаунт на'
    },
    ua: {
      subject: 'Виявлено вхід з нового пристрою - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ми виявили вхід з нового пристрою або місцезнаходження.',
      details: 'Деталі входу:',
      device: 'Пристрій',
      location: 'Місцезнаходження',
      ip: 'IP адреса',
      time: 'Час',
      notYou: 'Якщо це були не ви, будь ласка, негайно захистіть свій акаунт.',
      button: 'Захистити акаунт',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що був виявлений новий вхід у ваш акаунт на'
    },
    es: {
      subject: 'Inicio de sesión desde nuevo dispositivo detectado - PadelO₂',
      greeting: 'Hola',
      message: 'Detectamos un inicio de sesión desde un nuevo dispositivo o ubicación.',
      details: 'Detalles del inicio de sesión:',
      device: 'Dispositivo',
      location: 'Ubicación',
      ip: 'Dirección IP',
      time: 'Hora',
      notYou: 'Si no fuiste tú, protege tu cuenta inmediatamente.',
      button: 'Proteger Cuenta',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se detectó un nuevo inicio de sesión en tu cuenta en'
    },
    fr: {
      subject: 'Connexion depuis un nouvel appareil détectée - PadelO₂',
      greeting: 'Bonjour',
      message: 'Nous avons détecté une connexion depuis un nouvel appareil ou emplacement.',
      details: 'Détails de la connexion:',
      device: 'Appareil',
      location: 'Emplacement',
      ip: 'Adresse IP',
      time: 'Heure',
      notYou: 'Si ce n\'était pas vous, sécurisez votre compte immédiatement.',
      button: 'Sécuriser le Compte',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'une nouvelle connexion a été détectée sur votre compte sur'
    },
    de: {
      subject: 'Anmeldung von neuem Gerät erkannt - PadelO₂',
      greeting: 'Hallo',
      message: 'Wir haben eine Anmeldung von einem neuen Gerät oder Standort erkannt.',
      details: 'Anmeldedetails:',
      device: 'Gerät',
      location: 'Standort',
      ip: 'IP-Adresse',
      time: 'Zeit',
      notYou: 'Wenn Sie das nicht waren, sichern Sie bitte sofort Ihr Konto.',
      button: 'Konto sichern',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine neue Anmeldung auf Ihrem Konto erkannt wurde auf'
    },
    it: {
      subject: 'Accesso da nuovo dispositivo rilevato - PadelO₂',
      greeting: 'Ciao',
      message: 'Abbiamo rilevato un accesso da un nuovo dispositivo o posizione.',
      details: 'Dettagli di accesso:',
      device: 'Dispositivo',
      location: 'Posizione',
      ip: 'Indirizzo IP',
      time: 'Ora',
      notYou: 'Se non eri tu, proteggi immediatamente il tuo account.',
      button: 'Proteggi Account',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché è stato rilevato un nuovo accesso sul tuo account su'
    },
    ca: {
      subject: 'Inici de sessió des de nou dispositiu detectat - PadelO₂',
      greeting: 'Hola',
      message: 'Hem detectat un inici de sessió des d\'un nou dispositiu o ubicació.',
      details: 'Detalls de l\'inici de sessió:',
      device: 'Dispositiu',
      location: 'Ubicació',
      ip: 'Adreça IP',
      time: 'Hora',
      notYou: 'Si no has estat tu, protegeix el teu compte immediatament.',
      button: 'Protegir Compte',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè s\'ha detectat un nou inici de sessió al teu compte a'
    },
    nl: {
      subject: 'Aanmelding vanaf nieuw apparaat gedetecteerd - PadelO₂',
      greeting: 'Hallo',
      message: 'We hebben een aanmelding vanaf een nieuw apparaat of locatie gedetecteerd.',
      details: 'Aanmeldingsgegevens:',
      device: 'Apparaat',
      location: 'Locatie',
      ip: 'IP-adres',
      time: 'Tijd',
      notYou: 'Als dit niet u was, beveilig uw account onmiddellijk.',
      button: 'Account beveiligen',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat een nieuwe aanmelding is gedetecteerd op uw account op'
    },
    da: {
      subject: 'Login fra ny enhed registreret - PadelO₂',
      greeting: 'Hej',
      message: 'Vi registrerede et login fra en ny enhed eller placering.',
      details: 'Login detaljer:',
      device: 'Enhed',
      location: 'Placering',
      ip: 'IP-adresse',
      time: 'Tid',
      notYou: 'Hvis det ikke var dig, sikre din konto med det samme.',
      button: 'Sikre Konto',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi et nyt login blev registreret på din konto på'
    },
    sv: {
      subject: 'Inloggning från ny enhet upptäckt - PadelO₂',
      greeting: 'Hej',
      message: 'Vi upptäckte en inloggning från en ny enhet eller plats.',
      details: 'Inloggningsdetaljer:',
      device: 'Enhet',
      location: 'Plats',
      ip: 'IP-adress',
      time: 'Tid',
      notYou: 'Om det inte var du, skydda ditt konto omedelbart.',
      button: 'Skydda Konto',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en ny inloggning upptäcktes på ditt konto på'
    },
    no: {
      subject: 'Innlogging fra ny enhet oppdaget - PadelO₂',
      greeting: 'Hei',
      message: 'Vi oppdaget en innlogging fra en ny enhet eller plassering.',
      details: 'Innloggingsdetaljer:',
      device: 'Enhet',
      location: 'Plassering',
      ip: 'IP-adresse',
      time: 'Tid',
      notYou: 'Hvis det ikke var deg, sikre kontoen din umiddelbart.',
      button: 'Sikre Konto',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en ny innlogging ble oppdaget på kontoen din på'
    },
    ar: {
      subject: 'تم اكتشاف تسجيل الدخول من جهاز جديد - PadelO₂',
      greeting: 'مرحبا',
      message: 'اكتشفنا تسجيل دخول من جهاز أو موقع جديد.',
      details: 'تفاصيل تسجيل الدخول:',
      device: 'الجهاز',
      location: 'الموقع',
      ip: 'عنوان IP',
      time: 'الوقت',
      notYou: 'إذا لم تكن أنت، يرجى تأمين حسابك على الفور.',
      button: 'تأمين الحساب',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم اكتشاف تسجيل دخول جديد على حسابك على'
    },
    zh: {
      subject: '检测到新设备登录 - PadelO₂',
      greeting: '您好',
      message: '我们检测到来自新设备或位置的登录。',
      details: '登录详情:',
      device: '设备',
      location: '位置',
      ip: 'IP地址',
      time: '时间',
      notYou: '如果不是您，请立即保护您的账户。',
      button: '保护账户',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在'
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
      .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      <div class="info-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e;">${t.details}</p>
                        ${deviceInfo ? `<p class="muted" style="margin: 4px 0;"><strong>${t.device}:</strong> ${deviceInfo}</p>` : ''}
                        ${location ? `<p class="muted" style="margin: 4px 0;"><strong>${t.location}:</strong> ${location}</p>` : ''}
                        ${ipAddress ? `<p class="muted" style="margin: 4px 0;"><strong>${t.ip}:</strong> ${ipAddress}</p>` : ''}
                        <p class="muted" style="margin: 4px 0;"><strong>${t.time}:</strong> ${loginTime}</p>
                      </div>
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; color: #991b1b;">${t.notYou}</p>
                      </div>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${supportLink}" class="btn-primary">${t.button}</a>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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

// 5. Change Email - Confirmation (Old Address)
export interface ChangeEmailOldAddressEmailData {
  firstName?: string;
  oldEmail: string;
  newEmail: string;
  cancelUrl: string;
  locale?: string;
}

export function getChangeEmailOldAddressEmailTemplate(data: ChangeEmailOldAddressEmailData): string {
  const { firstName, oldEmail, newEmail, cancelUrl, locale = 'en' } = data;
  const firstNameOnly = firstName || 'User';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Email change requested - PadelO₂',
      greeting: 'Hello',
      message: 'We received a request to change your email address from',
      to: 'to',
      notYou: 'If you didn\'t request this change, please cancel it immediately by clicking the button below.',
      button: 'Cancel Email Change',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because an email change was requested for your account on'
    },
    ru: {
      subject: 'Запрос на изменение email - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Мы получили запрос на изменение вашего email адреса с',
      to: 'на',
      notYou: 'Если вы не запрашивали это изменение, пожалуйста, отмените его немедленно, нажав кнопку ниже.',
      button: 'Отменить изменение email',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что был запрошен смена email для вашего аккаунта на'
    },
    ua: {
      subject: 'Запит на зміну email - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ми отримали запит на зміну вашої email адреси з',
      to: 'на',
      notYou: 'Якщо ви не запитували цю зміну, будь ласка, скасуйте її негайно, натиснувши кнопку нижче.',
      button: 'Скасувати зміну email',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що був запрошений зміна email для вашого акаунта на'
    },
    es: {
      subject: 'Solicitud de cambio de correo electrónico - PadelO₂',
      greeting: 'Hola',
      message: 'Recibimos una solicitud para cambiar tu dirección de correo electrónico de',
      to: 'a',
      notYou: 'Si no solicitaste este cambio, cancélalo inmediatamente haciendo clic en el botón a continuación.',
      button: 'Cancelar Cambio de Email',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se solicitó un cambio de correo electrónico para tu cuenta en'
    },
    fr: {
      subject: 'Demande de changement d\'e-mail - PadelO₂',
      greeting: 'Bonjour',
      message: 'Nous avons reçu une demande de changement de votre adresse e-mail de',
      to: 'vers',
      notYou: 'Si vous n\'avez pas demandé ce changement, annulez-le immédiatement en cliquant sur le bouton ci-dessous.',
      button: 'Annuler le Changement d\'Email',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'un changement d\'e-mail a été demandé pour votre compte sur'
    },
    de: {
      subject: 'E-Mail-Änderung angefordert - PadelO₂',
      greeting: 'Hallo',
      message: 'Wir haben eine Anfrage erhalten, Ihre E-Mail-Adresse von',
      to: 'zu',
      notYou: 'Wenn Sie diese Änderung nicht angefordert haben, stornieren Sie sie bitte sofort, indem Sie auf die Schaltfläche unten klicken.',
      button: 'E-Mail-Änderung stornieren',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine E-Mail-Änderung für Ihr Konto auf'
    },
    it: {
      subject: 'Richiesta di modifica email - PadelO₂',
      greeting: 'Ciao',
      message: 'Abbiamo ricevuto una richiesta per modificare il tuo indirizzo email da',
      to: 'a',
      notYou: 'Se non hai richiesto questa modifica, annullala immediatamente cliccando sul pulsante qui sotto.',
      button: 'Annulla Modifica Email',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché è stata richiesta una modifica email per il tuo account su'
    },
    ca: {
      subject: 'Sol·licitud de canvi de correu electrònic - PadelO₂',
      greeting: 'Hola',
      message: 'Hem rebut una sol·licitud per canviar la teva adreça de correu electrònic de',
      to: 'a',
      notYou: 'Si no has sol·licitat aquest canvi, cancel·la\'l immediatament fent clic al botó a continuació.',
      button: 'Cancel·lar Canvi de Correu',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè s\'ha sol·licitat un canvi de correu electrònic per al teu compte a'
    },
    nl: {
      subject: 'E-mailwijziging aangevraagd - PadelO₂',
      greeting: 'Hallo',
      message: 'We hebben een verzoek ontvangen om uw e-mailadres te wijzigen van',
      to: 'naar',
      notYou: 'Als u deze wijziging niet heeft aangevraagd, annuleer deze dan onmiddellijk door op de knop hieronder te klikken.',
      button: 'E-mailwijziging annuleren',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat een e-mailwijziging is aangevraagd voor uw account op'
    },
    da: {
      subject: 'E-mailændring anmodet - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har modtaget en anmodning om at ændre din e-mailadresse fra',
      to: 'til',
      notYou: 'Hvis du ikke har anmodet om denne ændring, annuller den straks ved at klikke på knappen nedenfor.',
      button: 'Annuller E-mailændring',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi en e-mailændring blev anmodet for din konto på'
    },
    sv: {
      subject: 'E-poständring begärd - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har mottagit en begäran om att ändra din e-postadress från',
      to: 'till',
      notYou: 'Om du inte begärde denna ändring, avbryt den omedelbart genom att klicka på knappen nedan.',
      button: 'Avbryt E-poständring',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en e-poständring begärdes för ditt konto på'
    },
    no: {
      subject: 'E-postendring forespurt - PadelO₂',
      greeting: 'Hei',
      message: 'Vi har mottatt en forespørsel om å endre din e-postadresse fra',
      to: 'til',
      notYou: 'Hvis du ikke ba om denne endringen, avbryt den umiddelbart ved å klikke på knappen nedenfor.',
      button: 'Avbryt E-postendring',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en e-postendring ble forespurt for kontoen din på'
    },
    ar: {
      subject: 'تم طلب تغيير البريد الإلكتروني - PadelO₂',
      greeting: 'مرحبا',
      message: 'لقد تلقينا طلبًا لتغيير عنوان بريدك الإلكتروني من',
      to: 'إلى',
      notYou: 'إذا لم تطلب هذا التغيير، يرجى إلغاؤه على الفور بالنقر على الزر أدناه.',
      button: 'إلغاء تغيير البريد الإلكتروني',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم طلب تغيير البريد الإلكتروني لحسابك على'
    },
    zh: {
      subject: '请求更改电子邮件 - PadelO₂',
      greeting: '您好',
      message: '我们收到了将您的电子邮件地址从',
      to: '更改为',
      notYou: '如果您没有请求此更改，请立即点击下面的按钮取消。',
      button: '取消电子邮件更改',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在'
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
      body { margin: 0; padding: 0; background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%); }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 999px; font-size: 14px; font-weight: 600; color: #ffffff !important; padding: 11px 30px; display: inline-block; box-shadow: 0 10px 26px rgba(239, 68, 68, 0.35); }
      .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message} <strong>${oldEmail}</strong> ${t.to} <strong>${newEmail}</strong>.</p>
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; color: #991b1b;">${t.notYou}</p>
                      </div>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${cancelUrl}" class="btn-primary">${t.button}</a>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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

// 6. Change Email - Confirmation (New Address)
export interface ChangeEmailNewAddressEmailData {
  firstName?: string;
  newEmail: string;
  confirmUrl: string;
  locale?: string;
  expiresIn?: string;
}

export function getChangeEmailNewAddressEmailTemplate(data: ChangeEmailNewAddressEmailData): string {
  const { firstName, newEmail, confirmUrl, locale = 'en', expiresIn = '24 hours' } = data;
  const firstNameOnly = firstName || 'User';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Confirm your new email address - PadelO₂',
      greeting: 'Hello',
      message: 'Please confirm your new email address by clicking the button below:',
      newEmail: 'New email',
      expires: 'This link will expire in',
      button: 'Confirm New Email',
      ifButtonDoesntWork: 'If the button doesn\'t work, paste this link into your browser:',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because an email change was requested for your account on'
    },
    ru: {
      subject: 'Подтвердите ваш новый email адрес - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Пожалуйста, подтвердите ваш новый email адрес, нажав кнопку ниже:',
      newEmail: 'Новый email',
      expires: 'Эта ссылка действительна в течение',
      button: 'Подтвердить новый email',
      ifButtonDoesntWork: 'Если кнопка не работает, вставьте эту ссылку в браузер:',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что был запрошен смена email для вашего аккаунта на'
    },
    ua: {
      subject: 'Підтвердіть вашу нову email адресу - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Будь ласка, підтвердіть вашу нову email адресу, натиснувши кнопку нижче:',
      newEmail: 'Новий email',
      expires: 'Це посилання дійсне протягом',
      button: 'Підтвердити новий email',
      ifButtonDoesntWork: 'Якщо кнопка не працює, вставте це посилання в браузер:',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що був запрошений зміна email для вашого акаунта на'
    },
    es: {
      subject: 'Confirma tu nueva dirección de correo electrónico - PadelO₂',
      greeting: 'Hola',
      message: 'Por favor, confirma tu nueva dirección de correo electrónico haciendo clic en el botón a continuación:',
      newEmail: 'Nuevo correo',
      expires: 'Este enlace expirará en',
      button: 'Confirmar Nuevo Correo',
      ifButtonDoesntWork: 'Si el botón no funciona, pega este enlace en tu navegador:',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se solicitó un cambio de correo electrónico para tu cuenta en'
    },
    fr: {
      subject: 'Confirmez votre nouvelle adresse e-mail - PadelO₂',
      greeting: 'Bonjour',
      message: 'Veuillez confirmer votre nouvelle adresse e-mail en cliquant sur le bouton ci-dessous:',
      newEmail: 'Nouvel e-mail',
      expires: 'Ce lien expirera dans',
      button: 'Confirmer le Nouvel E-mail',
      ifButtonDoesntWork: 'Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur:',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'un changement d\'e-mail a été demandé pour votre compte sur'
    },
    de: {
      subject: 'Bestätigen Sie Ihre neue E-Mail-Adresse - PadelO₂',
      greeting: 'Hallo',
      message: 'Bitte bestätigen Sie Ihre neue E-Mail-Adresse, indem Sie auf die Schaltfläche unten klicken:',
      newEmail: 'Neue E-Mail',
      expires: 'Dieser Link läuft ab in',
      button: 'Neue E-Mail bestätigen',
      ifButtonDoesntWork: 'Wenn die Schaltfläche nicht funktioniert, fügen Sie diesen Link in Ihren Browser ein:',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine E-Mail-Änderung für Ihr Konto auf'
    },
    it: {
      subject: 'Conferma il tuo nuovo indirizzo email - PadelO₂',
      greeting: 'Ciao',
      message: 'Per favore, conferma il tuo nuovo indirizzo email cliccando sul pulsante qui sotto:',
      newEmail: 'Nuova email',
      expires: 'Questo link scadrà tra',
      button: 'Conferma Nuova Email',
      ifButtonDoesntWork: 'Se il pulsante non funziona, incolla questo link nel tuo browser:',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché è stata richiesta una modifica email per il tuo account su'
    },
    ca: {
      subject: 'Confirma la teva nova adreça de correu electrònic - PadelO₂',
      greeting: 'Hola',
      message: 'Si us plau, confirma la teva nova adreça de correu electrònic fent clic al botó a continuació:',
      newEmail: 'Nou correu',
      expires: 'Aquest enllaç expirarà en',
      button: 'Confirmar Nou Correu',
      ifButtonDoesntWork: 'Si el botó no funciona, enganxa aquest enllaç al teu navegador:',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè s\'ha sol·licitat un canvi de correu electrònic per al teu compte a'
    },
    nl: {
      subject: 'Bevestig uw nieuwe e-mailadres - PadelO₂',
      greeting: 'Hallo',
      message: 'Bevestig uw nieuwe e-mailadres door op de knop hieronder te klikken:',
      newEmail: 'Nieuw e-mailadres',
      expires: 'Deze link verloopt over',
      button: 'Nieuw E-mailadres bevestigen',
      ifButtonDoesntWork: 'Als de knop niet werkt, plak deze link in uw browser:',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat een e-mailwijziging is aangevraagd voor uw account op'
    },
    da: {
      subject: 'Bekræft din nye e-mailadresse - PadelO₂',
      greeting: 'Hej',
      message: 'Bekræft venligst din nye e-mailadresse ved at klikke på knappen nedenfor:',
      newEmail: 'Ny e-mail',
      expires: 'Dette link udløber om',
      button: 'Bekræft Ny E-mail',
      ifButtonDoesntWork: 'Hvis knappen ikke virker, indsæt dette link i din browser:',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi en e-mailændring blev anmodet for din konto på'
    },
    sv: {
      subject: 'Bekräfta din nya e-postadress - PadelO₂',
      greeting: 'Hej',
      message: 'Bekräfta din nya e-postadress genom att klicka på knappen nedan:',
      newEmail: 'Ny e-post',
      expires: 'Denna länk upphör att gälla om',
      button: 'Bekräfta Ny E-post',
      ifButtonDoesntWork: 'Om knappen inte fungerar, klistra in denna länk i din webbläsare:',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en e-poständring begärdes för ditt konto på'
    },
    no: {
      subject: 'Bekreft din nye e-postadresse - PadelO₂',
      greeting: 'Hei',
      message: 'Bekreft din nye e-postadresse ved å klikke på knappen nedenfor:',
      newEmail: 'Ny e-post',
      expires: 'Denne lenken utløper om',
      button: 'Bekreft Ny E-post',
      ifButtonDoesntWork: 'Hvis knappen ikke fungerer, lim inn denne lenken i nettleseren din:',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en e-postendring ble forespurt for kontoen din på'
    },
    ar: {
      subject: 'أكد عنوان بريدك الإلكتروني الجديد - PadelO₂',
      greeting: 'مرحبا',
      message: 'يرجى تأكيد عنوان بريدك الإلكتروني الجديد بالنقر على الزر أدناه:',
      newEmail: 'بريد إلكتروني جديد',
      expires: 'ستنتهي صلاحية هذا الرابط خلال',
      button: 'تأكيد البريد الإلكتروني الجديد',
      ifButtonDoesntWork: 'إذا لم يعمل الزر، الصق هذا الرابط في متصفحك:',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم طلب تغيير البريد الإلكتروني لحسابك على'
    },
    zh: {
      subject: '确认您的新电子邮件地址 - PadelO₂',
      greeting: '您好',
      message: '请点击下面的按钮确认您的新电子邮件地址:',
      newEmail: '新电子邮件',
      expires: '此链接将在',
      button: '确认新电子邮件',
      ifButtonDoesntWork: '如果按钮不起作用，请将此链接粘贴到浏览器中:',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在'
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
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      <div class="info-box">
                        <p class="muted" style="margin: 0; font-weight: 600; color: #0c4a6e;"><strong>${t.newEmail}:</strong> ${newEmail}</p>
                      </div>
                      <p class="muted" style="margin: 0 0 18px 0;">${t.expires} <strong>${expiresIn}</strong>.</p>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 6px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${confirmUrl}" class="btn-primary">${t.button}</a>
                          </td>
                        </tr>
                      </table>
                      <p class="muted" style="margin: 0 0 18px 0;">${t.ifButtonDoesntWork}<br />
                        <span style="word-break: break-all; color: #0369a1;">${confirmUrl}</span>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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

// 7. Account Deletion - Confirm
export interface AccountDeletionConfirmEmailData {
  firstName?: string;
  confirmUrl: string;
  locale?: string;
  expiresIn?: string;
}

export function getAccountDeletionConfirmEmailTemplate(data: AccountDeletionConfirmEmailData): string {
  const { firstName, confirmUrl, locale = 'en', expiresIn = '7 days' } = data;
  const firstNameOnly = firstName || 'User';

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Confirm account deletion - PadelO₂',
      greeting: 'Hello',
      message: 'We received a request to delete your account. This action cannot be undone.',
      warning: 'All your data, including tournament registrations, match history, and profile information, will be permanently deleted.',
      confirm: 'If you want to proceed, click the button below:',
      expires: 'This link will expire in',
      button: 'Confirm Deletion',
      cancel: 'If you didn\'t request this, please ignore this email. Your account will remain active.',
      footer: 'Stay secure',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because an account deletion was requested on'
    },
    ru: {
      subject: 'Подтверждение удаления аккаунта - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Мы получили запрос на удаление вашего аккаунта. Это действие нельзя отменить.',
      warning: 'Все ваши данные, включая регистрации на турниры, историю матчей и информацию профиля, будут безвозвратно удалены.',
      confirm: 'Если вы хотите продолжить, нажмите кнопку ниже:',
      expires: 'Эта ссылка действительна в течение',
      button: 'Подтвердить удаление',
      cancel: 'Если вы не запрашивали это, проигнорируйте это письмо. Ваш аккаунт останется активным.',
      footer: 'Оставайтесь в безопасности',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что был запрошен удаление аккаунта на'
    },
    ua: {
      subject: 'Підтвердження видалення акаунта - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ми отримали запит на видалення вашого акаунта. Цю дію неможливо скасувати.',
      warning: 'Всі ваші дані, включаючи реєстрації на турніри, історію матчів та інформацію профілю, будуть безповоротно видалені.',
      confirm: 'Якщо ви хочете продовжити, натисніть кнопку нижче:',
      expires: 'Це посилання дійсне протягом',
      button: 'Підтвердити видалення',
      cancel: 'Якщо ви не запитували це, проігноруйте цей лист. Ваш акаунт залишиться активним.',
      footer: 'Залишайтеся в безпеці',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що був запрошений видалення акаунта на'
    },
    es: {
      subject: 'Confirmar eliminación de cuenta - PadelO₂',
      greeting: 'Hola',
      message: 'Recibimos una solicitud para eliminar tu cuenta. Esta acción no se puede deshacer.',
      warning: 'Todos tus datos, incluidas las inscripciones a torneos, el historial de partidos y la información del perfil, se eliminarán permanentemente.',
      confirm: 'Si deseas continuar, haz clic en el botón a continuación:',
      expires: 'Este enlace expirará en',
      button: 'Confirmar Eliminación',
      cancel: 'Si no solicitaste esto, ignora este correo. Tu cuenta permanecerá activa.',
      footer: 'Mantente seguro',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se solicitó una eliminación de cuenta en'
    },
    fr: {
      subject: 'Confirmer la suppression du compte - PadelO₂',
      greeting: 'Bonjour',
      message: 'Nous avons reçu une demande de suppression de votre compte. Cette action ne peut pas être annulée.',
      warning: 'Toutes vos données, y compris les inscriptions aux tournois, l\'historique des matchs et les informations de profil, seront définitivement supprimées.',
      confirm: 'Si vous souhaitez continuer, cliquez sur le bouton ci-dessous:',
      expires: 'Ce lien expirera dans',
      button: 'Confirmer la Suppression',
      cancel: 'Si vous n\'avez pas demandé cela, ignorez cet e-mail. Votre compte restera actif.',
      footer: 'Restez en sécurité',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce qu\'une suppression de compte a été demandée sur'
    },
    de: {
      subject: 'Kontolöschung bestätigen - PadelO₂',
      greeting: 'Hallo',
      message: 'Wir haben eine Anfrage zum Löschen Ihres Kontos erhalten. Diese Aktion kann nicht rückgängig gemacht werden.',
      warning: 'Alle Ihre Daten, einschließlich Turnieranmeldungen, Spielverlauf und Profilinformationen, werden dauerhaft gelöscht.',
      confirm: 'Wenn Sie fortfahren möchten, klicken Sie auf die Schaltfläche unten:',
      expires: 'Dieser Link läuft ab in',
      button: 'Löschung bestätigen',
      cancel: 'Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail. Ihr Konto bleibt aktiv.',
      footer: 'Bleiben Sie sicher',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil eine Kontolöschung auf'
    },
    it: {
      subject: 'Conferma eliminazione account - PadelO₂',
      greeting: 'Ciao',
      message: 'Abbiamo ricevuto una richiesta per eliminare il tuo account. Questa azione non può essere annullata.',
      warning: 'Tutti i tuoi dati, inclusi registrazioni ai tornei, cronologia delle partite e informazioni del profilo, saranno eliminati permanentemente.',
      confirm: 'Se vuoi procedere, clicca sul pulsante qui sotto:',
      expires: 'Questo link scadrà tra',
      button: 'Conferma Eliminazione',
      cancel: 'Se non hai richiesto questo, ignora questa email. Il tuo account rimarrà attivo.',
      footer: 'Resta al sicuro',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché è stata richiesta un\'eliminazione dell\'account su'
    },
    ca: {
      subject: 'Confirmar eliminació de compte - PadelO₂',
      greeting: 'Hola',
      message: 'Hem rebut una sol·licitud per eliminar el teu compte. Aquesta acció no es pot desfer.',
      warning: 'Totes les teves dades, incloses les inscripcions a torneigs, l\'historial de partits i la informació del perfil, s\'eliminaran permanentment.',
      confirm: 'Si vols continuar, fes clic al botó a continuació:',
      expires: 'Aquest enllaç expirarà en',
      button: 'Confirmar Eliminació',
      cancel: 'Si no has sol·licitat això, ignora aquest correu. El teu compte romandrà actiu.',
      footer: 'Mantingues segur',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè s\'ha sol·licitat una eliminació de compte a'
    },
    nl: {
      subject: 'Accountverwijdering bevestigen - PadelO₂',
      greeting: 'Hallo',
      message: 'We hebben een verzoek ontvangen om uw account te verwijderen. Deze actie kan niet ongedaan worden gemaakt.',
      warning: 'Al uw gegevens, inclusief toernooi-inschrijvingen, wedstrijdgeschiedenis en profielinformatie, worden permanent verwijderd.',
      confirm: 'Als u wilt doorgaan, klik op de knop hieronder:',
      expires: 'Deze link verloopt over',
      button: 'Verwijdering bevestigen',
      cancel: 'Als u dit niet heeft aangevraagd, negeer deze e-mail dan. Uw account blijft actief.',
      footer: 'Blijf veilig',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat een accountverwijdering is aangevraagd op'
    },
    da: {
      subject: 'Bekræft kontosletning - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har modtaget en anmodning om at slette din konto. Denne handling kan ikke fortrydes.',
      warning: 'Alle dine data, herunder turneringsregistreringer, kamp historik og profilinformation, vil blive permanent slettet.',
      confirm: 'Hvis du vil fortsætte, klik på knappen nedenfor:',
      expires: 'Dette link udløber om',
      button: 'Bekræft Sletning',
      cancel: 'Hvis du ikke har anmodet om dette, ignorer denne e-mail. Din konto forbliver aktiv.',
      footer: 'Forbliv sikker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi en kontosletning blev anmodet på'
    },
    sv: {
      subject: 'Bekräfta kontoborttagning - PadelO₂',
      greeting: 'Hej',
      message: 'Vi har mottagit en begäran om att ta bort ditt konto. Denna åtgärd kan inte ångras.',
      warning: 'Alla dina data, inklusive turneringsregistreringar, matchhistorik och profilinformation, kommer att raderas permanent.',
      confirm: 'Om du vill fortsätta, klicka på knappen nedan:',
      expires: 'Denna länk upphör att gälla om',
      button: 'Bekräfta Borttagning',
      cancel: 'Om du inte begärde detta, ignorera detta e-postmeddelande. Ditt konto förblir aktivt.',
      footer: 'Håll dig säker',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom en kontoborttagning begärdes på'
    },
    no: {
      subject: 'Bekreft kontosletting - PadelO₂',
      greeting: 'Hei',
      message: 'Vi har mottatt en forespørsel om å slette kontoen din. Denne handlingen kan ikke angres.',
      warning: 'Alle dine data, inkludert turneringsregistreringer, kamp historikk og profilinformasjon, vil bli permanent slettet.',
      confirm: 'Hvis du vil fortsette, klikk på knappen nedenfor:',
      expires: 'Denne lenken utløper om',
      button: 'Bekreft Sletting',
      cancel: 'Hvis du ikke ba om dette, ignorer denne e-posten. Kontoen din forblir aktiv.',
      footer: 'Hold deg trygg',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi en kontosletting ble forespurt på'
    },
    ar: {
      subject: 'تأكيد حذف الحساب - PadelO₂',
      greeting: 'مرحبا',
      message: 'لقد تلقينا طلبًا لحذف حسابك. لا يمكن التراجع عن هذا الإجراء.',
      warning: 'سيتم حذف جميع بياناتك بشكل دائم، بما في ذلك تسجيلات البطولات وسجل المباريات ومعلومات الملف الشخصي.',
      confirm: 'إذا كنت تريد المتابعة، انقر على الزر أدناه:',
      expires: 'ستنتهي صلاحية هذا الرابط خلال',
      button: 'تأكيد الحذف',
      cancel: 'إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني. سيبقى حسابك نشطًا.',
      footer: 'ابق آمنا',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم طلب حذف الحساب على'
    },
    zh: {
      subject: '确认删除账户 - PadelO₂',
      greeting: '您好',
      message: '我们收到了删除您账户的请求。此操作无法撤销。',
      warning: '您的所有数据，包括锦标赛注册、比赛历史和配置文件信息，将被永久删除。',
      confirm: '如果您想继续，请点击下面的按钮:',
      expires: '此链接将在',
      button: '确认删除',
      cancel: '如果您没有请求此操作，请忽略此电子邮件。您的账户将保持活动状态。',
      footer: '保持安全',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为在'
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
      body { margin: 0; padding: 0; background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%); }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .btn-primary { background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 999px; font-size: 14px; font-weight: 600; color: #ffffff !important; padding: 11px 30px; display: inline-block; box-shadow: 0 10px 26px rgba(239, 68, 68, 0.35); }
      .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      <div class="warning-box">
                        <p class="muted" style="margin: 0; color: #991b1b; font-weight: 600;">${t.warning}</p>
                      </div>
                      <p class="lead" style="margin: 20px 0 12px 0;">${t.confirm}</p>
                      <p class="muted" style="margin: 0 0 18px 0;">${t.expires} <strong>${expiresIn}</strong>.</p>
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 6px 0 18px 0;">
                        <tr>
                          <td align="left" class="center-mobile">
                            <a href="${confirmUrl}" class="btn-primary">${t.button}</a>
                          </td>
                        </tr>
                      </table>
                      <p class="muted" style="margin: 20px 0 0 0;">${t.cancel}</p>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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

// 8. Account Deleted - Final Notice
export interface AccountDeletedEmailData {
  firstName?: string;
  deletedAt?: string;
  locale?: string;
}

export function getAccountDeletedEmailTemplate(data: AccountDeletedEmailData): string {
  const { firstName, deletedAt, locale = 'en' } = data;
  const firstNameOnly = firstName || 'User';
  const deletionTime = deletedAt || new Date().toLocaleString(locale);

  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Your account has been deleted - PadelO₂',
      greeting: 'Hello',
      message: 'Your account has been successfully deleted.',
      deletedAt: 'Deletion completed on',
      whatWasDeleted: 'The following data has been permanently removed:',
      dataList: '• Account information and profile<br>• Tournament registrations<br>• Match history and statistics<br>• All personal data',
      finalMessage: 'We\'re sorry to see you go. If you change your mind, you can always create a new account.',
      footer: 'Thank you for being part of PadelO₂',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because your account was deleted on'
    },
    ru: {
      subject: 'Ваш аккаунт был удален - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Ваш аккаунт был успешно удален.',
      deletedAt: 'Удаление завершено',
      whatWasDeleted: 'Следующие данные были безвозвратно удалены:',
      dataList: '• Информация об аккаунте и профиле<br>• Регистрации на турниры<br>• История матчей и статистика<br>• Все личные данные',
      finalMessage: 'Нам жаль, что вы уходите. Если вы передумаете, вы всегда можете создать новый аккаунт.',
      footer: 'Спасибо, что были частью PadelO₂',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что ваш аккаунт был удален на'
    },
    ua: {
      subject: 'Ваш акаунт було видалено - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Ваш акаунт було успішно видалено.',
      deletedAt: 'Видалення завершено',
      whatWasDeleted: 'Наступні дані були безповоротно видалені:',
      dataList: '• Інформація про акаунт та профіль<br>• Реєстрації на турніри<br>• Історія матчів та статистика<br>• Всі особисті дані',
      finalMessage: 'Нам шкода, що ви йдете. Якщо ви передумаєте, ви завжди можете створити новий акаунт.',
      footer: 'Дякуємо, що були частиною PadelO₂',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що ваш акаунт було видалено на'
    },
    es: {
      subject: 'Tu cuenta ha sido eliminada - PadelO₂',
      greeting: 'Hola',
      message: 'Tu cuenta ha sido eliminada exitosamente.',
      deletedAt: 'Eliminación completada el',
      whatWasDeleted: 'Los siguientes datos han sido eliminados permanentemente:',
      dataList: '• Información de cuenta y perfil<br>• Inscripciones a torneos<br>• Historial de partidos y estadísticas<br>• Todos los datos personales',
      finalMessage: 'Lamentamos verte ir. Si cambias de opinión, siempre puedes crear una nueva cuenta.',
      footer: 'Gracias por ser parte de PadelO₂',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque tu cuenta fue eliminada el'
    },
    fr: {
      subject: 'Votre compte a été supprimé - PadelO₂',
      greeting: 'Bonjour',
      message: 'Votre compte a été supprimé avec succès.',
      deletedAt: 'Suppression terminée le',
      whatWasDeleted: 'Les données suivantes ont été supprimées de façon permanente:',
      dataList: '• Informations de compte et profil<br>• Inscriptions aux tournois<br>• Historique des matchs et statistiques<br>• Toutes les données personnelles',
      finalMessage: 'Nous sommes désolés de vous voir partir. Si vous changez d\'avis, vous pouvez toujours créer un nouveau compte.',
      footer: 'Merci d\'avoir fait partie de PadelO₂',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet e-mail parce que votre compte a été supprimé le'
    },
    de: {
      subject: 'Ihr Konto wurde gelöscht - PadelO₂',
      greeting: 'Hallo',
      message: 'Ihr Konto wurde erfolgreich gelöscht.',
      deletedAt: 'Löschung abgeschlossen am',
      whatWasDeleted: 'Die folgenden Daten wurden dauerhaft entfernt:',
      dataList: '• Kontoinformationen und Profil<br>• Turnieranmeldungen<br>• Spielverlauf und Statistiken<br>• Alle persönlichen Daten',
      finalMessage: 'Es tut uns leid, Sie gehen zu sehen. Wenn Sie Ihre Meinung ändern, können Sie jederzeit ein neues Konto erstellen.',
      footer: 'Vielen Dank, dass Sie Teil von PadelO₂ waren',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Ihr Konto am'
    },
    it: {
      subject: 'Il tuo account è stato eliminato - PadelO₂',
      greeting: 'Ciao',
      message: 'Il tuo account è stato eliminato con successo.',
      deletedAt: 'Eliminazione completata il',
      whatWasDeleted: 'I seguenti dati sono stati rimossi permanentemente:',
      dataList: '• Informazioni account e profilo<br>• Registrazioni ai tornei<br>• Cronologia partite e statistiche<br>• Tutti i dati personali',
      finalMessage: 'Ci dispiace vederti andare. Se cambi idea, puoi sempre creare un nuovo account.',
      footer: 'Grazie per essere stato parte di PadelO₂',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché il tuo account è stato eliminato il'
    },
    ca: {
      subject: 'El teu compte ha estat eliminat - PadelO₂',
      greeting: 'Hola',
      message: 'El teu compte ha estat eliminat amb èxit.',
      deletedAt: 'Eliminació completada el',
      whatWasDeleted: 'Les dades següents han estat eliminades permanentment:',
      dataList: '• Informació del compte i perfil<br>• Inscripcions a torneigs<br>• Historial de partits i estadístiques<br>• Totes les dades personals',
      finalMessage: 'Ens sap greu veure\'t anar. Si canvies d\'opinió, sempre pots crear un nou compte.',
      footer: 'Gràcies per ser part de PadelO₂',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè el teu compte ha estat eliminat el'
    },
    nl: {
      subject: 'Uw account is verwijderd - PadelO₂',
      greeting: 'Hallo',
      message: 'Uw account is succesvol verwijderd.',
      deletedAt: 'Verwijdering voltooid op',
      whatWasDeleted: 'De volgende gegevens zijn permanent verwijderd:',
      dataList: '• Accountinformatie en profiel<br>• Toernooi-inschrijvingen<br>• Wedstrijdgeschiedenis en statistieken<br>• Alle persoonlijke gegevens',
      finalMessage: 'Het spijt ons je te zien gaan. Als je van gedachten verandert, kun je altijd een nieuw account aanmaken.',
      footer: 'Bedankt dat je deel uitmaakte van PadelO₂',
      team: 'PadelO₂ Team',
      receivingEmail: 'U ontvangt deze e-mail omdat uw account is verwijderd op'
    },
    da: {
      subject: 'Din konto er blevet slettet - PadelO₂',
      greeting: 'Hej',
      message: 'Din konto er blevet slettet.',
      deletedAt: 'Sletning fuldført den',
      whatWasDeleted: 'Følgende data er blevet permanent fjernet:',
      dataList: '• Kontoinformationer og profil<br>• Turneringsregistreringer<br>• Kamp historik og statistikker<br>• Alle personlige data',
      finalMessage: 'Vi er kede af at se dig gå. Hvis du ændrer mening, kan du altid oprette en ny konto.',
      footer: 'Tak for at være en del af PadelO₂',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi din konto blev slettet den'
    },
    sv: {
      subject: 'Ditt konto har tagits bort - PadelO₂',
      greeting: 'Hej',
      message: 'Ditt konto har tagits bort.',
      deletedAt: 'Borttagning slutförd den',
      whatWasDeleted: 'Följande data har tagits bort permanent:',
      dataList: '• Kontoinformation och profil<br>• Turneringsregistreringar<br>• Matchhistorik och statistik<br>• All personlig data',
      finalMessage: 'Vi är ledsna att se dig gå. Om du ångrar dig kan du alltid skapa ett nytt konto.',
      footer: 'Tack för att du var en del av PadelO₂',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom ditt konto togs bort den'
    },
    no: {
      subject: 'Kontoen din er blitt slettet - PadelO₂',
      greeting: 'Hei',
      message: 'Kontoen din er blitt slettet.',
      deletedAt: 'Sletting fullført',
      whatWasDeleted: 'Følgende data er blitt permanent fjernet:',
      dataList: '• Kontoinformasjon og profil<br>• Turneringsregistreringer<br>• Kamp historikk og statistikk<br>• Alle personlige data',
      finalMessage: 'Vi er lei oss for å se deg gå. Hvis du ombestemmer deg, kan du alltid opprette en ny konto.',
      footer: 'Takk for at du var en del av PadelO₂',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi kontoen din ble slettet'
    },
    ar: {
      subject: 'تم حذف حسابك - PadelO₂',
      greeting: 'مرحبا',
      message: 'تم حذف حسابك بنجاح.',
      deletedAt: 'اكتمل الحذف في',
      whatWasDeleted: 'تمت إزالة البيانات التالية بشكل دائم:',
      dataList: '• معلومات الحساب والملف الشخصي<br>• تسجيلات البطولات<br>• سجل المباريات والإحصائيات<br>• جميع البيانات الشخصية',
      finalMessage: 'نحن آسفون لرؤيتك تغادر. إذا غيرت رأيك، يمكنك دائمًا إنشاء حساب جديد.',
      footer: 'شكرًا لكونك جزءًا من PadelO₂',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم حذف حسابك في'
    },
    zh: {
      subject: '您的账户已被删除 - PadelO₂',
      greeting: '您好',
      message: '您的账户已成功删除。',
      deletedAt: '删除完成于',
      whatWasDeleted: '以下数据已被永久删除:',
      dataList: '• 账户信息和配置文件<br>• 锦标赛注册<br>• 比赛历史和统计<br>• 所有个人数据',
      finalMessage: '很遗憾看到您离开。如果您改变主意，您随时可以创建新账户。',
      footer: '感谢您成为 PadelO₂ 的一部分',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您的账户已在'
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
      body { margin: 0; padding: 0; background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%); }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
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
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
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
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${locale === 'ua' ? 'Ласкаво просимо на корт' : locale === 'ru' ? 'Добро пожаловать на корт' : 'Welcome to the court'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
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
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 12px 0;">${t.message}</p>
                      <p class="muted" style="margin: 0 0 20px 0;">${t.deletedAt} <strong>${deletionTime}</strong>.</p>
                      <div class="info-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e;">${t.whatWasDeleted}</p>
                        <p class="muted" style="margin: 0; color: #075985;">${t.dataList}</p>
                      </div>
                      <p class="lead" style="margin: 20px 0 0 0;">${t.finalMessage}</p>
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
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
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


