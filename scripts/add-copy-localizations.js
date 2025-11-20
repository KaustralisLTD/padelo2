const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: { copy: 'Копировать', copied: 'Скопировано!' },
  ua: { copy: 'Копіювати', copied: 'Скопійовано!' },
  es: { copy: 'Copiar', copied: '¡Copiado!' },
  fr: { copy: 'Copier', copied: 'Copié!' },
  de: { copy: 'Kopieren', copied: 'Kopiert!' },
  it: { copy: 'Copia', copied: 'Copiato!' },
  ca: { copy: 'Copiar', copied: 'Copiat!' },
  nl: { copy: 'Kopiëren', copied: 'Gekopieerd!' },
  da: { copy: 'Kopier', copied: 'Kopieret!' },
  sv: { copy: 'Kopiera', copied: 'Kopierat!' },
  no: { copy: 'Kopier', copied: 'Kopiert!' },
  ar: { copy: 'نسخ', copied: 'تم النسخ!' },
  zh: { copy: '复制', copied: '已复制!' }
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
    
    const langTranslations = translations[lang] || { copy: 'Copy', copied: 'Copied!' };
    
    if (!langData.Tournaments.copy) {
      langData.Tournaments.copy = langTranslations.copy;
      modified = true;
      console.log(`✅ Added Tournaments.copy to ${lang}.json`);
    }
    
    if (!langData.Tournaments.copied) {
      langData.Tournaments.copied = langTranslations.copied;
      modified = true;
      console.log(`✅ Added Tournaments.copied to ${lang}.json`);
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

