const fs = require('fs');
const path = require('path');

const translations = {
  es: 'Gracias por registrarte para',
  fr: 'Merci de vous être inscrit pour',
  de: 'Vielen Dank für Ihre Anmeldung für',
  it: 'Grazie per esserti registrato per',
  ca: 'Gràcies per registrar-te per a',
  nl: 'Bedankt voor uw registratie voor',
  da: 'Tak for din registrering til',
  sv: 'Tack för din registrering för',
  no: 'Takk for din registrering til',
  ar: 'شكرا لتسجيلك في',
  zh: '感谢您注册'
};

const filePath = path.join(__dirname, '../lib/email-templates.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Добавляем thankYouFor для каждого языка
Object.entries(translations).forEach(([lang, translation]) => {
  // Ищем паттерн: lang: { ... thankYou: '...', confirmText: ...
  const pattern = new RegExp(`(\\s+${lang}:\\s*{[^}]*thankYou:\\s*'[^']*',)(\\s+confirmText:)`, 's');
  const replacement = `$1\n      thankYouFor: '${translation}',$2`;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    console.log(`Added thankYouFor for ${lang}`);
  } else {
    console.log(`Pattern not found for ${lang}`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');

