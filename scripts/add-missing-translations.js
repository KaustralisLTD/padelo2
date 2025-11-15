const fs = require('fs');
const path = require('path');

const locales = ['es', 'ru', 'ua', 'ca', 'de', 'fr', 'it', 'nl', 'da', 'sv', 'no', 'zh', 'ar'];

// Переводы для bracket
const bracketTranslations = {
  actions: {
    es: 'Acciones', ru: 'Действия', ua: 'Дії', ca: 'Accions', de: 'Aktionen', 
    fr: 'Actions', it: 'Azioni', nl: 'Acties', da: 'Handlinger', sv: 'Åtgärder', 
    no: 'Handlinger', zh: '操作', ar: 'الإجراءات'
  },
  editResult: {
    es: 'Editar Resultado', ru: 'Редактировать результат', ua: 'Редагувати результат', 
    ca: 'Editar Resultat', de: 'Ergebnis bearbeiten', fr: 'Modifier le résultat', 
    it: 'Modifica risultato', nl: 'Resultaat bewerken', da: 'Rediger resultat', 
    sv: 'Redigera resultat', no: 'Rediger resultat', zh: '编辑结果', ar: 'تعديل النتيجة'
  },
  enterResult: {
    es: 'Ingresar Resultado del Partido', ru: 'Ввести результат матча', 
    ua: 'Ввести результат матчу', ca: 'Introduir Resultat del Partit', 
    de: 'Spielergebnis eingeben', fr: 'Entrer le résultat du match', 
    it: 'Inserisci risultato partita', nl: 'Wedstrijdresultaat invoeren', 
    da: 'Indtast matchresultat', sv: 'Ange matchresultat', no: 'Angi matchresultat', 
    zh: '输入比赛结果', ar: 'أدخل نتيجة المباراة'
  },
  pair1Games: {
    es: 'Juegos Par 1', ru: 'Геймы Пары 1', ua: 'Гейми Пари 1', ca: 'Jocs Parella 1', 
    de: 'Spiele Paar 1', fr: 'Jeux Paire 1', it: 'Giochi Coppia 1', nl: 'Games Paar 1', 
    da: 'Spil Par 1', sv: 'Spel Par 1', no: 'Spill Par 1', zh: '对1游戏', ar: 'ألعاب الزوج 1'
  },
  pair2Games: {
    es: 'Juegos Par 2', ru: 'Геймы Пары 2', ua: 'Гейми Пари 2', ca: 'Jocs Parella 2', 
    de: 'Spiele Paar 2', fr: 'Jeux Paire 2', it: 'Giochi Coppia 2', nl: 'Games Paar 2', 
    da: 'Spil Par 2', sv: 'Spel Par 2', no: 'Spill Par 2', zh: '对2游戏', ar: 'ألعاب الزوج 2'
  }
};

// Переводы для правил (ua.json)
const rulesTranslationsUA = {
  payment: {
    title: 'Оплата',
    text: 'Оплата буде здійснена перед першим матчем кожної пари. Можна оплатити карткою або готівкою в головній наметі заходу.'
  },
  gameRules: {
    title: 'Правила гри',
    winner: 'Переможцем матчу стане той, хто першим досягне 9 геймів або набере більше очок за 45 хвилин кожного матчу. З золотим очком. У разі нічиєї 8-8 буде зіграно тай-брейк до 7 очок з різницею в 2.',
    tieBreak: 'Через 45 хвилин пролунає "сирена" (поки звучить сирена, якщо йде розіграш очка, це очко має бути доіграно). У разі нічиєї в геймах, поточний гейм має бути завершено, і якщо в цей момент нічия в геймах без початку наступного гейму, буде зіграно золоте очко для визначення переможця.',
    timeLimit: 'Якщо тай-брейк 8-8 йде, коли минуло 45 хвилин, тай-брейк має бути завершено нормально.',
    semifinals: 'Півфінали та фінали будуть гратися до 2 сетів + супер тай-брейк без обмеження часу.'
  },
  warmup: {
    title: 'Розминка',
    text: 'Намагайтеся розминатися швидко, оскільки це включено в 45 хвилин. Оскільки ви заздалегідь будете знати корти, на яких будете грати, ви можете розминатися поблизу і бути готовими до гри. Використовуйте можливість розім\'ятися, якщо корт, на якому ви граєте, закінчив раніше.'
  },
  results: {
    title: 'Результати',
    text: 'Після закінчення матчу переможець має негайно вказати результат в наметі. Якщо він цього не зробить, очки не будуть зараховані.'
  },
  points: {
    title: 'Система очок',
    win: 'Кожен виграний матч принесе 2 очки, програний - 1 очко.',
    loss: 'У разі нічиєї за очками для кваліфікації в наступний раунд буде враховуватися середній показник (виграні гейми - програні гейми).',
    tiebreaker: 'У разі нічиєї за очками та середнім показником буде враховуватися прямий поєдинок.'
  },
  qualification: {
    title: 'Кваліфікація',
    text: 'Топ-2 з кожної групи проходять (крім Жінки B+, де проходять топ-4). У Жінки B дві найкращі команди, які зайняли перше місце, проходять безпосередньо в півфінали.'
  },
  otherRules: {
    title: 'Інші правила',
    exterior: 'Гра ззовні не дозволена, якщо це не узгоджено заздалегідь обома парами і вони згодні.',
    disputed: 'Під час матчів будь-яке очко, що викликає сумніви у обох сторін, буде переіграно.',
    balls: 'Зміна м\'ячів буде проводитися на нові м\'ячі кожні 4-5 матчів на корт. Фінали з новими м\'ячами.',
    partner: 'Ви не можете змінювати партнера після того, як почався перший матч турніру.',
    media: 'Під час турніру будуть робитися фотографії та відео. Бережучи участь, ви погоджуєтеся на використання цих зображень та відео для будь-яких цілей.'
  }
};

// Переводы для правил (для других языков - используем английский как fallback)
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

locales.forEach(locale => {
  const filePath = `messages/${locale}.json`;
  const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = false;

  // Добавляем недостающие ключи в bracket
  if (!file.Tournaments.bracket.actions) {
    file.Tournaments.bracket.actions = bracketTranslations.actions[locale] || 'Actions';
    updated = true;
  }
  if (!file.Tournaments.bracket.editResult) {
    file.Tournaments.bracket.editResult = bracketTranslations.editResult[locale] || 'Edit Result';
    updated = true;
  }
  if (!file.Tournaments.bracket.enterResult) {
    file.Tournaments.bracket.enterResult = bracketTranslations.enterResult[locale] || 'Enter Match Result';
    updated = true;
  }
  if (!file.Tournaments.bracket.pair1Games) {
    file.Tournaments.bracket.pair1Games = bracketTranslations.pair1Games[locale] || 'Pair 1 Games';
    updated = true;
  }
  if (!file.Tournaments.bracket.pair2Games) {
    file.Tournaments.bracket.pair2Games = bracketTranslations.pair2Games[locale] || 'Pair 2 Games';
    updated = true;
  }

  // Исправляем переводы правил для ua.json
  if (locale === 'ua') {
    if (!file.Tournaments.rules.payment || file.Tournaments.rules.payment.title === 'Payment') {
      file.Tournaments.rules.payment = rulesTranslationsUA.payment;
      updated = true;
    }
    if (!file.Tournaments.rules.gameRules || file.Tournaments.rules.gameRules.title === 'Game Rules') {
      file.Tournaments.rules.gameRules = rulesTranslationsUA.gameRules;
      updated = true;
    }
    if (!file.Tournaments.rules.warmup || file.Tournaments.rules.warmup.title === 'Warm-up') {
      file.Tournaments.rules.warmup = rulesTranslationsUA.warmup;
      updated = true;
    }
    if (!file.Tournaments.rules.results || file.Tournaments.rules.results.title === 'Results') {
      file.Tournaments.rules.results = rulesTranslationsUA.results;
      updated = true;
    }
    if (!file.Tournaments.rules.points || file.Tournaments.rules.points.title === 'Points System') {
      file.Tournaments.rules.points = rulesTranslationsUA.points;
      updated = true;
    }
    if (!file.Tournaments.rules.qualification || file.Tournaments.rules.qualification.title === 'Qualification') {
      file.Tournaments.rules.qualification = rulesTranslationsUA.qualification;
      updated = true;
    }
    if (!file.Tournaments.rules.otherRules || file.Tournaments.rules.otherRules.title === 'Other Rules') {
      file.Tournaments.rules.otherRules = rulesTranslationsUA.otherRules;
      updated = true;
    }
  } else {
    // Для других языков проверяем, есть ли переводы, если нет - используем английский
    if (!file.Tournaments.rules.payment || file.Tournaments.rules.payment.title === 'Payment') {
      file.Tournaments.rules.payment = en.Tournaments.rules.payment;
      updated = true;
    }
    if (!file.Tournaments.rules.gameRules || file.Tournaments.rules.gameRules.title === 'Game Rules') {
      file.Tournaments.rules.gameRules = en.Tournaments.rules.gameRules;
      updated = true;
    }
    if (!file.Tournaments.rules.warmup || file.Tournaments.rules.warmup.title === 'Warm-up') {
      file.Tournaments.rules.warmup = en.Tournaments.rules.warmup;
      updated = true;
    }
    if (!file.Tournaments.rules.results || file.Tournaments.rules.results.title === 'Results') {
      file.Tournaments.rules.results = en.Tournaments.rules.results;
      updated = true;
    }
    if (!file.Tournaments.rules.points || file.Tournaments.rules.points.title === 'Points System') {
      file.Tournaments.rules.points = en.Tournaments.rules.points;
      updated = true;
    }
    if (!file.Tournaments.rules.qualification || file.Tournaments.rules.qualification.title === 'Qualification') {
      file.Tournaments.rules.qualification = en.Tournaments.rules.qualification;
      updated = true;
    }
    if (!file.Tournaments.rules.otherRules || file.Tournaments.rules.otherRules.title === 'Other Rules') {
      file.Tournaments.rules.otherRules = en.Tournaments.rules.otherRules;
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(file, null, 2));
    console.log(`✅ Updated ${locale}.json`);
  } else {
    console.log(`✓ ${locale}.json already up to date`);
  }
});

console.log('\n✅ All translations updated!');

