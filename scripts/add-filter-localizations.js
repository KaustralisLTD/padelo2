const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const translations = {
  ru: {
    search: 'Поиск',
    searchPlaceholder: 'Имя участника или партнера...',
    filterPartner: 'Партнер',
    filterAll: 'Все',
    filterHasPartner: 'С партнером',
    filterNoPartner: 'Без партнера',
    filterCategory: 'Категория',
    clearFilters: 'Сбросить фильтры',
    samePartnerError: 'Один партнер не может быть в разных категориях'
  },
  ua: {
    search: 'Пошук',
    searchPlaceholder: 'Ім\'я учасника або партнера...',
    filterPartner: 'Партнер',
    filterAll: 'Всі',
    filterHasPartner: 'З партнером',
    filterNoPartner: 'Без партнера',
    filterCategory: 'Категорія',
    clearFilters: 'Скинути фільтри',
    samePartnerError: 'Один партнер не може бути в різних категоріях'
  },
  es: {
    search: 'Buscar',
    searchPlaceholder: 'Nombre del participante o pareja...',
    filterPartner: 'Pareja',
    filterAll: 'Todos',
    filterHasPartner: 'Con pareja',
    filterNoPartner: 'Sin pareja',
    filterCategory: 'Categoría',
    clearFilters: 'Limpiar filtros',
    samePartnerError: 'El mismo pareja no puede estar en diferentes categorías'
  },
  fr: {
    search: 'Rechercher',
    searchPlaceholder: 'Nom du participant ou partenaire...',
    filterPartner: 'Partenaire',
    filterAll: 'Tous',
    filterHasPartner: 'Avec partenaire',
    filterNoPartner: 'Sans partenaire',
    filterCategory: 'Catégorie',
    clearFilters: 'Effacer les filtres',
    samePartnerError: 'Le même partenaire ne peut pas être dans différentes catégories'
  },
  de: {
    search: 'Suchen',
    searchPlaceholder: 'Name des Teilnehmers oder Partners...',
    filterPartner: 'Partner',
    filterAll: 'Alle',
    filterHasPartner: 'Mit Partner',
    filterNoPartner: 'Ohne Partner',
    filterCategory: 'Kategorie',
    clearFilters: 'Filter zurücksetzen',
    samePartnerError: 'Derselbe Partner kann nicht in verschiedenen Kategorien sein'
  },
  it: {
    search: 'Cerca',
    searchPlaceholder: 'Nome del partecipante o partner...',
    filterPartner: 'Partner',
    filterAll: 'Tutti',
    filterHasPartner: 'Con partner',
    filterNoPartner: 'Senza partner',
    filterCategory: 'Categoria',
    clearFilters: 'Cancella filtri',
    samePartnerError: 'Lo stesso partner non può essere in diverse categorie'
  },
  ca: {
    search: 'Cercar',
    searchPlaceholder: 'Nom del participant o parella...',
    filterPartner: 'Parella',
    filterAll: 'Tots',
    filterHasPartner: 'Amb parella',
    filterNoPartner: 'Sense parella',
    filterCategory: 'Categoria',
    clearFilters: 'Esborrar filtres',
    samePartnerError: 'La mateixa parella no pot estar en diferents categories'
  },
  nl: {
    search: 'Zoeken',
    searchPlaceholder: 'Naam van deelnemer of partner...',
    filterPartner: 'Partner',
    filterAll: 'Alle',
    filterHasPartner: 'Met partner',
    filterNoPartner: 'Zonder partner',
    filterCategory: 'Categorie',
    clearFilters: 'Filters wissen',
    samePartnerError: 'Dezelfde partner kan niet in verschillende categorieën zijn'
  },
  da: {
    search: 'Søg',
    searchPlaceholder: 'Deltager eller partner navn...',
    filterPartner: 'Partner',
    filterAll: 'Alle',
    filterHasPartner: 'Med partner',
    filterNoPartner: 'Uden partner',
    filterCategory: 'Kategori',
    clearFilters: 'Ryd filtre',
    samePartnerError: 'Den samme partner kan ikke være i forskellige kategorier'
  },
  sv: {
    search: 'Sök',
    searchPlaceholder: 'Deltagare eller partner namn...',
    filterPartner: 'Partner',
    filterAll: 'Alla',
    filterHasPartner: 'Med partner',
    filterNoPartner: 'Utan partner',
    filterCategory: 'Kategori',
    clearFilters: 'Rensa filter',
    samePartnerError: 'Samma partner kan inte vara i olika kategorier'
  },
  no: {
    search: 'Søk',
    searchPlaceholder: 'Deltaker eller partner navn...',
    filterPartner: 'Partner',
    filterAll: 'Alle',
    filterHasPartner: 'Med partner',
    filterNoPartner: 'Uten partner',
    filterCategory: 'Kategori',
    clearFilters: 'Tilbakestill filtre',
    samePartnerError: 'Samme partner kan ikke være i forskjellige kategorier'
  },
  ar: {
    search: 'بحث',
    searchPlaceholder: 'اسم المشارك أو الشريك...',
    filterPartner: 'الشريك',
    filterAll: 'الكل',
    filterHasPartner: 'مع شريك',
    filterNoPartner: 'بدون شريك',
    filterCategory: 'الفئة',
    clearFilters: 'مسح المرشحات',
    samePartnerError: 'لا يمكن أن يكون نفس الشريك في فئات مختلفة'
  },
  zh: {
    search: '搜索',
    searchPlaceholder: '参与者或合作伙伴姓名...',
    filterPartner: '合作伙伴',
    filterAll: '全部',
    filterHasPartner: '有合作伙伴',
    filterNoPartner: '无合作伙伴',
    filterCategory: '类别',
    clearFilters: '清除筛选',
    samePartnerError: '同一合作伙伴不能出现在不同类别中'
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

