// SEO metadata for all pages and languages
// Title: ≤60 chars, Description: 140-160 chars, Brand: | PadelO₂

export const seoData: Record<string, Record<string, { title: string; description: string; h1: string }>> = {
  // Home page
  '/': {
    en: {
      title: 'PadelO₂ — AI Training, Courts, Academy & Tournaments',
      description: 'The padel ecosystem: AI-powered training machines, pro court construction, academy and global tournaments. Breathe and play with PadelO₂.',
      h1: 'PadelO₂: The Padel Ecosystem',
    },
    es: {
      title: 'PadelO₂ — Máquinas con IA, Pistas, Academia y Torneos',
      description: 'Ecosistema de pádel: máquinas de entrenamiento con IA, construcción de pistas, academia y torneos globales. Respira y juega con PadelO₂.',
      h1: 'PadelO₂: Ecosistema de Pádel',
    },
    ua: {
      title: 'PadelO₂ — Машини з ШІ, Корти, Академія та Турніри',
      description: 'Екосистема падел: тренувальні машини з ШІ, будівництво кортів, академія та турніри. Дихай і грай з PadelO₂.',
      h1: 'PadelO₂: Екосистема Падел',
    },
    ru: {
      title: 'PadelO₂ — Машины с ИИ, Корты, Академия и Турниры',
      description: 'Экосистема падел: тренажёрные машины с ИИ, строительство кортов, академия и турниры. Дыши и играй с PadelO₂.',
      h1: 'PadelO₂: Экосистема Падел',
    },
    ca: {
      title: 'PadelO₂ — Màquines amb IA, Pistes, Acadèmia i Tornejos',
      description: 'Ecosistema de pàdel: màquines d\'entrenament amb IA, construcció de pistes, acadèmia i tornejos globals. Respira i juga amb PadelO₂.',
      h1: 'PadelO₂: Ecosistema de Pàdel',
    },
    de: {
      title: 'PadelO₂ — KI-Trainer, Courts, Academy & Turniere',
      description: 'Padel-Ökosystem: KI-gestützte Ballmaschinen, Court-Bau, Academy und globale Turniere. Atme & spiele mit PadelO₂.',
      h1: 'PadelO₂: Das Padel-Ökosystem',
    },
    fr: {
      title: 'PadelO₂ — Machines IA, Terrains, Académie & Tournois',
      description: 'Écosystème du padel: machines d\'entraînement IA, construction de terrains, académie et tournois. Respirez & jouez avec PadelO₂.',
      h1: 'PadelO₂: Écosystème du Padel',
    },
    it: {
      title: 'PadelO₂ — Macchine IA, Campi, Accademia & Tornei',
      description: 'Ecosistema padel: macchine con IA, costruzione campi, accademia e tornei globali. Respira e gioca con PadelO₂.',
      h1: 'PadelO₂: Ecosistema Padel',
    },
    nl: {
      title: 'PadelO₂ — AI-machines, Courts, Academy & Toernooien',
      description: 'Padel-ecosysteem: AI-trainingsmachines, court-bouw, academy en wereldwijde toernooien. Adem & speel met PadelO₂.',
      h1: 'PadelO₂: Het Padel-Ecosysteem',
    },
    da: {
      title: 'PadelO₂ — AI-træningsmaskiner, Baner, Akademi & Turneringer',
      description: 'Padel-økosystem: AI-drevne maskiner, baneopbygning, akademi og turneringer. Træk vejret & spil med PadelO₂.',
      h1: 'PadelO₂: Padel-økosystemet',
    },
    sv: {
      title: 'PadelO₂ — AI-träningsmaskiner, Banor, Academy & Tävlingar',
      description: 'Padel-ekosystem: AI-drivna bollmaskiner, banbygge, academy och globala tävlingar. Andas & spela med PadelO₂.',
      h1: 'PadelO₂: Padel-ekosystemet',
    },
    no: {
      title: 'PadelO₂ — AI-treningsmaskiner, Baner, Akademi & Turneringer',
      description: 'Padel-økosystem: AI-drevne ballmaskiner, banebygging, akademi og turneringer. Pust og spill med PadelO₂.',
      h1: 'PadelO₂: Padel-økosystemet',
    },
    zh: {
      title: 'PadelO₂ — AI 训练机器、球场建设、学院与赛事',
      description: 'Padel 全栈生态：AI 训练发球机、专业球场建设、学院课程与全球赛事。与 PadelO₂ 一起呼吸并开赛。',
      h1: 'PadelO₂：Padel 生态',
    },
    ar: {
      title: 'PadelO₂ — آلات تدريب بالذكاء الاصطناعي، ملاعب، أكاديمية وبطولات',
      description: 'منظومة بادل متكاملة: آلات تدريب ذكية، إنشاء الملاعب، الأكاديمية والبطولات العالمية. تنفّس والعب مع PadelO₂.',
      h1: 'منظومة بادل PadelO₂',
    },
  },
  // Academy
  '/academy': {
    en: {
      title: 'Padel Academy — Programs for Players & Coach Certification',
      description: 'Comprehensive padel programs: player pathways, coach certification, drills, analytics. Train smarter with PadelO₂ Academy.',
      h1: 'PadelO₂ Academy',
    },
    es: {
      title: 'Academia de Pádel — Programas y Certificación de Entrenadores',
      description: 'Programas completos: rutas para jugadores, certificación de coaches, drills y analítica. Entrena mejor con PadelO₂.',
      h1: 'Academia PadelO₂',
    },
    ua: {
      title: 'Академія Падел — Програми та Сертифікація Тренерів',
      description: 'Повні програми: підготовка гравців, сертифікація тренерів, дрилі, аналітика. Тренуйся розумніше.',
      h1: 'Академія PadelO₂',
    },
    ru: {
      title: 'Академия Падел — Программы и Сертификация Тренеров',
      description: 'Полные программы: путь игрока, сертификация тренеров, дриллы и аналитика. Тренируйся умнее.',
      h1: 'Академия PadelO₂',
    },
    ca: {
      title: 'Acadèmia de Pàdel — Programes i Certificació d\'Entrenadors',
      description: 'Programes complets: itineraris de jugadors, certificació de coaches, drills i analítica.',
      h1: 'Acadèmia PadelO₂',
    },
    de: {
      title: 'Padel Academy — Programme & Coach-Zertifizierung',
      description: 'Vollständige Programme: Spielerpfade, Trainer-Zertifizierung, Drills und Analytics.',
      h1: 'PadelO₂ Academy',
    },
    fr: {
      title: 'Académie de Padel — Programmes & Certification Coach',
      description: 'Parcours joueurs, certification entraîneurs, drills et analytics.',
      h1: 'Académie PadelO₂',
    },
    it: {
      title: 'Accademia di Padel — Programmi & Certificazione Coach',
      description: 'Percorsi giocatore, certificazione allenatori, drills e analytics.',
      h1: 'Accademia PadelO₂',
    },
    nl: {
      title: 'Padel Academy — Programma\'s & Coachcertificering',
      description: 'Spelersroutes, coachcertificering, drills en analytics.',
      h1: 'PadelO₂ Academy',
    },
    da: {
      title: 'Padel Akademi — Programmer & Trænercertificering',
      description: 'Spillerforløb, certificering, drills og analytics.',
      h1: 'PadelO₂ Akademi',
    },
    sv: {
      title: 'Padel Academy — Program & Tränarcertifiering',
      description: 'Spelarvägar, coachcertifiering, drills och analys.',
      h1: 'PadelO₂ Academy',
    },
    no: {
      title: 'Padel Akademi — Programmer & Trener-sertifisering',
      description: 'Spillerløp, sertifisering, drills og analyse.',
      h1: 'PadelO₂ Akademi',
    },
    zh: {
      title: 'Padel 学院 — 选手培养与教练认证',
      description: '完整课程：选手路径、教练认证、训练与数据分析。',
      h1: 'PadelO₂ 学院',
    },
    ar: {
      title: 'أكاديمية البادل — برامج وتوثيق المدربين',
      description: 'مسارات للاعبين، اعتماد المدربين، تدريبات وتحليلات بيانات.',
      h1: 'أكاديمية PadelO₂',
    },
  },
  // AI Machines
  '/machines': {
    en: {
      title: 'AI Padel Training Machines — App-Controlled Drills & Analytics',
      description: 'Smart padel ball machines with AI patterns, spin/speed control, coaching app and IoT. Buy or rent with PadelO₂.',
      h1: 'AI-Powered Padel Machines',
    },
    es: {
      title: 'Máquinas de Pádel con IA — Drills y Analítica por App',
      description: 'Lanzapelotas inteligentes: patrones con IA, control de efecto/velocidad, app y IoT. Compra o alquiler con PadelO₂.',
      h1: 'Máquinas de Pádel con IA',
    },
    ua: {
      title: 'Машини Падел з ШІ — Дрилли та Аналітика в Додатку',
      description: 'Розумні пускові машини: патерни з ШІ, контроль спіну/швидкості, додаток та IoT. Купівля або оренда.',
      h1: 'Машини Падел з ШІ',
    },
    ru: {
      title: 'Машины Падел с ИИ — Дриллы и Аналитика в Приложении',
      description: 'Умные подающие: паттерны с ИИ, спин/скорость, приложение и IoT. Покупка или аренда с PadelO₂.',
      h1: 'Машины Падел с ИИ',
    },
    ca: {
      title: 'Màquines de Pàdel amb IA — Drills i Analítica per App',
      description: 'Llançadores intel·ligents: patrons amb IA, control d\'efecte/velocitat, app i IoT. Compra o lloga.',
      h1: 'Màquines de Pàdel amb IA',
    },
    de: {
      title: 'KI-Padelmaschinen — App-Drills & Analytics',
      description: 'Smarte Ballmaschinen mit KI-Mustern, Spin/Speed-Kontrolle, App & IoT. Kauf oder Miete.',
      h1: 'KI-Padelmaschinen',
    },
    fr: {
      title: 'Machines de Padel avec IA — Drills & Analytique par App',
      description: 'Lances-balles intelligentes: modèles IA, contrôle effet/vitesse, app & IoT.',
      h1: 'Machines de Padel avec IA',
    },
    it: {
      title: 'Macchine di Padel con IA — Drills & Analitica via App',
      description: 'Lanciapalle smart: pattern IA, controllo spin/velocità, app e IoT.',
      h1: 'Macchine di Padel con IA',
    },
    nl: {
      title: 'AI-Padelmachines — App-Drills & Analytics',
      description: 'Slimme ballenmachines met AI-patronen, spin/snelheid, app & IoT.',
      h1: 'AI-Padelmachines',
    },
    da: {
      title: 'AI-Padelmaskiner — App-Drills & Analyse',
      description: 'Smarte boldmaskiner med AI-mønstre, spin/hastighed, app & IoT.',
      h1: 'AI-Padelmaskiner',
    },
    sv: {
      title: 'AI-Padelmaskiner — App-drills & Analys',
      description: 'Smarta bollmaskiner: IA-mönster, spinn/hastighet, app & IoT.',
      h1: 'AI-Padelmaskiner',
    },
    no: {
      title: 'AI-Padelmaskiner — App-drills & Analyse',
      description: 'Smarte ballmaskiner: KI-mønstre, spinn/fart, app & IoT.',
      h1: 'AI-Padelmaskiner',
    },
    zh: {
      title: 'AI Padel 训练机 — App 控制训练与分析',
      description: '智能发球机：AI 模式、旋转/速度控制、App 与 IoT。支持购买或租赁。',
      h1: 'AI 驱动的 Padel 训练机',
    },
    ar: {
      title: 'آلات بادل بالذكاء الاصطناعي — تدريبات وتحليلات عبر التطبيق',
      description: 'آلات إطلاق ذكية بأنماط AI، تحكم بالدوران والسرعة، تطبيق وIoT. شراء أو تأجير.',
      h1: 'آلات بادل مدعومة بالذكاء الاصطناعي',
    },
  },
  // Courts
  '/courts': {
    en: {
      title: 'Padel Court Construction — Indoor, Outdoor & Panoramic',
      description: 'Turnkey padel courts: indoor/outdoor, panoramic glass, foundations, lighting & maintenance. Global delivery by PadelO₂.',
      h1: 'Padel Court Construction',
    },
    es: {
      title: 'Construcción de Pistas de Pádel — Indoor, Outdoor y Panorámicas',
      description: 'Pistas llave en mano: indoor/outdoor, vidrio panorámico, cimentación, iluminación y mantenimiento. PadelO₂.',
      h1: 'Construcción de Pistas de Pádel',
    },
    ua: {
      title: 'Будівництво Кортів Падел — Indoor/Outdoor і Панорамні',
      description: 'Рішення «під ключ»: панорамні скляні корти, фундаменти, освітлення, сервіс. Доставка по світу.',
      h1: 'Будівництво Кортів Падел',
    },
    ru: {
      title: 'Строительство Кортов Падел — Indoor/Outdoor и Панорамные',
      description: '«Под ключ»: панорамное стекло, фундаменты, освещение, сервис и поставка по миру. PadelO₂.',
      h1: 'Строительство Кортов Падел',
    },
    ca: {
      title: 'Construcció de Pistes de Pàdel — Indoor, Outdoor i Panoràmiques',
      description: 'Pistes clau en mà: vidre panoràmic, fonaments, llum i manteniment.',
      h1: 'Construcció de Pistes de Pàdel',
    },
    de: {
      title: 'Padel Court Bau — Indoor, Outdoor & Panoramic',
      description: 'Schlüsselfertige Courts: Panoramaglas, Fundamente, Licht & Service.',
      h1: 'Padel Court Bau',
    },
    fr: {
      title: 'Construction de Terrains de Padel — Indoor, Outdoor & Panoramiques',
      description: 'Projets clés en main: verre panoramique, fondations, éclairage & maintenance.',
      h1: 'Construction de Terrains de Padel',
    },
    it: {
      title: 'Costruzione Campi Padel — Indoor, Outdoor & Panoramici',
      description: 'Progetti chiavi in mano: vetro panoramico, fondazioni, luci & service.',
      h1: 'Costruzione Campi Padel',
    },
    nl: {
      title: 'Padel Court Bouw — Indoor, Outdoor & Panoramic',
      description: 'Turn-key courts: panoramisch glas, fundering, verlichting & onderhoud.',
      h1: 'Padel Court Bouw',
    },
    da: {
      title: 'Padelbaner — Indendørs, Udendørs & Panoramiske',
      description: 'Turnkey-løsninger: panoramaglas, fundamenter, lys og service.',
      h1: 'Opbygning af Padelbaner',
    },
    sv: {
      title: 'Bygge av Padelbanor — Inne, Ute & Panoramiska',
      description: 'Nyckelfärdiga lösningar: panoramaglas, grund, belysning & service.',
      h1: 'Bygge av Padelbanor',
    },
    no: {
      title: 'Bygging av Padelbaner — Innendørs, Utendørs & Panorama',
      description: 'Nøkkelferdige baner: panoramaglass, fundament, lys & service.',
      h1: 'Bygging av Padelbaner',
    },
    zh: {
      title: 'Padel 球场建设 — 室内/室外与全景球场',
      description: '交钥匙工程：全景玻璃、地基、照明与维保，全球交付。',
      h1: 'Padel 球场建设',
    },
    ar: {
      title: 'إنشاء ملاعب بادل — داخلية، خارجية وبانورامية',
      description: 'تنفيذ متكامل: زجاج بانورامي، قواعد، إنارة وصيانة مع تسليم عالمي.',
      h1: 'إنشاء ملاعب بادل',
    },
  },
  // Investments
  '/investments': {
    en: {
      title: 'Joint Investments in Padel — Courts, Tech & Growth',
      description: 'Co-invest with PadelO₂: courts, AI tech and expansion. Transparent terms, ROI models and revenue sharing.',
      h1: 'Joint Investments',
    },
    es: {
      title: 'Inversión Conjunta en Pádel — Pistas y Tecnología',
      description: 'Co-inversión con PadelO₂: pistas, tecnología IA y expansión. Modelos de ROI y reparto de ingresos.',
      h1: 'Inversión Conjunta',
    },
    ua: {
      title: 'Спільні Інвестиції в Падел — Корти та Технології',
      description: 'Співінвестиції з PadelO₂: корти, ШІ-технології, масштабування. Прозорі умови та ROI.',
      h1: 'Спільні Інвестиції',
    },
    ru: {
      title: 'Совместные Инвестиции в Падел — Корты и Технологии',
      description: 'Ко-инвест с PadelO₂: корты, ИИ-технологии, масштабирование. Прозрачные условия и ROI.',
      h1: 'Совместные Инвестиции',
    },
    ca: {
      title: 'Inversió Conjunta en Pàdel — Pistes i Tecnologia',
      description: 'Co-inversió: pistes, tecnologia d\'IA i expansió amb models de ROI i revenue share.',
      h1: 'Inversió Conjunta',
    },
    de: {
      title: 'Co-Investments in Padel — Courts, Tech & Wachstum',
      description: 'Mit PadelO₂ investieren: Courts, KI-Tech, Expansion. Transparente ROI-Modelle.',
      h1: 'Co-Investments',
    },
    fr: {
      title: 'Co-Investissement dans le Padel — Terrains & Tech',
      description: 'Investissez avec PadelO₂: terrains, IA et expansion. ROI transparent.',
      h1: 'Co-Investissement',
    },
    it: {
      title: 'Co-Investimenti nel Padel — Campi & Tecnologia',
      description: 'Co-investi con PadelO₂: campi, IA, crescita. Modelli ROI chiari.',
      h1: 'Co-Investimenti',
    },
    nl: {
      title: 'Co-Investeren in Padel — Courts & Tech',
      description: 'Investeer met PadelO₂: courts, AI-tech en groei. Transparante ROI.',
      h1: 'Co-Investeren',
    },
    da: {
      title: 'Fælles Investering i Padel — Baner & Teknologi',
      description: 'Co-investér med PadelO₂: baner, AI-teknologi, ekspansion.',
      h1: 'Fælles Investering',
    },
    sv: {
      title: 'Saminvestering i Padel — Banor & Teknik',
      description: 'Saminvestera med PadelO₂: banor, AI-teknik, expansion.',
      h1: 'Saminvestering',
    },
    no: {
      title: 'Felles Investering i Padel — Baner & Teknologi',
      description: 'Co-invester med PadelO₂: baner, KI-teknologi og skalering.',
      h1: 'Felles Investering',
    },
    zh: {
      title: '共同投资 Padel — 球场与智能科技',
      description: '与 PadelO₂ 合投：球场、AI 科技与扩张。清晰 ROI 与分成模式。',
      h1: '共同投资',
    },
    ar: {
      title: 'استثمار مشترك في البادل — ملاعب وتقنيات',
      description: 'شارك الاستثمار مع PadelO₂: ملاعب، تقنيات AI، وتوسّع. نماذج عائد شفافة.',
      h1: 'استثمار مشترك',
    },
  },
  // About
  '/about': {
    en: {
      title: 'About PadelO₂ — Innovation in the Padel Ecosystem',
      description: 'We build the future of padel: AI machines, global courts, academy and joint investments. Breathe and play.',
      h1: 'About PadelO₂',
    },
    es: {
      title: 'Sobre PadelO₂ — Innovación en el Ecosistema del Pádel',
      description: 'Creamos el futuro del pádel: máquinas con IA, pistas, academia e inversión conjunta. Respira y juega.',
      h1: 'Sobre PadelO₂',
    },
    ua: {
      title: 'Про PadelO₂ — Інновації в Екосистемі Падел',
      description: 'Будуємо майбутнє падел: ШІ-машини, корти, академія та інвестиції.',
      h1: 'Про PadelO₂',
    },
    ru: {
      title: 'О PadelO₂ — Инновации в Экосистеме Падел',
      description: 'Создаём будущее падел: ИИ-машины, корты, академия и инвестиции.',
      h1: 'О PadelO₂',
    },
    ca: {
      title: 'Sobre PadelO₂ — Innovació en l\'Ecosistema del Pàdel',
      description: 'Futur del pàdel: màquines amb IA, pistes, acadèmia i inversió conjunta.',
      h1: 'Sobre PadelO₂',
    },
    de: {
      title: 'Über PadelO₂ — Innovation im Padel-Ökosystem',
      description: 'Wir bauen die Zukunft des Padels: KI-Maschinen, Courts, Academy & Investments.',
      h1: 'Über PadelO₂',
    },
    fr: {
      title: 'À propos de PadelO₂ — Innovation dans l\'Écosystème',
      description: 'Nous construisons l\'avenir du padel: IA, terrains, académie & investissements.',
      h1: 'À propos de PadelO₂',
    },
    it: {
      title: 'Su PadelO₂ — Innovazione nell\'Ecosistema Padel',
      description: 'Costruiamo il futuro del padel: IA, campi, accademia e investimenti.',
      h1: 'Su PadelO₂',
    },
    nl: {
      title: 'Over PadelO₂ — Innovatie in het Ecosysteem',
      description: 'Wij bouwen aan de toekomst van padel: AI-machines, courts, academy, investeringen.',
      h1: 'Over PadelO₂',
    },
    da: {
      title: 'Om PadelO₂ — Innovation i Padel-økosystemet',
      description: 'Vi skaber fremtiden for padel: AI, baner, akademi og investering.',
      h1: 'Om PadelO₂',
    },
    sv: {
      title: 'Om PadelO₂ — Innovation i Padel-ekosystemet',
      description: 'Vi bygger padelns framtid: AI-maskiner, banor, academy och investeringar.',
      h1: 'Om PadelO₂',
    },
    no: {
      title: 'Om PadelO₂ — Innovasjon i Padel-økosystemet',
      description: 'Vi bygger padelens fremtid: KI-maskiner, baner, akademi og investering.',
      h1: 'Om PadelO₂',
    },
    zh: {
      title: '关于 PadelO₂ — Padel 生态创新',
      description: '打造 Padel 未来：AI 机器、全球球场、学院与联合投资。',
      h1: '关于 PadelO₂',
    },
    ar: {
      title: 'عن PadelO₂ — الابتكار في منظومة البادل',
      description: 'نبني مستقبل البادل: آلات AI، ملاعب عالمية، أكاديمية واستثمارات مشتركة.',
      h1: 'عن PadelO₂',
    },
  },
  // Tournaments
  '/tournaments': {
    en: {
      title: 'Padel Tournaments — Register & Compete Worldwide',
      description: 'Join PadelO₂ tournaments: categories, schedules, live results and registration. Compete globally with the best players.',
      h1: 'Padel Tournaments',
    },
    es: {
      title: 'Torneos de Pádel — Inscripción y Competición Mundial',
      description: 'Únete a los torneos PadelO₂: categorías, calendarios, resultados en vivo e inscripción. Compite globalmente.',
      h1: 'Torneos de Pádel',
    },
    ua: {
      title: 'Турніри Падел — Реєстрація та Участь по Всьому Світу',
      description: 'Приєднуйся до турнірів PadelO₂: категорії, розклади, live-результати та реєстрація. Змагайся глобально.',
      h1: 'Турніри Падел',
    },
    ru: {
      title: 'Турниры Падел — Регистрация и Участие по Всему Миру',
      description: 'Присоединяйся к турнирам PadelO₂: категории, расписания, live-результаты и регистрация. Соревнуйся глобально.',
      h1: 'Турниры Падел',
    },
    ca: {
      title: 'Tornejos de Pàdel — Inscripció i Competició Mundial',
      description: 'Uneix-te als tornejos PadelO₂: categories, calendaris, resultats en directe.',
      h1: 'Tornejos de Pàdel',
    },
    de: {
      title: 'Padel Turniere — Anmeldung & Wettbewerb Weltweit',
      description: 'Nimm an PadelO₂ Turnieren teil: Kategorien, Zeitpläne, Live-Ergebnisse.',
      h1: 'Padel Turniere',
    },
    fr: {
      title: 'Tournois de Padel — Inscription & Compétition Mondiale',
      description: 'Rejoignez les tournois PadelO₂: catégories, calendriers, résultats en direct.',
      h1: 'Tournois de Padel',
    },
    it: {
      title: 'Tornei di Padel — Iscrizione & Competizione Mondiale',
      description: 'Partecipa ai tornei PadelO₂: categorie, calendari, risultati live.',
      h1: 'Tornei di Padel',
    },
    nl: {
      title: 'Padel Toernooien — Inschrijving & Competitie Wereldwijd',
      description: 'Doe mee aan PadelO₂ toernooien: categorieën, schema\'s, live-uitslagen.',
      h1: 'Padel Toernooien',
    },
    da: {
      title: 'Padel Turneringer — Tilmelding & Konkurrence Verden Over',
      description: 'Deltag i PadelO₂ turneringer: kategorier, program, live-resultater.',
      h1: 'Padel Turneringer',
    },
    sv: {
      title: 'Padel Tävlingar — Anmälan & Tävling Världen Över',
      description: 'Delta i PadelO₂ tävlingar: klasser, schema, liveresultat.',
      h1: 'Padel Tävlingar',
    },
    no: {
      title: 'Padel Turneringer — Påmelding & Konkurranse Verden Rundt',
      description: 'Delta i PadelO₂ turneringer: klasser, tidsplan, live-resultater.',
      h1: 'Padel Turneringer',
    },
    zh: {
      title: 'Padel 锦标赛 — 全球注册与竞赛',
      description: '加入 PadelO₂ 锦标赛：组别、赛程、实时成绩与报名。',
      h1: 'Padel 锦标赛',
    },
    ar: {
      title: 'بطولات البادل — التسجيل والمنافسة عالمياً',
      description: 'انضم إلى بطولات PadelO₂: الفئات، الجداول، النتائج المباشرة والتسجيل.',
      h1: 'بطولات البادل',
    },
  },
  // Partners
  '/partners': {
    en: {
      title: 'Partners & Ecosystem — Clubs, Brands & Tech',
      description: 'Join the PadelO₂ ecosystem: clubs, brands and tech partners. Mutual growth, transparency and measurable impact.',
      h1: 'Partners',
    },
    es: {
      title: 'Socios y Ecosistema — Clubs, Marcas y Tecnología',
      description: 'Únete al ecosistema PadelO₂: clubs, marcas y socios tecnológicos. Crecimiento mutuo e impacto.',
      h1: 'Socios',
    },
    ua: {
      title: 'Партнери та Екосистема — Клуби, Бренди та Технології',
      description: 'Приєднуйся до екосистеми PadelO₂: клуби, бренди та технологічні партнери. Взаємне зростання.',
      h1: 'Партнери',
    },
    ru: {
      title: 'Партнёры и Экосистема — Клубы, Бренды и Технологии',
      description: 'Присоединяйся к экосистеме PadelO₂: клубы, бренды и технологические партнёры. Взаимный рост.',
      h1: 'Партнёры',
    },
    ca: {
      title: 'Socis i Ecosistema — Clubs, Marques i Tecnologia',
      description: 'Uneix-te a l\'ecosistema PadelO₂: clubs, marques i partners tecnològics.',
      h1: 'Socis',
    },
    de: {
      title: 'Partner & Ökosystem — Clubs, Marken & Tech',
      description: 'Werde Teil des PadelO₂-Ökosystems: Clubs, Marken, Technologie-Partner.',
      h1: 'Partner',
    },
    fr: {
      title: 'Partenaires & Écosystème — Clubs, Marques & Tech',
      description: 'Rejoignez l\'écosystème PadelO₂: clubs, marques et partenaires tech.',
      h1: 'Partenaires',
    },
    it: {
      title: 'Partner & Ecosistema — Club, Brand & Tech',
      description: 'Unisciti all\'ecosistema PadelO₂: club, brand e partner tecnologici.',
      h1: 'Partner',
    },
    nl: {
      title: 'Partners & Ecosysteem — Clubs, Merken & Tech',
      description: 'Sluit je aan bij het PadelO₂-ecosysteem: clubs, merken en tech-partners.',
      h1: 'Partners',
    },
    da: {
      title: 'Partnere & Økosystem — Klubber, Brands & Tech',
      description: 'Bliv en del af PadelO₂-økosystemet: klubber, brands og tech-partnere.',
      h1: 'Partnere',
    },
    sv: {
      title: 'Partners & Ekosystem — Klubbar, Varumärken & Tech',
      description: 'Gå med i PadelO₂-ekosystemet: klubbar, varumärken och teknikpartners.',
      h1: 'Partners',
    },
    no: {
      title: 'Partnere & Økosystem — Klubber, Merker & Tech',
      description: 'Bli med i PadelO₂-økosystemet: klubber, merker og teknologipartnere.',
      h1: 'Partnere',
    },
    zh: {
      title: '合作伙伴与生态 — 俱乐部、品牌与科技',
      description: '加入 PadelO₂ 生态：俱乐部、品牌与科技伙伴共成长。',
      h1: '合作伙伴',
    },
    ar: {
      title: 'الشركاء والمنظومة — أندية، علامات وتقنية',
      description: 'انضم إلى منظومة PadelO₂: أندية، علامات وشركاء تقنيون.',
      h1: 'الشركاء',
    },
  },
  // Merchandise
  '/merchandise': {
    en: {
      title: 'Tournament Merchandise & Custom Products | PadelO₂',
      description: 'Custom padel tournament merchandise: t-shirts, trophies, medals, accessories. Professional branding and bulk orders for your event.',
      h1: 'Tournament Merchandise & Custom Products',
    },
    es: {
      title: 'Merchandising de Torneos y Productos Personalizados | PadelO₂',
      description: 'Merchandising personalizado para torneos: camisetas, trofeos, medallas, accesorios. Branding profesional y pedidos al por mayor.',
      h1: 'Merchandising de Torneos',
    },
    ua: {
      title: 'Атрибутика Турнірів та Продукція на Замовлення | PadelO₂',
      description: 'Індивідуальна атрибутика для турнірів: футболки, кубки, медалі, аксесуари. Професійний брендинг та оптові замовлення.',
      h1: 'Атрибутика Турнірів',
    },
    ru: {
      title: 'Атрибутика Турниров и Продукция на Заказ | PadelO₂',
      description: 'Индивидуальная атрибутика для турниров: футболки, кубки, медали, аксессуары. Профессиональный брендинг и оптовые заказы.',
      h1: 'Атрибутика Турниров',
    },
    ca: {
      title: 'Merchandising de Tornejos i Productes Personalitzats | PadelO₂',
      description: 'Merchandising personalitzat per tornejos: samarretes, trofeus, medalles, accessoris. Branding professional.',
      h1: 'Merchandising de Tornejos',
    },
    de: {
      title: 'Turnier-Merchandise & Individuelle Produkte | PadelO₂',
      description: 'Individuelles Turnier-Merchandise: T-Shirts, Trophäen, Medaillen, Accessoires. Professionelles Branding.',
      h1: 'Turnier-Merchandise',
    },
    fr: {
      title: 'Merchandising de Tournois & Produits Personnalisés | PadelO₂',
      description: 'Merchandising personnalisé pour tournois: t-shirts, trophées, médailles, accessoires. Branding professionnel.',
      h1: 'Merchandising de Tournois',
    },
    it: {
      title: 'Merchandising Tornei & Prodotti Personalizzati | PadelO₂',
      description: 'Merchandising personalizzato per tornei: magliette, trofei, medaglie, accessori. Branding professionale.',
      h1: 'Merchandising Tornei',
    },
    nl: {
      title: 'Toernooi Merchandise & Aangepaste Producten | PadelO₂',
      description: 'Aangepaste toernooi merchandise: t-shirts, trofeeën, medailles, accessoires. Professionele branding.',
      h1: 'Toernooi Merchandise',
    },
    da: {
      title: 'Turnerings Merchandise & Tilpassede Produkter | PadelO₂',
      description: 'Tilpasset turnerings merchandise: t-shirts, trofæer, medaljer, tilbehør. Professionelt branding.',
      h1: 'Turnerings Merchandise',
    },
    sv: {
      title: 'Tävlings Merchandise & Anpassade Produkter | PadelO₂',
      description: 'Anpassad tävlings merchandise: t-shirts, troféer, medaljer, tillbehör. Professionellt varumärke.',
      h1: 'Tävlings Merchandise',
    },
    no: {
      title: 'Turnerings Merchandise & Tilpassede Produkter | PadelO₂',
      description: 'Tilpasset turnerings merchandise: t-skjorter, troféer, medaljer, tilbehør. Profesjonelt merkevarebygging.',
      h1: 'Turnerings Merchandise',
    },
    zh: {
      title: '赛事周边与定制产品 | PadelO₂',
      description: '定制赛事周边：T恤、奖杯、奖牌、配饰。专业品牌定制与批量订单。',
      h1: '赛事周边产品',
    },
    ar: {
      title: 'منتجات البطولة والمنتجات المخصصة | PadelO₂',
      description: 'منتجات مخصصة للبطولات: قمصان، كؤوس، ميداليات، إكسسوارات. علامة تجارية احترافية.',
      h1: 'منتجات البطولة',
    },
  },
};

// Get SEO data for a specific path and locale
import { locales } from '@/i18n';

function normalizePath(path: string): string {
  if (!path) return '/';

  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const segments = normalizedPath.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as any)) {
    segments.shift();
  }

  normalizedPath = `/${segments.join('/')}`;
  if (normalizedPath === '/') {
    return normalizedPath;
  }

  return normalizedPath.replace(/\/+$/, '') || '/';
}

export function getSEOData(path: string, locale: string) {
  const normalizedPath = normalizePath(path);
  const data = seoData[normalizedPath] || seoData['/'];
  if (!data) return null;
  return data[locale] || data.en || null;
}

