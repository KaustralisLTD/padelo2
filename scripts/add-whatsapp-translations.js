const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

const translations = {
  ua: {
    userName: 'Ім\'я',
    userId: 'ID користувача'
  },
  ru: {
    userName: 'Имя',
    userId: 'ID пользователя'
  },
  es: {
    userName: 'Nombre',
    userId: 'ID de usuario'
  },
  fr: {
    userName: 'Nom',
    userId: 'ID utilisateur'
  },
  de: {
    userName: 'Name',
    userId: 'Benutzer-ID'
  },
  it: {
    userName: 'Nome',
    userId: 'ID utente'
  },
  ca: {
    userName: 'Nom',
    userId: 'ID d\'usuari'
  },
  nl: {
    userName: 'Naam',
    userId: 'Gebruikers-ID'
  },
  da: {
    userName: 'Navn',
    userId: 'Bruger-ID'
  },
  sv: {
    userName: 'Namn',
    userId: 'Användar-ID'
  },
  no: {
    userName: 'Navn',
    userId: 'Bruker-ID'
  },
  ar: {
    userName: 'الاسم',
    userId: 'معرف المستخدم'
  },
  zh: {
    userName: '姓名',
    userId: '用户ID'
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
    
    if (!data.WhatsApp) {
      data.WhatsApp = {};
    }
    
    if (translations[lang]) {
      data.WhatsApp.userName = translations[lang].userName;
      data.WhatsApp.userId = translations[lang].userId;
    } else if (lang === 'en') {
      // English already has these keys
      if (!data.WhatsApp.userName) data.WhatsApp.userName = 'Name';
      if (!data.WhatsApp.userId) data.WhatsApp.userId = 'User ID';
    } else {
      // Fallback to English for other languages
      data.WhatsApp.userName = data.WhatsApp.userName || 'Name';
      data.WhatsApp.userId = data.WhatsApp.userId || 'User ID';
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

