const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: {
    selectFromParticipants: 'Выбрать из участников',
    selectPartner: 'Выбрать партнера',
    enterManually: 'Ввести вручную'
  },
  ua: {
    selectFromParticipants: 'Обрати з учасників',
    selectPartner: 'Обрати партнера',
    enterManually: 'Ввести вручну'
  },
  es: {
    selectFromParticipants: 'Seleccionar de participantes',
    selectPartner: 'Seleccionar pareja',
    enterManually: 'Ingresar manualmente'
  },
  fr: {
    selectFromParticipants: 'Sélectionner parmi les participants',
    selectPartner: 'Sélectionner un partenaire',
    enterManually: 'Saisir manuellement'
  },
  de: {
    selectFromParticipants: 'Aus Teilnehmern auswählen',
    selectPartner: 'Partner auswählen',
    enterManually: 'Manuell eingeben'
  },
  it: {
    selectFromParticipants: 'Seleziona dai partecipanti',
    selectPartner: 'Seleziona partner',
    enterManually: 'Inserisci manualmente'
  },
  ca: {
    selectFromParticipants: 'Seleccionar de participants',
    selectPartner: 'Seleccionar parella',
    enterManually: 'Introduir manualment'
  },
  nl: {
    selectFromParticipants: 'Selecteren uit deelnemers',
    selectPartner: 'Partner selecteren',
    enterManually: 'Handmatig invoeren'
  },
  da: {
    selectFromParticipants: 'Vælg fra deltagere',
    selectPartner: 'Vælg partner',
    enterManually: 'Indtast manuelt'
  },
  sv: {
    selectFromParticipants: 'Välj från deltagare',
    selectPartner: 'Välj partner',
    enterManually: 'Ange manuellt'
  },
  no: {
    selectFromParticipants: 'Velg fra deltakere',
    selectPartner: 'Velg partner',
    enterManually: 'Skriv inn manuelt'
  },
  ar: {
    selectFromParticipants: 'اختر من المشاركين',
    selectPartner: 'اختر الشريك',
    enterManually: 'أدخل يدوياً'
  },
  zh: {
    selectFromParticipants: '从参与者中选择',
    selectPartner: '选择合作伙伴',
    enterManually: '手动输入'
  }
};

languages.forEach(lang => {
  const langFile = path.join(messagesDir, `${lang}.json`);
  
  if (!fs.existsSync(langFile)) {
    console.log(`⚠️  File ${langFile} does not exist, skipping...`);
    return;
  }
  
  try {
    const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    let modified = false;
    
    if (!langData.Tournaments) {
      langData.Tournaments = {};
    }
    
    const langTranslations = translations[lang] || {};
    
    Object.keys(langTranslations).forEach(key => {
      if (!langData.Tournaments[key]) {
        langData.Tournaments[key] = langTranslations[key];
        modified = true;
        console.log(`✅ Added Tournaments.${key} to ${lang}.json`);
      }
    });
    
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

