const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: {
    partnerForCategory: 'Партнер для',
    userPhoto: 'Ваше фото',
    photoSizeError: 'Размер фото должен быть менее 5МБ',
    partnerRequiredForCategory: 'Партнер обязателен для {category}'
  },
  ua: {
    partnerForCategory: 'Партнер для',
    userPhoto: 'Ваше фото',
    photoSizeError: 'Розмір фото має бути менше 5МБ',
    partnerRequiredForCategory: 'Партнер обов\'язковий для {category}'
  },
  es: {
    partnerForCategory: 'Pareja para',
    userPhoto: 'Tu foto',
    photoSizeError: 'El tamaño de la foto debe ser menor a 5MB',
    partnerRequiredForCategory: 'Se requiere pareja para {category}'
  },
  fr: {
    partnerForCategory: 'Partenaire pour',
    userPhoto: 'Votre photo',
    photoSizeError: 'La taille de la photo doit être inférieure à 5 Mo',
    partnerRequiredForCategory: 'Partenaire requis pour {category}'
  },
  de: {
    partnerForCategory: 'Partner für',
    userPhoto: 'Ihr Foto',
    photoSizeError: 'Die Foto-Größe muss weniger als 5 MB betragen',
    partnerRequiredForCategory: 'Partner erforderlich für {category}'
  },
  it: {
    partnerForCategory: 'Partner per',
    userPhoto: 'La tua foto',
    photoSizeError: 'La dimensione della foto deve essere inferiore a 5 MB',
    partnerRequiredForCategory: 'Partner richiesto per {category}'
  },
  ca: {
    partnerForCategory: 'Parella per',
    userPhoto: 'La teva foto',
    photoSizeError: 'La mida de la foto ha de ser inferior a 5 MB',
    partnerRequiredForCategory: 'Parella requerida per {category}'
  },
  nl: {
    partnerForCategory: 'Partner voor',
    userPhoto: 'Uw foto',
    photoSizeError: 'De foto moet kleiner zijn dan 5 MB',
    partnerRequiredForCategory: 'Partner vereist voor {category}'
  },
  da: {
    partnerForCategory: 'Partner for',
    userPhoto: 'Dit foto',
    photoSizeError: 'Fotoets størrelse skal være mindre end 5 MB',
    partnerRequiredForCategory: 'Partner påkrævet for {category}'
  },
  sv: {
    partnerForCategory: 'Partner för',
    userPhoto: 'Ditt foto',
    photoSizeError: 'Fotots storlek måste vara mindre än 5 MB',
    partnerRequiredForCategory: 'Partner krävs för {category}'
  },
  no: {
    partnerForCategory: 'Partner for',
    userPhoto: 'Ditt foto',
    photoSizeError: 'Fotots størrelse må være mindre enn 5 MB',
    partnerRequiredForCategory: 'Partner påkrevd for {category}'
  },
  ar: {
    partnerForCategory: 'شريك ل',
    userPhoto: 'صورتك',
    photoSizeError: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت',
    partnerRequiredForCategory: 'شريك مطلوب لـ {category}'
  },
  zh: {
    partnerForCategory: '合作伙伴',
    userPhoto: '您的照片',
    photoSizeError: '照片大小必须小于 5MB',
    partnerRequiredForCategory: '{category} 需要合作伙伴'
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

