const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: { chooseFile: 'Выбрать файл', removeFile: 'Удалить' },
  ua: { chooseFile: 'Обрати файл', removeFile: 'Видалити' },
  es: { chooseFile: 'Elegir archivo', removeFile: 'Eliminar' },
  fr: { chooseFile: 'Choisir un fichier', removeFile: 'Supprimer' },
  de: { chooseFile: 'Datei auswählen', removeFile: 'Entfernen' },
  it: { chooseFile: 'Scegli file', removeFile: 'Rimuovi' },
  ca: { chooseFile: 'Tria fitxer', removeFile: 'Eliminar' },
  nl: { chooseFile: 'Kies bestand', removeFile: 'Verwijderen' },
  da: { chooseFile: 'Vælg fil', removeFile: 'Fjern' },
  sv: { chooseFile: 'Välj fil', removeFile: 'Ta bort' },
  no: { chooseFile: 'Velg fil', removeFile: 'Fjern' },
  ar: { chooseFile: 'اختر الملف', removeFile: 'إزالة' },
  zh: { chooseFile: '选择文件', removeFile: '删除' }
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
    
    if (!langData.Profile) {
      langData.Profile = {};
    }
    
    const langTranslations = translations[lang] || { chooseFile: 'Choose File', removeFile: 'Remove' };
    
    if (!langData.Profile.chooseFile) {
      langData.Profile.chooseFile = langTranslations.chooseFile;
      modified = true;
      console.log(`✅ Added Profile.chooseFile to ${lang}.json`);
    }
    
    if (!langData.Profile.removeFile) {
      langData.Profile.removeFile = langTranslations.removeFile;
      modified = true;
      console.log(`✅ Added Profile.removeFile to ${lang}.json`);
    }
    
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

