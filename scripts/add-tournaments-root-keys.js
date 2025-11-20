const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const enFile = path.join(messagesDir, 'en.json');

// Читаем en.json как эталон
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// Список языковых файлов (кроме en.json)
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

// Ключи, которые должны быть в корне Tournaments (копируются из Tournaments.bracket)
const keysToCopy = [
  'backToTournaments',
  'participants',
  'totalParticipants',
  'participantOrder',
  'participantUserId',
  'participantName',
  'participantEmail',
  'participantPhone',
  'participantCategory',
  'participantPartner',
  'tshirtSize',
  'paymentStatus',
  'actions',
  'editParticipant',
  'firstName',
  'lastName',
  'telegram',
  'message',
  'partnerInfo',
  'partnerName',
  'partnerEmail',
  'partnerPhone',
  'partnerTshirtSize',
  'cancel',
  'save',
  'edit',
  'paymentPending',
  'paymentPaid',
  'paymentRefunded',
  'loading',
  'noParticipants',
  'participantsLoadError',
  'participantUpdated',
  'participantUpdateError',
  'paymentStatusUpdated',
  'paymentStatusUpdateError',
  'participantCategoryUpdated',
  'participantCategoryUpdateError'
];

// Обрабатываем каждый языковой файл
languages.forEach(lang => {
  const langFile = path.join(messagesDir, `${lang}.json`);
  
  if (!fs.existsSync(langFile)) {
    console.log(`⚠️  File ${langFile} does not exist, skipping...`);
    return;
  }
  
  try {
    const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    let modified = false;
    
    // Убеждаемся, что секция Tournaments существует
    if (!langData.Tournaments) {
      langData.Tournaments = {};
    }
    
    // Копируем ключи из Tournaments.bracket в корень Tournaments
    if (langData.Tournaments.bracket) {
      keysToCopy.forEach(key => {
        if (langData.Tournaments.bracket[key] && !langData.Tournaments[key]) {
          langData.Tournaments[key] = langData.Tournaments.bracket[key];
          modified = true;
          console.log(`✅ Added Tournaments.${key} to ${lang}.json (from bracket)`);
        } else if (enData.Tournaments?.bracket?.[key] && !langData.Tournaments[key]) {
          // Если ключа нет в bracket, используем значение из en.json
          langData.Tournaments[key] = enData.Tournaments.bracket[key];
          modified = true;
          console.log(`✅ Added Tournaments.${key} to ${lang}.json (from en.json)`);
        }
      });
    } else {
      // Если bracket не существует, копируем из en.json
      keysToCopy.forEach(key => {
        if (enData.Tournaments?.bracket?.[key] && !langData.Tournaments[key]) {
          langData.Tournaments[key] = enData.Tournaments.bracket[key];
          modified = true;
          console.log(`✅ Added Tournaments.${key} to ${lang}.json (from en.json)`);
        }
      });
    }
    
    // Сохраняем файл
    if (modified) {
      fs.writeFileSync(langFile, JSON.stringify(langData, null, 2) + '\n', 'utf8');
      console.log(`💾 Saved ${lang}.json`);
    } else {
      console.log(`✓ ${lang}.json is up to date`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${langFile}:`, error.message);
  }
});

console.log('\n✨ Done!');

