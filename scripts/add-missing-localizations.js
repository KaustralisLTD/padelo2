const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const enFile = path.join(messagesDir, 'en.json');

// Читаем en.json как эталон
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// Список языковых файлов (кроме en.json)
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

// Переводы для followUs
const followUsTranslations = {
  ru: 'Подписывайтесь',
  ua: 'Підписуйтесь',
  es: 'Síguenos',
  fr: 'Suivez-nous',
  de: 'Folgen Sie uns',
  it: 'Seguici',
  ca: 'Segueix-nos',
  nl: 'Volg ons',
  da: 'Følg os',
  sv: 'Följ oss',
  no: 'Følg oss',
  ar: 'تابعنا',
  zh: '关注我们'
};

// Функция для добавления недостающих ключей
function addMissingKeys(targetData, sourceData, path = '') {
  let added = false;
  
  for (const key in sourceData) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!targetData[key]) {
      // Если это объект, создаем пустой объект
      if (typeof sourceData[key] === 'object' && !Array.isArray(sourceData[key])) {
        targetData[key] = {};
        added = true;
        // Рекурсивно добавляем вложенные ключи
        addMissingKeys(targetData[key], sourceData[key], currentPath);
      } else {
        // Для примитивных значений используем значение из en.json
        targetData[key] = sourceData[key];
        added = true;
      }
    } else if (typeof sourceData[key] === 'object' && !Array.isArray(sourceData[key]) && typeof targetData[key] === 'object') {
      // Рекурсивно проверяем вложенные объекты
      if (addMissingKeys(targetData[key], sourceData[key], currentPath)) {
        added = true;
      }
    }
  }
  
  return added;
}

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
    
    // Добавляем followUs в Footer, если отсутствует
    if (!langData.Footer || !langData.Footer.followUs) {
      if (!langData.Footer) {
        langData.Footer = {};
      }
      langData.Footer.followUs = followUsTranslations[lang] || 'Follow Us';
      modified = true;
      console.log(`✅ Added Footer.followUs to ${lang}.json`);
    }
    
    // Добавляем недостающие ключи из en.json
    if (addMissingKeys(langData, enData)) {
      modified = true;
      console.log(`✅ Added missing keys to ${lang}.json`);
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

