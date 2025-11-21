const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

const translations = {
  ua: {
    today: 'Сьогодні',
    time: 'Час',
    searchByName: 'Пошук за ім\'ям',
    sportPadel: 'Падел',
    typeAll: 'Всі типи',
    typeCourt: 'Бронювання корту',
    typeTraining: 'Тренування',
    typeAITraining: 'Тренування з AI',
    typeTournament: 'Турнір',
    upcoming: 'Майбутні',
    late: 'Запізнені',
    noUpcomingBookings: 'Немає майбутніх бронювань',
    upcomingBookingsHint: 'Ваші майбутні бронювання протягом наступних 2 годин з\'являться тут'
  },
  ru: {
    today: 'Сегодня',
    time: 'Время',
    searchByName: 'Поиск по имени',
    sportPadel: 'Падел',
    typeAll: 'Все типы',
    typeCourt: 'Бронирование корта',
    typeTraining: 'Тренировка',
    typeAITraining: 'Тренировка с AI',
    typeTournament: 'Турнир',
    upcoming: 'Предстоящие',
    late: 'Опоздавшие',
    noUpcomingBookings: 'Нет предстоящих бронирований',
    upcomingBookingsHint: 'Ваши предстоящие бронирования в течение следующих 2 часов появятся здесь'
  },
  es: {
    today: 'Hoy',
    time: 'Hora',
    searchByName: 'Buscar por nombre',
    sportPadel: 'Pádel',
    typeAll: 'Todos los tipos',
    typeCourt: 'Reserva de pista',
    typeTraining: 'Entrenamiento',
    typeAITraining: 'Entrenamiento con IA',
    typeTournament: 'Torneo',
    upcoming: 'Próximos',
    late: 'Tardíos',
    noUpcomingBookings: 'No hay reservas próximas',
    upcomingBookingsHint: 'Tus reservas próximas en las próximas 2 horas aparecerán aquí'
  },
  fr: {
    today: 'Aujourd\'hui',
    time: 'Heure',
    searchByName: 'Rechercher par nom',
    sportPadel: 'Padel',
    typeAll: 'Tous les types',
    typeCourt: 'Réservation de court',
    typeTraining: 'Entraînement',
    typeAITraining: 'Entraînement avec IA',
    typeTournament: 'Tournoi',
    upcoming: 'À venir',
    late: 'En retard',
    noUpcomingBookings: 'Aucune réservation à venir',
    upcomingBookingsHint: 'Vos réservations à venir dans les 2 prochaines heures apparaîtront ici'
  },
  de: {
    today: 'Heute',
    time: 'Zeit',
    searchByName: 'Nach Namen suchen',
    sportPadel: 'Padel',
    typeAll: 'Alle Typen',
    typeCourt: 'Platzbuchung',
    typeTraining: 'Training',
    typeAITraining: 'KI-Training',
    typeTournament: 'Turnier',
    upcoming: 'Bevorstehend',
    late: 'Verspätet',
    noUpcomingBookings: 'Keine bevorstehenden Buchungen',
    upcomingBookingsHint: 'Ihre bevorstehenden Buchungen in den nächsten 2 Stunden werden hier angezeigt'
  },
  it: {
    today: 'Oggi',
    time: 'Ora',
    searchByName: 'Cerca per nome',
    sportPadel: 'Padel',
    typeAll: 'Tutti i tipi',
    typeCourt: 'Prenotazione campo',
    typeTraining: 'Allenamento',
    typeAITraining: 'Allenamento con IA',
    typeTournament: 'Torneo',
    upcoming: 'Prossimi',
    late: 'In ritardo',
    noUpcomingBookings: 'Nessuna prenotazione in arrivo',
    upcomingBookingsHint: 'Le tue prossime prenotazioni nelle prossime 2 ore appariranno qui'
  },
  ca: {
    today: 'Avui',
    time: 'Hora',
    searchByName: 'Cercar per nom',
    sportPadel: 'Pàdel',
    typeAll: 'Tots els tipus',
    typeCourt: 'Reserva de pista',
    typeTraining: 'Entrenament',
    typeAITraining: 'Entrenament amb IA',
    typeTournament: 'Torneig',
    upcoming: 'Pròxims',
    late: 'Tardans',
    noUpcomingBookings: 'No hi ha reserves properes',
    upcomingBookingsHint: 'Les teves reserves properes en les properes 2 hores apareixeran aquí'
  },
  nl: {
    today: 'Vandaag',
    time: 'Tijd',
    searchByName: 'Zoeken op naam',
    sportPadel: 'Padel',
    typeAll: 'Alle typen',
    typeCourt: 'Baanreservering',
    typeTraining: 'Training',
    typeAITraining: 'AI-training',
    typeTournament: 'Toernooi',
    upcoming: 'Aankomend',
    late: 'Laat',
    noUpcomingBookings: 'Geen aankomende reserveringen',
    upcomingBookingsHint: 'Uw aankomende reserveringen in de komende 2 uur verschijnen hier'
  },
  da: {
    today: 'I dag',
    time: 'Tid',
    searchByName: 'Søg efter navn',
    sportPadel: 'Padel',
    typeAll: 'Alle typer',
    typeCourt: 'Banebooking',
    typeTraining: 'Træning',
    typeAITraining: 'AI-træning',
    typeTournament: 'Turnering',
    upcoming: 'Kommende',
    late: 'Forsinket',
    noUpcomingBookings: "Ingen kommende bookinger",
    upcomingBookingsHint: 'Dine kommende bookinger i de næste 2 timer vises her'
  },
  sv: {
    today: 'Idag',
    time: 'Tid',
    searchByName: 'Sök efter namn',
    sportPadel: 'Padel',
    typeAll: 'Alla typer',
    typeCourt: 'Bokning av bana',
    typeTraining: 'Träning',
    typeAITraining: 'AI-träning',
    typeTournament: 'Turnering',
    upcoming: 'Kommande',
    late: 'Försenad',
    noUpcomingBookings: 'Inga kommande bokningar',
    upcomingBookingsHint: 'Dina kommande bokningar inom de närmaste 2 timmarna visas här'
  },
  no: {
    today: 'I dag',
    time: 'Tid',
    searchByName: 'Søk etter navn',
    sportPadel: 'Padel',
    typeAll: 'Alle typer',
    typeCourt: 'Banebooking',
    typeTraining: 'Trening',
    typeAITraining: 'AI-trening',
    typeTournament: 'Turnering',
    upcoming: 'Kommende',
    late: 'Forsinket',
    noUpcomingBookings: 'Ingen kommende bookinger',
    upcomingBookingsHint: 'Dine kommende bookinger i de neste 2 timene vises her'
  },
  ar: {
    today: 'اليوم',
    time: 'الوقت',
    searchByName: 'البحث بالاسم',
    sportPadel: 'بادل',
    typeAll: 'جميع الأنواع',
    typeCourt: 'حجز الملعب',
    typeTraining: 'تدريب',
    typeAITraining: 'تدريب بالذكاء الاصطناعي',
    typeTournament: 'بطولة',
    upcoming: 'القادمة',
    late: 'متأخرة',
    noUpcomingBookings: 'لا توجد حجوزات قادمة',
    upcomingBookingsHint: 'ستظهر حجوزاتك القادمة في الساعتين القادمتين هنا'
  },
  zh: {
    today: '今天',
    time: '时间',
    searchByName: '按姓名搜索',
    sportPadel: '板网球',
    typeAll: '所有类型',
    typeCourt: '球场预订',
    typeTraining: '训练',
    typeAITraining: 'AI训练',
    typeTournament: '锦标赛',
    upcoming: '即将到来',
    late: '迟到',
    noUpcomingBookings: '没有即将到来的预订',
    upcomingBookingsHint: '您接下来2小时内的预订将显示在这里'
  }
};

const languages = ['en', 'ua', 'ru', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File ${filePath} does not exist, skipping...`);
    return;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.ParticipantSchedule) {
      data.ParticipantSchedule = {};
    }
    
    if (translations[lang]) {
      Object.assign(data.ParticipantSchedule, translations[lang]);
    } else if (lang === 'en') {
      // English already has these keys
      const defaults = {
        today: 'Today',
        time: 'Time',
        searchByName: 'Search by name',
        sportPadel: 'Padel',
        typeAll: 'All Types',
        typeCourt: 'Court Booking',
        typeTraining: 'Training',
        typeAITraining: 'AI Training',
        typeTournament: 'Tournament',
        upcoming: 'Upcoming',
        late: 'Late',
        noUpcomingBookings: 'No Upcoming Bookings',
        upcomingBookingsHint: 'Your upcoming bookings in next 2 hours will appear here'
      };
      Object.keys(defaults).forEach(key => {
        if (!data.ParticipantSchedule[key]) {
          data.ParticipantSchedule[key] = defaults[key];
        }
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

