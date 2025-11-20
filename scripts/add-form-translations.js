const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: {
    chooseFile: 'Выбрать файл',
    photoHint: 'Максимум 5МБ. Форматы JPG, PNG.',
    removeFile: 'Удалить'
  },
  ua: {
    chooseFile: 'Обрати файл',
    photoHint: 'Максимум 5МБ. Формати JPG, PNG.',
    removeFile: 'Видалити'
  },
  es: {
    chooseFile: 'Elegir archivo',
    photoHint: 'Máximo 5MB. Formatos JPG, PNG.',
    removeFile: 'Eliminar'
  },
  fr: {
    chooseFile: 'Choisir un fichier',
    photoHint: 'Maximum 5 Mo. Formats JPG, PNG.',
    removeFile: 'Supprimer'
  },
  de: {
    chooseFile: 'Datei auswählen',
    photoHint: 'Maximal 5 MB. Formate JPG, PNG.',
    removeFile: 'Entfernen'
  },
  it: {
    chooseFile: 'Scegli file',
    photoHint: 'Massimo 5 MB. Formati JPG, PNG.',
    removeFile: 'Rimuovi'
  },
  ca: {
    chooseFile: 'Tria fitxer',
    photoHint: 'Màxim 5 MB. Formats JPG, PNG.',
    removeFile: 'Eliminar'
  },
  nl: {
    chooseFile: 'Kies bestand',
    photoHint: 'Maximaal 5 MB. Formaten JPG, PNG.',
    removeFile: 'Verwijderen'
  },
  da: {
    chooseFile: 'Vælg fil',
    photoHint: 'Maksimum 5 MB. Formater JPG, PNG.',
    removeFile: 'Fjern'
  },
  sv: {
    chooseFile: 'Välj fil',
    photoHint: 'Maximalt 5 MB. Format JPG, PNG.',
    removeFile: 'Ta bort'
  },
  no: {
    chooseFile: 'Velg fil',
    photoHint: 'Maksimum 5 MB. Formater JPG, PNG.',
    removeFile: 'Fjern'
  },
  ar: {
    chooseFile: 'اختر الملف',
    photoHint: 'الحد الأقصى 5 ميجابايت. صيغ JPG، PNG.',
    removeFile: 'إزالة'
  },
  zh: {
    chooseFile: '选择文件',
    photoHint: '最大 5MB。格式 JPG、PNG。',
    removeFile: '删除'
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
    if (!langData.Tournaments.form) {
      langData.Tournaments.form = {};
    }
    
    const langTranslations = translations[lang] || {};
    
    Object.keys(langTranslations).forEach(key => {
      if (!langData.Tournaments.form[key]) {
        langData.Tournaments.form[key] = langTranslations[key];
        modified = true;
        console.log(`✅ Added Tournaments.form.${key} to ${lang}.json`);
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

