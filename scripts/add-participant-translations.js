const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

// Новые ключи переводов
const newKeys = {
  ParticipantWallet: {
    title: 'My Wallet',
    description: 'View your balance and transaction history',
    backToDashboard: 'Back to Dashboard',
    balance: 'Balance',
    balanceDescription: 'Your current account balance',
    topUp: 'Top Up',
    topUpDescription: 'Add funds to your account using Revolut or Stripe',
    comingSoon: 'Coming Soon',
    transactions: 'Transaction History',
    noTransactions: 'No transactions yet',
    types: {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      payment: 'Payment',
      refund: 'Refund'
    },
    status: {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed'
    }
  },
  ParticipantSchedule: {
    title: 'My Schedule',
    description: 'View and manage your bookings, trainings, and tournaments',
    createBooking: 'Create Booking',
    backToDashboard: 'Back to Dashboard',
    loading: 'Loading schedule...',
    noBookings: 'No bookings found. Create your first booking!',
    createFirstBooking: 'Create First Booking',
    close: 'Close',
    comingSoon: 'This feature is coming soon. You will be able to book courts, trainings, and AI machine sessions.',
    types: {
      court: 'Court Booking',
      training: 'Training',
      ai_training: 'AI Training',
      tournament: 'Tournament'
    },
    status: {
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled'
    },
    minutes: 'minutes',
    court: 'Court'
  },
  ParticipantResults: {
    title: 'My Results',
    description: 'View your match history and statistics',
    backToDashboard: 'Back to Dashboard',
    loading: 'Loading results...',
    noMatches: 'No matches found yet. Participate in tournaments to see your results here!',
    pair1: 'Pair 1',
    pair2: 'Pair 2',
    court: 'Court',
    statistics: {
      totalMatches: 'Total Matches',
      wins: 'Wins',
      losses: 'Losses',
      winRate: 'Win Rate',
      games: 'Games'
    }
  },
  Dashboard: {
    participant: {
      settings: 'Account Settings',
      settingsDesc: 'Manage your profile and account information',
      wallet: 'Wallet',
      walletDesc: 'View balance and transaction history'
    }
  }
};

// Функция для добавления ключей в JSON файл
function addKeysToFile(filePath, locale) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Добавляем ParticipantWallet
  if (!data.ParticipantWallet) {
    data.ParticipantWallet = {};
  }
  Object.assign(data.ParticipantWallet, newKeys.ParticipantWallet);
  
  // Добавляем ParticipantSchedule
  if (!data.ParticipantSchedule) {
    data.ParticipantSchedule = {};
  }
  Object.assign(data.ParticipantSchedule, newKeys.ParticipantSchedule);
  
  // Добавляем ParticipantResults
  if (!data.ParticipantResults) {
    data.ParticipantResults = {};
  }
  Object.assign(data.ParticipantResults, newKeys.ParticipantResults);
  
  // Добавляем Dashboard.participant
  if (!data.Dashboard) {
    data.Dashboard = {};
  }
  if (!data.Dashboard.participant) {
    data.Dashboard.participant = {};
  }
  Object.assign(data.Dashboard.participant, newKeys.Dashboard.participant);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${locale}.json`);
}

// Переводы для других языков
const translations = {
  ua: {
    ParticipantWallet: {
      title: 'Мій Гаманець',
      description: 'Переглянути баланс та історію транзакцій',
      backToDashboard: 'Повернутися до Панелі',
      balance: 'Баланс',
      balanceDescription: 'Ваш поточний баланс рахунку',
      topUp: 'Поповнити',
      topUpDescription: 'Додати кошти на рахунок через Revolut або Stripe',
      comingSoon: 'Незабаром',
      transactions: 'Історія транзакцій',
      noTransactions: 'Поки що немає транзакцій',
      types: {
        deposit: 'Поповнення',
        withdrawal: 'Виведення',
        payment: 'Оплата',
        refund: 'Повернення'
      },
      status: {
        completed: 'Завершено',
        pending: 'В очікуванні',
        failed: 'Помилка'
      }
    },
    ParticipantSchedule: {
      title: 'Мій Розклад',
      description: 'Переглядайте та керуйте бронюваннями, тренуваннями та турнірами',
      createBooking: 'Створити Бронювання',
      backToDashboard: 'Повернутися до Панелі',
      loading: 'Завантаження розкладу...',
      noBookings: 'Бронювання не знайдено. Створіть перше бронювання!',
      createFirstBooking: 'Створити Перше Бронювання',
      close: 'Закрити',
      comingSoon: 'Ця функція незабаром. Ви зможете бронювати корти, тренування та сесії з AI машинкою.',
      types: {
        court: 'Бронювання Корту',
        training: 'Тренування',
        ai_training: 'Тренування з AI',
        tournament: 'Турнір'
      },
      status: {
        upcoming: 'Майбутнє',
        completed: 'Завершено',
        cancelled: 'Скасовано'
      },
      minutes: 'хвилин',
      court: 'Корт'
    },
    ParticipantResults: {
      title: 'Мої Результати',
      description: 'Переглянути історію матчів та статистику',
      backToDashboard: 'Повернутися до Панелі',
      loading: 'Завантаження результатів...',
      noMatches: 'Матчів поки що немає. Берейте участь у турнірах, щоб побачити свої результати тут!',
      pair1: 'Пара 1',
      pair2: 'Пара 2',
      court: 'Корт',
      statistics: {
        totalMatches: 'Всього Матчів',
        wins: 'Перемоги',
        losses: 'Поразки',
        winRate: 'Відсоток Перемог',
        games: 'Ігри'
      }
    },
    Dashboard: {
      participant: {
        settings: 'Налаштування Акаунту',
        settingsDesc: 'Керувати профілем та інформацією акаунту',
        wallet: 'Гаманець',
        walletDesc: 'Переглянути баланс та історію транзакцій'
      }
    }
  },
  ru: {
    ParticipantWallet: {
      title: 'Мой Кошелек',
      description: 'Просмотреть баланс и историю транзакций',
      backToDashboard: 'Вернуться к Панели',
      balance: 'Баланс',
      balanceDescription: 'Ваш текущий баланс счета',
      topUp: 'Пополнить',
      topUpDescription: 'Добавить средства на счет через Revolut или Stripe',
      comingSoon: 'Скоро',
      transactions: 'История транзакций',
      noTransactions: 'Пока нет транзакций',
      types: {
        deposit: 'Пополнение',
        withdrawal: 'Вывод',
        payment: 'Оплата',
        refund: 'Возврат'
      },
      status: {
        completed: 'Завершено',
        pending: 'В ожидании',
        failed: 'Ошибка'
      }
    },
    ParticipantSchedule: {
      title: 'Мое Расписание',
      description: 'Просматривайте и управляйте бронированиями, тренировками и турнирами',
      createBooking: 'Создать Бронирование',
      backToDashboard: 'Вернуться к Панели',
      loading: 'Загрузка расписания...',
      noBookings: 'Бронирования не найдены. Создайте первое бронирование!',
      createFirstBooking: 'Создать Первое Бронирование',
      close: 'Закрыть',
      comingSoon: 'Эта функция скоро. Вы сможете бронировать корты, тренировки и сессии с AI машинкой.',
      types: {
        court: 'Бронирование Корта',
        training: 'Тренировка',
        ai_training: 'Тренировка с AI',
        tournament: 'Турнир'
      },
      status: {
        upcoming: 'Предстоящее',
        completed: 'Завершено',
        cancelled: 'Отменено'
      },
      minutes: 'минут',
      court: 'Корт'
    },
    ParticipantResults: {
      title: 'Мои Результаты',
      description: 'Просмотреть историю матчей и статистику',
      backToDashboard: 'Вернуться к Панели',
      loading: 'Загрузка результатов...',
      noMatches: 'Матчей пока нет. Участвуйте в турнирах, чтобы увидеть свои результаты здесь!',
      pair1: 'Пара 1',
      pair2: 'Пара 2',
      court: 'Корт',
      statistics: {
        totalMatches: 'Всего Матчей',
        wins: 'Победы',
        losses: 'Поражения',
        winRate: 'Процент Побед',
        games: 'Игры'
      }
    },
    Dashboard: {
      participant: {
        settings: 'Настройки Аккаунта',
        settingsDesc: 'Управлять профилем и информацией аккаунта',
        wallet: 'Кошелек',
        walletDesc: 'Просмотреть баланс и историю транзакций'
      }
    }
  },
  es: {
    ParticipantWallet: {
      title: 'Mi Billetera',
      description: 'Ver tu saldo e historial de transacciones',
      backToDashboard: 'Volver al Panel',
      balance: 'Saldo',
      balanceDescription: 'Tu saldo actual de cuenta',
      topUp: 'Recargar',
      topUpDescription: 'Agregar fondos a tu cuenta usando Revolut o Stripe',
      comingSoon: 'Próximamente',
      transactions: 'Historial de Transacciones',
      noTransactions: 'Aún no hay transacciones',
      types: {
        deposit: 'Depósito',
        withdrawal: 'Retiro',
        payment: 'Pago',
        refund: 'Reembolso'
      },
      status: {
        completed: 'Completado',
        pending: 'Pendiente',
        failed: 'Fallido'
      }
    },
    ParticipantSchedule: {
      title: 'Mi Horario',
      description: 'Ver y gestionar tus reservas, entrenamientos y torneos',
      createBooking: 'Crear Reserva',
      backToDashboard: 'Volver al Panel',
      loading: 'Cargando horario...',
      noBookings: 'No se encontraron reservas. ¡Crea tu primera reserva!',
      createFirstBooking: 'Crear Primera Reserva',
      close: 'Cerrar',
      comingSoon: 'Esta función llegará pronto. Podrás reservar canchas, entrenamientos y sesiones con máquina AI.',
      types: {
        court: 'Reserva de Cancha',
        training: 'Entrenamiento',
        ai_training: 'Entrenamiento con AI',
        tournament: 'Torneo'
      },
      status: {
        upcoming: 'Próximo',
        completed: 'Completado',
        cancelled: 'Cancelado'
      },
      minutes: 'minutos',
      court: 'Cancha'
    },
    ParticipantResults: {
      title: 'Mis Resultados',
      description: 'Ver tu historial de partidos y estadísticas',
      backToDashboard: 'Volver al Panel',
      loading: 'Cargando resultados...',
      noMatches: 'Aún no hay partidos. ¡Participa en torneos para ver tus resultados aquí!',
      pair1: 'Pareja 1',
      pair2: 'Pareja 2',
      court: 'Cancha',
      statistics: {
        totalMatches: 'Total de Partidos',
        wins: 'Victorias',
        losses: 'Derrotas',
        winRate: 'Tasa de Victoria',
        games: 'Juegos'
      }
    },
    Dashboard: {
      participant: {
        settings: 'Configuración de Cuenta',
        settingsDesc: 'Gestionar tu perfil e información de cuenta',
        wallet: 'Billetera',
        walletDesc: 'Ver saldo e historial de transacciones'
      }
    }
  }
};

// Обрабатываем все файлы
const languages = ['en', 'ua', 'ru', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File ${filePath} does not exist, skipping...`);
    return;
  }
  
  try {
    if (translations[lang]) {
      // Используем готовые переводы
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (!data.ParticipantWallet) data.ParticipantWallet = {};
      if (!data.ParticipantSchedule) data.ParticipantSchedule = {};
      if (!data.ParticipantResults) data.ParticipantResults = {};
      if (!data.Dashboard) data.Dashboard = {};
      if (!data.Dashboard.participant) data.Dashboard.participant = {};
      
      Object.assign(data.ParticipantWallet, translations[lang].ParticipantWallet);
      Object.assign(data.ParticipantSchedule, translations[lang].ParticipantSchedule);
      Object.assign(data.ParticipantResults, translations[lang].ParticipantResults);
      Object.assign(data.Dashboard.participant, translations[lang].Dashboard.participant);
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Updated ${lang}.json with translations`);
    } else {
      // Для остальных языков используем английские значения
      addKeysToFile(filePath, lang);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

