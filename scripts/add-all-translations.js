const fs = require('fs');
const path = require('path');

const translations = {
  fr: {
    Profile: {
      title: "Profil",
      description: "Gérez vos informations personnelles et paramètres",
      loading: "Chargement du profil...",
      backToDashboard: "Retour au Tableau de Bord",
      goToParticipantDashboard: "Tableau de Bord Participant",
      logout: "Déconnexion",
      photo: "Photo",
      noPhoto: "Pas de photo",
      photoHint: "Maximum 5MB. Formats JPG, PNG.",
      photoSizeError: "La taille de la photo doit être inférieure à 5MB",
      basicInfo: "Informations de Base",
      contactInfo: "Informations de Contact",
      additionalInfo: "Informations Supplémentaires",
      email: "E-mail",
      role: "Rôle",
      firstName: "Prénom",
      lastName: "Nom",
      phone: "Téléphone",
      telegram: "Telegram",
      dateOfBirth: "Date de Naissance",
      tshirtSize: "Taille de T-shirt",
      selectSize: "Sélectionner la taille",
      save: "Enregistrer les Modifications",
      saving: "Enregistrement...",
      cancel: "Annuler",
      updateSuccess: "Profil mis à jour avec succès!",
      updateError: "Erreur lors de la mise à jour du profil. Veuillez réessayer.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personnel",
        participant: "Participant"
      }
    },
    ParticipantDashboard: {
      title: "Tableau de Bord Participant",
      description: "Voir vos tournois, statistiques et réalisations",
      loading: "Chargement...",
      backToProfile: "Retour au Profil",
      stats: {
        totalTournaments: "Total de Tournois",
        confirmed: "Confirmés",
        upcoming: "À Venir",
        completed: "Terminés"
      },
      myTournaments: "Mes Tournois",
      noTournaments: "Vous ne vous êtes pas encore inscrit à un tournoi.",
      registerForTournament: "S'inscrire au Tournoi",
      dates: "Dates",
      categories: "Catégories",
      confirmedAt: "Confirmé",
      status: {
        pending: "En Attente",
        upcoming: "À Venir",
        inProgress: "En Cours",
        completed: "Terminé"
      },
      categories: {
        male1: "Hommes 1",
        male2: "Hommes 2",
        female1: "Femmes 1",
        female2: "Femmes 2",
        mixed1: "Mixte 1",
        mixed2: "Mixte 2"
      },
      statistics: {
        title: "Statistiques de Jeux",
        comingSoon: "Les statistiques seront bientôt disponibles"
      },
      prizes: {
        title: "Prix & Réalisations",
        comingSoon: "Les prix et réalisations seront affichés ici"
      }
    }
  },
  it: {
    Profile: {
      title: "Profilo",
      description: "Gestisci le tue informazioni personali e impostazioni",
      loading: "Caricamento profilo...",
      backToDashboard: "Torna alla Dashboard",
      goToParticipantDashboard: "Dashboard Partecipante",
      logout: "Esci",
      photo: "Foto",
      noPhoto: "Nessuna foto",
      photoHint: "Massimo 5MB. Formati JPG, PNG.",
      photoSizeError: "La dimensione della foto deve essere inferiore a 5MB",
      basicInfo: "Informazioni di Base",
      contactInfo: "Informazioni di Contatto",
      additionalInfo: "Informazioni Aggiuntive",
      email: "E-mail",
      role: "Ruolo",
      firstName: "Nome",
      lastName: "Cognome",
      phone: "Telefono",
      telegram: "Telegram",
      dateOfBirth: "Data di Nascita",
      tshirtSize: "Taglia T-shirt",
      selectSize: "Seleziona taglia",
      save: "Salva Modifiche",
      saving: "Salvataggio...",
      cancel: "Annulla",
      updateSuccess: "Profilo aggiornato con successo!",
      updateError: "Errore nell'aggiornamento del profilo. Riprova.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personale",
        participant: "Partecipante"
      }
    },
    ParticipantDashboard: {
      title: "Dashboard Partecipante",
      description: "Vedi i tuoi tornei, statistiche e risultati",
      loading: "Caricamento...",
      backToProfile: "Torna al Profilo",
      stats: {
        totalTournaments: "Totale Tornei",
        confirmed: "Confermati",
        upcoming: "In Arrivo",
        completed: "Completati"
      },
      myTournaments: "I Miei Tornei",
      noTournaments: "Non ti sei ancora registrato a nessun torneo.",
      registerForTournament: "Registrati al Torneo",
      dates: "Date",
      categories: "Categorie",
      confirmedAt: "Confermato",
      status: {
        pending: "In Attesa",
        upcoming: "In Arrivo",
        inProgress: "In Corso",
        completed: "Completato"
      },
      categories: {
        male1: "Uomini 1",
        male2: "Uomini 2",
        female1: "Donne 1",
        female2: "Donne 2",
        mixed1: "Misto 1",
        mixed2: "Misto 2"
      },
      statistics: {
        title: "Statistiche di Gioco",
        comingSoon: "Le statistiche saranno presto disponibili"
      },
      prizes: {
        title: "Premi & Risultati",
        comingSoon: "Premi e risultati saranno visualizzati qui"
      }
    }
  },
  nl: {
    Profile: {
      title: "Profiel",
      description: "Beheer je persoonlijke informatie en instellingen",
      loading: "Profiel laden...",
      backToDashboard: "Terug naar Dashboard",
      goToParticipantDashboard: "Deelnemer Dashboard",
      logout: "Uitloggen",
      photo: "Foto",
      noPhoto: "Geen foto",
      photoHint: "Maximaal 5MB. JPG, PNG formaten.",
      photoSizeError: "De fotogrootte moet minder dan 5MB zijn",
      basicInfo: "Basisinformatie",
      contactInfo: "Contactinformatie",
      additionalInfo: "Aanvullende Informatie",
      email: "E-mail",
      role: "Rol",
      firstName: "Voornaam",
      lastName: "Achternaam",
      phone: "Telefoon",
      telegram: "Telegram",
      dateOfBirth: "Geboortedatum",
      tshirtSize: "T-shirt Maat",
      selectSize: "Selecteer maat",
      save: "Wijzigingen Opslaan",
      saving: "Opslaan...",
      cancel: "Annuleren",
      updateSuccess: "Profiel succesvol bijgewerkt!",
      updateError: "Fout bij bijwerken van profiel. Probeer het opnieuw.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personeel",
        participant: "Deelnemer"
      }
    },
    ParticipantDashboard: {
      title: "Deelnemer Dashboard",
      description: "Bekijk je toernooien, statistieken en prestaties",
      loading: "Laden...",
      backToProfile: "Terug naar Profiel",
      stats: {
        totalTournaments: "Totaal Toernooien",
        confirmed: "Bevestigd",
        upcoming: "Aankomend",
        completed: "Voltooid"
      },
      myTournaments: "Mijn Toernooien",
      noTournaments: "Je bent je nog niet ingeschreven voor een toernooi.",
      registerForTournament: "Inschrijven voor Toernooi",
      dates: "Data",
      categories: "Categorieën",
      confirmedAt: "Bevestigd",
      status: {
        pending: "In Afwachting",
        upcoming: "Aankomend",
        inProgress: "Bezig",
        completed: "Voltooid"
      },
      categories: {
        male1: "Heren 1",
        male2: "Heren 2",
        female1: "Dames 1",
        female2: "Dames 2",
        mixed1: "Gemengd 1",
        mixed2: "Gemengd 2"
      },
      statistics: {
        title: "Spelstatistieken",
        comingSoon: "Statistieken zullen binnenkort beschikbaar zijn"
      },
      prizes: {
        title: "Prijzen & Prestaties",
        comingSoon: "Prijzen en prestaties worden hier weergegeven"
      }
    }
  },
  da: {
    Profile: {
      title: "Profil",
      description: "Administrer dine personlige oplysninger og indstillinger",
      loading: "Indlæser profil...",
      backToDashboard: "Tilbage til Dashboard",
      goToParticipantDashboard: "Deltager Dashboard",
      logout: "Log ud",
      photo: "Foto",
      noPhoto: "Intet foto",
      photoHint: "Maksimum 5MB. JPG, PNG formater.",
      photoSizeError: "Fotostørrelsen skal være mindre end 5MB",
      basicInfo: "Grundlæggende Information",
      contactInfo: "Kontaktinformation",
      additionalInfo: "Yderligere Information",
      email: "E-mail",
      role: "Rolle",
      firstName: "Fornavn",
      lastName: "Efternavn",
      phone: "Telefon",
      telegram: "Telegram",
      dateOfBirth: "Fødselsdato",
      tshirtSize: "T-shirt Størrelse",
      selectSize: "Vælg størrelse",
      save: "Gem Ændringer",
      saving: "Gemmer...",
      cancel: "Annuller",
      updateSuccess: "Profil opdateret med succes!",
      updateError: "Fejl ved opdatering af profil. Prøv igen.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personale",
        participant: "Deltager"
      }
    },
    ParticipantDashboard: {
      title: "Deltager Dashboard",
      description: "Se dine turneringer, statistikker og præstationer",
      loading: "Indlæser...",
      backToProfile: "Tilbage til Profil",
      stats: {
        totalTournaments: "Totale Turneringer",
        confirmed: "Bekræftet",
        upcoming: "Kommende",
        completed: "Afsluttet"
      },
      myTournaments: "Mine Turneringer",
      noTournaments: "Du har endnu ikke tilmeldt dig nogen turnering.",
      registerForTournament: "Tilmeld Dig Turnering",
      dates: "Datoer",
      categories: "Kategorier",
      confirmedAt: "Bekræftet",
      status: {
        pending: "Afventer",
        upcoming: "Kommende",
        inProgress: "I Gang",
        completed: "Afsluttet"
      },
      categories: {
        male1: "Herre 1",
        male2: "Herre 2",
        female1: "Dame 1",
        female2: "Dame 2",
        mixed1: "Mixed 1",
        mixed2: "Mixed 2"
      },
      statistics: {
        title: "Spilstatistikker",
        comingSoon: "Statistikker vil snart være tilgængelige"
      },
      prizes: {
        title: "Priser & Præstationer",
        comingSoon: "Priser og præstationer vises her"
      }
    }
  },
  sv: {
    Profile: {
      title: "Profil",
      description: "Hantera din personliga information och inställningar",
      loading: "Laddar profil...",
      backToDashboard: "Tillbaka till Dashboard",
      goToParticipantDashboard: "Deltagare Dashboard",
      logout: "Logga ut",
      photo: "Foto",
      noPhoto: "Inget foto",
      photoHint: "Maximalt 5MB. JPG, PNG format.",
      photoSizeError: "Fotostorleken måste vara mindre än 5MB",
      basicInfo: "Grundinformation",
      contactInfo: "Kontaktinformation",
      additionalInfo: "Ytterligare Information",
      email: "E-post",
      role: "Roll",
      firstName: "Förnamn",
      lastName: "Efternamn",
      phone: "Telefon",
      telegram: "Telegram",
      dateOfBirth: "Födelsedatum",
      tshirtSize: "T-shirt Storlek",
      selectSize: "Välj storlek",
      save: "Spara Ändringar",
      saving: "Sparar...",
      cancel: "Avbryt",
      updateSuccess: "Profil uppdaterad framgångsrikt!",
      updateError: "Misslyckades med att uppdatera profil. Försök igen.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personal",
        participant: "Deltagare"
      }
    },
    ParticipantDashboard: {
      title: "Deltagare Dashboard",
      description: "Se dina turneringar, statistik och prestationer",
      loading: "Laddar...",
      backToProfile: "Tillbaka till Profil",
      stats: {
        totalTournaments: "Totalt Turneringar",
        confirmed: "Bekräftade",
        upcoming: "Kommande",
        completed: "Slutförda"
      },
      myTournaments: "Mina Turneringar",
      noTournaments: "Du har ännu inte registrerat dig för någon turnering.",
      registerForTournament: "Registrera Dig för Turnering",
      dates: "Datum",
      categories: "Kategorier",
      confirmedAt: "Bekräftad",
      status: {
        pending: "Väntar",
        upcoming: "Kommande",
        inProgress: "Pågår",
        completed: "Slutförd"
      },
      categories: {
        male1: "Herrar 1",
        male2: "Herrar 2",
        female1: "Damer 1",
        female2: "Damer 2",
        mixed1: "Mixed 1",
        mixed2: "Mixed 2"
      },
      statistics: {
        title: "Spelstatistik",
        comingSoon: "Statistik kommer snart att vara tillgänglig"
      },
      prizes: {
        title: "Priser & Prestationer",
        comingSoon: "Priser och prestationer visas här"
      }
    }
  },
  no: {
    Profile: {
      title: "Profil",
      description: "Administrer din personlige informasjon og innstillinger",
      loading: "Laster profil...",
      backToDashboard: "Tilbake til Dashboard",
      goToParticipantDashboard: "Deltaker Dashboard",
      logout: "Logg ut",
      photo: "Foto",
      noPhoto: "Ingen foto",
      photoHint: "Maksimum 5MB. JPG, PNG formater.",
      photoSizeError: "Fotostørrelsen må være mindre enn 5MB",
      basicInfo: "Grunnleggende Informasjon",
      contactInfo: "Kontaktinformasjon",
      additionalInfo: "Tilleggsinformasjon",
      email: "E-post",
      role: "Rolle",
      firstName: "Fornavn",
      lastName: "Etternavn",
      phone: "Telefon",
      telegram: "Telegram",
      dateOfBirth: "Fødselsdato",
      tshirtSize: "T-skjorte Størrelse",
      selectSize: "Velg størrelse",
      save: "Lagre Endringer",
      saving: "Lagrer...",
      cancel: "Avbryt",
      updateSuccess: "Profil oppdatert vellykket!",
      updateError: "Kunne ikke oppdatere profil. Prøv igjen.",
      roles: {
        superadmin: "Super Admin",
        staff: "Personale",
        participant: "Deltaker"
      }
    },
    ParticipantDashboard: {
      title: "Deltaker Dashboard",
      description: "Se dine turneringer, statistikk og prestasjoner",
      loading: "Laster...",
      backToProfile: "Tilbake til Profil",
      stats: {
        totalTournaments: "Totale Turneringer",
        confirmed: "Bekreftet",
        upcoming: "Kommende",
        completed: "Fullført"
      },
      myTournaments: "Mine Turneringer",
      noTournaments: "Du har ikke registrert deg for noen turnering ennå.",
      registerForTournament: "Registrer Deg for Turnering",
      dates: "Datoer",
      categories: "Kategorier",
      confirmedAt: "Bekreftet",
      status: {
        pending: "Venter",
        upcoming: "Kommende",
        inProgress: "Pågår",
        completed: "Fullført"
      },
      categories: {
        male1: "Herrer 1",
        male2: "Herrer 2",
        female1: "Damer 1",
        female2: "Damer 2",
        mixed1: "Mixed 1",
        mixed2: "Mixed 2"
      },
      statistics: {
        title: "Spillstatistikk",
        comingSoon: "Statistikk vil snart være tilgjengelig"
      },
      prizes: {
        title: "Premier & Prestasjoner",
        comingSoon: "Premier og prestasjoner vises her"
      }
    }
  },
  zh: {
    Profile: {
      title: "个人资料",
      description: "管理您的个人信息和设置",
      loading: "加载个人资料...",
      backToDashboard: "返回仪表板",
      goToParticipantDashboard: "参与者仪表板",
      logout: "退出登录",
      photo: "照片",
      noPhoto: "无照片",
      photoHint: "最大 5MB。JPG、PNG 格式。",
      photoSizeError: "照片大小必须小于 5MB",
      basicInfo: "基本信息",
      contactInfo: "联系信息",
      additionalInfo: "附加信息",
      email: "电子邮件",
      role: "角色",
      firstName: "名",
      lastName: "姓",
      phone: "电话",
      telegram: "Telegram",
      dateOfBirth: "出生日期",
      tshirtSize: "T恤尺寸",
      selectSize: "选择尺寸",
      save: "保存更改",
      saving: "保存中...",
      cancel: "取消",
      updateSuccess: "个人资料更新成功！",
      updateError: "更新个人资料失败。请重试。",
      roles: {
        superadmin: "超级管理员",
        staff: "员工",
        participant: "参与者"
      }
    },
    ParticipantDashboard: {
      title: "参与者仪表板",
      description: "查看您的锦标赛、统计数据和成就",
      loading: "加载中...",
      backToProfile: "返回个人资料",
      stats: {
        totalTournaments: "总锦标赛数",
        confirmed: "已确认",
        upcoming: "即将举行",
        completed: "已完成"
      },
      myTournaments: "我的锦标赛",
      noTournaments: "您尚未注册任何锦标赛。",
      registerForTournament: "注册锦标赛",
      dates: "日期",
      categories: "类别",
      confirmedAt: "已确认",
      status: {
        pending: "待处理",
        upcoming: "即将举行",
        inProgress: "进行中",
        completed: "已完成"
      },
      categories: {
        male1: "男子 1",
        male2: "男子 2",
        female1: "女子 1",
        female2: "女子 2",
        mixed1: "混合 1",
        mixed2: "混合 2"
      },
      statistics: {
        title: "游戏统计",
        comingSoon: "统计数据将很快可用"
      },
      prizes: {
        title: "奖品与成就",
        comingSoon: "奖品和成就将显示在这里"
      }
    }
  },
  ar: {
    Profile: {
      title: "الملف الشخصي",
      description: "إدارة معلوماتك الشخصية والإعدادات",
      loading: "جاري تحميل الملف الشخصي...",
      backToDashboard: "العودة إلى لوحة التحكم",
      goToParticipantDashboard: "لوحة تحكم المشارك",
      logout: "تسجيل الخروج",
      photo: "صورة",
      noPhoto: "لا توجد صورة",
      photoHint: "الحد الأقصى 5MB. صيغ JPG، PNG.",
      photoSizeError: "يجب أن يكون حجم الصورة أقل من 5MB",
      basicInfo: "المعلومات الأساسية",
      contactInfo: "معلومات الاتصال",
      additionalInfo: "معلومات إضافية",
      email: "البريد الإلكتروني",
      role: "الدور",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      phone: "الهاتف",
      telegram: "Telegram",
      dateOfBirth: "تاريخ الميلاد",
      tshirtSize: "مقاس القميص",
      selectSize: "اختر المقاس",
      save: "حفظ التغييرات",
      saving: "جاري الحفظ...",
      cancel: "إلغاء",
      updateSuccess: "تم تحديث الملف الشخصي بنجاح!",
      updateError: "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.",
      roles: {
        superadmin: "المدير العام",
        staff: "الموظفون",
        participant: "المشارك"
      }
    },
    ParticipantDashboard: {
      title: "لوحة تحكم المشارك",
      description: "عرض بطولاتك وإحصائياتك وإنجازاتك",
      loading: "جاري التحميل...",
      backToProfile: "العودة إلى الملف الشخصي",
      stats: {
        totalTournaments: "إجمالي البطولات",
        confirmed: "مؤكد",
        upcoming: "قادمة",
        completed: "مكتملة"
      },
      myTournaments: "بطولاتي",
      noTournaments: "لم تسجل بعد في أي بطولة.",
      registerForTournament: "التسجيل في البطولة",
      dates: "التواريخ",
      categories: "الفئات",
      confirmedAt: "مؤكد",
      status: {
        pending: "قيد الانتظار",
        upcoming: "قادمة",
        inProgress: "قيد التنفيذ",
        completed: "مكتملة"
      },
      categories: {
        male1: "رجال 1",
        male2: "رجال 2",
        female1: "نساء 1",
        female2: "نساء 2",
        mixed1: "مختلط 1",
        mixed2: "مختلط 2"
      },
      statistics: {
        title: "إحصائيات الألعاب",
        comingSoon: "ستكون الإحصائيات متاحة قريباً"
      },
      prizes: {
        title: "الجوائز والإنجازات",
        comingSoon: "ستعرض الجوائز والإنجازات هنا"
      }
    }
  }
};

// Add translations to each file
Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'messages', `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.Profile = translations[lang].Profile;
    data.ParticipantDashboard = translations[lang].ParticipantDashboard;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Added translations to ${lang}.json`);
  } else {
    console.log(`⚠️  File ${lang}.json not found`);
  }
});

console.log('\n✅ All translations added!');

