const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

const translations = {
  ua: {
    error: 'Щось пішло не так!',
    tryAgain: 'Спробувати знову',
    errorLoadingWallet: 'Не вдалося завантажити дані гаманця',
    loading: 'Завантаження гаманця...'
  },
  ru: {
    error: 'Что-то пошло не так!',
    tryAgain: 'Попробовать снова',
    errorLoadingWallet: 'Не удалось загрузить данные кошелька',
    loading: 'Загрузка кошелька...'
  },
  es: {
    error: '¡Algo salió mal!',
    tryAgain: 'Intentar de nuevo',
    errorLoadingWallet: 'Error al cargar los datos de la billetera',
    loading: 'Cargando billetera...'
  },
  fr: {
    error: 'Quelque chose s\'est mal passé!',
    tryAgain: 'Réessayer',
    errorLoadingWallet: 'Échec du chargement des données du portefeuille',
    loading: 'Chargement du portefeuille...'
  },
  de: {
    error: 'Etwas ist schief gelaufen!',
    tryAgain: 'Erneut versuchen',
    errorLoadingWallet: 'Fehler beim Laden der Brieftaschendaten',
    loading: 'Brieftasche wird geladen...'
  },
  it: {
    error: 'Qualcosa è andato storto!',
    tryAgain: 'Riprova',
    errorLoadingWallet: 'Impossibile caricare i dati del portafoglio',
    loading: 'Caricamento portafoglio...'
  },
  ca: {
    error: 'Alguna cosa ha sortit malament!',
    tryAgain: 'Tornar a intentar',
    errorLoadingWallet: 'Error en carregar les dades del moneder',
    loading: 'Carregant moneder...'
  },
  nl: {
    error: 'Er is iets misgegaan!',
    tryAgain: 'Opnieuw proberen',
    errorLoadingWallet: 'Fout bij het laden van portemonneedata',
    loading: 'Portemonnee laden...'
  },
  da: {
    error: 'Noget gik galt!',
    tryAgain: 'Prøv igen',
    errorLoadingWallet: 'Kunne ikke indlæse tegnebogsdata',
    loading: 'Indlæser tegnebog...'
  },
  sv: {
    error: 'Något gick fel!',
    tryAgain: 'Försök igen',
    errorLoadingWallet: 'Kunde inte ladda plånboksdata',
    loading: 'Laddar plånbok...'
  },
  no: {
    error: 'Noe gikk galt!',
    tryAgain: 'Prøv igjen',
    errorLoadingWallet: 'Kunne ikke laste lommebokdata',
    loading: 'Laster lommebok...'
  },
  ar: {
    error: 'حدث خطأ ما!',
    tryAgain: 'حاول مرة أخرى',
    errorLoadingWallet: 'فشل تحميل بيانات المحفظة',
    loading: 'جارٍ تحميل المحفظة...'
  },
  zh: {
    error: '出错了！',
    tryAgain: '重试',
    errorLoadingWallet: '加载钱包数据失败',
    loading: '正在加载钱包...'
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
    
    if (!data.ParticipantWallet) {
      data.ParticipantWallet = {};
    }
    
    if (translations[lang]) {
      data.ParticipantWallet.error = translations[lang].error;
      data.ParticipantWallet.tryAgain = translations[lang].tryAgain;
      data.ParticipantWallet.errorLoadingWallet = translations[lang].errorLoadingWallet;
      data.ParticipantWallet.loading = translations[lang].loading;
    } else if (lang === 'en') {
      // English already has these keys
      if (!data.ParticipantWallet.error) data.ParticipantWallet.error = 'Something went wrong!';
      if (!data.ParticipantWallet.tryAgain) data.ParticipantWallet.tryAgain = 'Try again';
      if (!data.ParticipantWallet.errorLoadingWallet) data.ParticipantWallet.errorLoadingWallet = 'Failed to load wallet data';
      if (!data.ParticipantWallet.loading) data.ParticipantWallet.loading = 'Loading wallet...';
    } else {
      // Fallback to English for other languages
      data.ParticipantWallet.error = data.ParticipantWallet.error || 'Something went wrong!';
      data.ParticipantWallet.tryAgain = data.ParticipantWallet.tryAgain || 'Try again';
      data.ParticipantWallet.errorLoadingWallet = data.ParticipantWallet.errorLoadingWallet || 'Failed to load wallet data';
      data.ParticipantWallet.loading = data.ParticipantWallet.loading || 'Loading wallet...';
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

