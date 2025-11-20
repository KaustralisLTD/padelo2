const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const enFile = path.join(messagesDir, 'en.json');

// Читаем en.json как эталон
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// Список языковых файлов (кроме en.json)
const languages = ['ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

// Ключи, которые должны быть в Tournaments.bracket
const requiredKeys = [
  'backToTournaments',
  'participants',
  'totalParticipants',
  'participantOrder',
  'participantUserId',
  'participantName',
  'participantEmail',
  'participantPhone',
  'participantCategory',
  'participantPartner',
  'tshirtSize',
  'paymentStatus',
  'actions',
  'editParticipant',
  'firstName',
  'lastName',
  'telegram',
  'message',
  'partnerInfo',
  'partnerName',
  'partnerEmail',
  'partnerPhone',
  'partnerTshirtSize',
  'cancel',
  'save',
  'paymentPending',
  'paymentPaid',
  'paymentRefunded',
  'edit',
  'loading',
  'noParticipants',
  'participantsLoadError',
  'participantUpdated',
  'participantUpdateError',
  'paymentStatusUpdated',
  'paymentStatusUpdateError',
  'participantCategoryUpdated',
  'participantCategoryUpdateError'
];

// Переводы для ключей (базовые переводы, которые можно улучшить)
const translations = {
  ru: {
    backToTournaments: '← Назад к турнирам',
    participants: 'Участники',
    totalParticipants: 'Всего: {count} участников',
    participantOrder: '№',
    participantUserId: 'ID пользователя',
    participantName: 'Имя',
    participantEmail: 'Email',
    participantPhone: 'Телефон',
    participantCategory: 'Категория',
    participantPartner: 'Партнер',
    tshirtSize: 'Размер футболки',
    paymentStatus: 'Статус оплаты',
    actions: 'Действия',
    editParticipant: 'Редактировать участника',
    firstName: 'Имя',
    lastName: 'Фамилия',
    telegram: 'Telegram',
    message: 'Сообщение',
    partnerInfo: 'Информация о партнере',
    partnerName: 'Имя партнера',
    partnerEmail: 'Email партнера',
    partnerPhone: 'Телефон партнера',
    partnerTshirtSize: 'Размер футболки партнера',
    cancel: 'Отмена',
    save: 'Сохранить',
    paymentPending: 'Ожидает',
    paymentPaid: 'Оплачено',
    paymentRefunded: 'Возвращено',
    edit: 'Редактировать',
    loading: 'Загрузка...',
    noParticipants: 'Участники еще не зарегистрированы.',
    participantsLoadError: 'Не удалось загрузить участников.',
    participantUpdated: 'Участник успешно обновлен.',
    participantUpdateError: 'Не удалось обновить участника.',
    paymentStatusUpdated: 'Статус оплаты успешно обновлен.',
    paymentStatusUpdateError: 'Не удалось обновить статус оплаты.',
    participantCategoryUpdated: 'Категория участника успешно обновлена.',
    participantCategoryUpdateError: 'Не удалось обновить категорию участника.'
  },
  ua: {
    backToTournaments: '← Назад до турнірів',
    participants: 'Учасники',
    totalParticipants: 'Всього: {count} учасників',
    participantOrder: '№',
    participantUserId: 'ID користувача',
    participantName: "Ім'я",
    participantEmail: 'Email',
    participantPhone: 'Телефон',
    participantCategory: 'Категорія',
    participantPartner: 'Партнер',
    tshirtSize: 'Розмір футболки',
    paymentStatus: 'Статус оплати',
    actions: 'Дії',
    editParticipant: 'Редагувати учасника',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    telegram: 'Telegram',
    message: 'Повідомлення',
    partnerInfo: 'Інформація про партнера',
    partnerName: "Ім'я партнера",
    partnerEmail: 'Email партнера',
    partnerPhone: 'Телефон партнера',
    partnerTshirtSize: 'Розмір футболки партнера',
    cancel: 'Скасувати',
    save: 'Зберегти',
    paymentPending: 'Очікує',
    paymentPaid: 'Оплачено',
    paymentRefunded: 'Повернено',
    edit: 'Редагувати',
    loading: 'Завантаження...',
    noParticipants: 'Учасники ще не зареєстровані.',
    participantsLoadError: 'Не вдалося завантажити учасників.',
    participantUpdated: 'Учасника успішно оновлено.',
    participantUpdateError: 'Не вдалося оновити учасника.',
    paymentStatusUpdated: 'Статус оплати успішно оновлено.',
    paymentStatusUpdateError: 'Не вдалося оновити статус оплати.',
    participantCategoryUpdated: 'Категорію учасника успішно оновлено.',
    participantCategoryUpdateError: 'Не вдалося оновити категорію учасника.'
  },
  es: {
    backToTournaments: '← Volver a Torneos',
    participants: 'Participantes',
    totalParticipants: 'Total: {count} participantes',
    participantOrder: 'Nº',
    participantUserId: 'ID de Usuario',
    participantName: 'Nombre',
    participantEmail: 'Email',
    participantPhone: 'Teléfono',
    participantCategory: 'Categoría',
    participantPartner: 'Pareja',
    tshirtSize: 'Talla de Camiseta',
    paymentStatus: 'Estado de Pago',
    actions: 'Acciones',
    editParticipant: 'Editar Participante',
    firstName: 'Nombre',
    lastName: 'Apellido',
    telegram: 'Telegram',
    message: 'Mensaje',
    partnerInfo: 'Información de Pareja',
    partnerName: 'Nombre de Pareja',
    partnerEmail: 'Email de Pareja',
    partnerPhone: 'Teléfono de Pareja',
    partnerTshirtSize: 'Talla de Camiseta de Pareja',
    cancel: 'Cancelar',
    save: 'Guardar',
    paymentPending: 'Pendiente',
    paymentPaid: 'Pagado',
    paymentRefunded: 'Reembolsado',
    edit: 'Editar',
    loading: 'Cargando...',
    noParticipants: 'Aún no hay participantes registrados.',
    participantsLoadError: 'Error al cargar participantes.',
    participantUpdated: 'Participante actualizado exitosamente.',
    participantUpdateError: 'Error al actualizar participante.',
    paymentStatusUpdated: 'Estado de pago actualizado exitosamente.',
    paymentStatusUpdateError: 'Error al actualizar estado de pago.',
    participantCategoryUpdated: 'Categoría de participante actualizada exitosamente.',
    participantCategoryUpdateError: 'Error al actualizar categoría de participante.'
  },
  fr: {
    backToTournaments: '← Retour aux Tournois',
    participants: 'Participants',
    totalParticipants: 'Total: {count} participants',
    participantOrder: 'Nº',
    participantUserId: 'ID Utilisateur',
    participantName: 'Nom',
    participantEmail: 'Email',
    participantPhone: 'Téléphone',
    participantCategory: 'Catégorie',
    participantPartner: 'Partenaire',
    tshirtSize: 'Taille de T-shirt',
    paymentStatus: 'Statut de Paiement',
    actions: 'Actions',
    editParticipant: 'Modifier le Participant',
    firstName: 'Prénom',
    lastName: 'Nom',
    telegram: 'Telegram',
    message: 'Message',
    partnerInfo: 'Informations du Partenaire',
    partnerName: 'Nom du Partenaire',
    partnerEmail: 'Email du Partenaire',
    partnerPhone: 'Téléphone du Partenaire',
    partnerTshirtSize: 'Taille de T-shirt du Partenaire',
    cancel: 'Annuler',
    save: 'Enregistrer',
    paymentPending: 'En attente',
    paymentPaid: 'Payé',
    paymentRefunded: 'Remboursé',
    edit: 'Modifier',
    loading: 'Chargement...',
    noParticipants: 'Aucun participant inscrit pour le moment.',
    participantsLoadError: 'Échec du chargement des participants.',
    participantUpdated: 'Participant mis à jour avec succès.',
    participantUpdateError: 'Échec de la mise à jour du participant.',
    paymentStatusUpdated: 'Statut de paiement mis à jour avec succès.',
    paymentStatusUpdateError: 'Échec de la mise à jour du statut de paiement.',
    participantCategoryUpdated: 'Catégorie du participant mise à jour avec succès.',
    participantCategoryUpdateError: 'Échec de la mise à jour de la catégorie du participant.'
  },
  de: {
    backToTournaments: '← Zurück zu Turnieren',
    participants: 'Teilnehmer',
    totalParticipants: 'Gesamt: {count} Teilnehmer',
    participantOrder: 'Nr.',
    participantUserId: 'Benutzer-ID',
    participantName: 'Name',
    participantEmail: 'E-Mail',
    participantPhone: 'Telefon',
    participantCategory: 'Kategorie',
    participantPartner: 'Partner',
    tshirtSize: 'T-Shirt-Größe',
    paymentStatus: 'Zahlungsstatus',
    actions: 'Aktionen',
    editParticipant: 'Teilnehmer bearbeiten',
    firstName: 'Vorname',
    lastName: 'Nachname',
    telegram: 'Telegram',
    message: 'Nachricht',
    partnerInfo: 'Partnerinformationen',
    partnerName: 'Partnername',
    partnerEmail: 'Partner-E-Mail',
    partnerPhone: 'Partnertelefon',
    partnerTshirtSize: 'Partner-T-Shirt-Größe',
    cancel: 'Abbrechen',
    save: 'Speichern',
    paymentPending: 'Ausstehend',
    paymentPaid: 'Bezahlt',
    paymentRefunded: 'Erstattet',
    edit: 'Bearbeiten',
    loading: 'Laden...',
    noParticipants: 'Noch keine Teilnehmer registriert.',
    participantsLoadError: 'Fehler beim Laden der Teilnehmer.',
    participantUpdated: 'Teilnehmer erfolgreich aktualisiert.',
    participantUpdateError: 'Fehler beim Aktualisieren des Teilnehmers.',
    paymentStatusUpdated: 'Zahlungsstatus erfolgreich aktualisiert.',
    paymentStatusUpdateError: 'Fehler beim Aktualisieren des Zahlungsstatus.',
    participantCategoryUpdated: 'Teilnehmerkategorie erfolgreich aktualisiert.',
    participantCategoryUpdateError: 'Fehler beim Aktualisieren der Teilnehmerkategorie.'
  },
  it: {
    backToTournaments: '← Torna ai Tornei',
    participants: 'Partecipanti',
    totalParticipants: 'Totale: {count} partecipanti',
    participantOrder: 'Nº',
    participantUserId: 'ID Utente',
    participantName: 'Nome',
    participantEmail: 'Email',
    participantPhone: 'Telefono',
    participantCategory: 'Categoria',
    participantPartner: 'Partner',
    tshirtSize: 'Taglia Maglietta',
    paymentStatus: 'Stato Pagamento',
    actions: 'Azioni',
    editParticipant: 'Modifica Partecipante',
    firstName: 'Nome',
    lastName: 'Cognome',
    telegram: 'Telegram',
    message: 'Messaggio',
    partnerInfo: 'Informazioni Partner',
    partnerName: 'Nome Partner',
    partnerEmail: 'Email Partner',
    partnerPhone: 'Telefono Partner',
    partnerTshirtSize: 'Taglia Maglietta Partner',
    cancel: 'Annulla',
    save: 'Salva',
    paymentPending: 'In attesa',
    paymentPaid: 'Pagato',
    paymentRefunded: 'Rimborsato',
    edit: 'Modifica',
    loading: 'Caricamento...',
    noParticipants: 'Nessun partecipante registrato ancora.',
    participantsLoadError: 'Errore nel caricamento dei partecipanti.',
    participantUpdated: 'Partecipante aggiornato con successo.',
    participantUpdateError: 'Errore nell\'aggiornamento del partecipante.',
    paymentStatusUpdated: 'Stato pagamento aggiornato con successo.',
    paymentStatusUpdateError: 'Errore nell\'aggiornamento dello stato pagamento.',
    participantCategoryUpdated: 'Categoria partecipante aggiornata con successo.',
    participantCategoryUpdateError: 'Errore nell\'aggiornamento della categoria partecipante.'
  },
  ca: {
    backToTournaments: '← Tornar als Tornejos',
    participants: 'Participants',
    totalParticipants: 'Total: {count} participants',
    participantOrder: 'Nº',
    participantUserId: 'ID d\'Usuari',
    participantName: 'Nom',
    participantEmail: 'Email',
    participantPhone: 'Telèfon',
    participantCategory: 'Categoria',
    participantPartner: 'Parella',
    tshirtSize: 'Mida de Samarreta',
    paymentStatus: 'Estat de Pagament',
    actions: 'Accions',
    editParticipant: 'Editar Participant',
    firstName: 'Nom',
    lastName: 'Cognom',
    telegram: 'Telegram',
    message: 'Missatge',
    partnerInfo: 'Informació de Parella',
    partnerName: 'Nom de Parella',
    partnerEmail: 'Email de Parella',
    partnerPhone: 'Telèfon de Parella',
    partnerTshirtSize: 'Mida de Samarreta de Parella',
    cancel: 'Cancel·lar',
    save: 'Desar',
    paymentPending: 'Pendent',
    paymentPaid: 'Pagat',
    paymentRefunded: 'Reemborsat',
    edit: 'Editar',
    loading: 'Carregant...',
    noParticipants: 'Encara no hi ha participants registrats.',
    participantsLoadError: 'Error en carregar participants.',
    participantUpdated: 'Participant actualitzat amb èxit.',
    participantUpdateError: 'Error en actualitzar participant.',
    paymentStatusUpdated: 'Estat de pagament actualitzat amb èxit.',
    paymentStatusUpdateError: 'Error en actualitzar estat de pagament.',
    participantCategoryUpdated: 'Categoria de participant actualitzada amb èxit.',
    participantCategoryUpdateError: 'Error en actualitzar categoria de participant.'
  },
  nl: {
    backToTournaments: '← Terug naar Toernooien',
    participants: 'Deelnemers',
    totalParticipants: 'Totaal: {count} deelnemers',
    participantOrder: 'Nr.',
    participantUserId: 'Gebruikers-ID',
    participantName: 'Naam',
    participantEmail: 'E-mail',
    participantPhone: 'Telefoon',
    participantCategory: 'Categorie',
    participantPartner: 'Partner',
    tshirtSize: 'T-shirt Maat',
    paymentStatus: 'Betalingsstatus',
    actions: 'Acties',
    editParticipant: 'Deelnemer Bewerken',
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    telegram: 'Telegram',
    message: 'Bericht',
    partnerInfo: 'Partnerinformatie',
    partnerName: 'Partnernaam',
    partnerEmail: 'Partner E-mail',
    partnerPhone: 'Partner Telefoon',
    partnerTshirtSize: 'Partner T-shirt Maat',
    cancel: 'Annuleren',
    save: 'Opslaan',
    paymentPending: 'In afwachting',
    paymentPaid: 'Betaald',
    paymentRefunded: 'Terugbetaald',
    edit: 'Bewerken',
    loading: 'Laden...',
    noParticipants: 'Nog geen deelnemers geregistreerd.',
    participantsLoadError: 'Fout bij het laden van deelnemers.',
    participantUpdated: 'Deelnemer succesvol bijgewerkt.',
    participantUpdateError: 'Fout bij het bijwerken van deelnemer.',
    paymentStatusUpdated: 'Betalingsstatus succesvol bijgewerkt.',
    paymentStatusUpdateError: 'Fout bij het bijwerken van betalingsstatus.',
    participantCategoryUpdated: 'Deelnemercategorie succesvol bijgewerkt.',
    participantCategoryUpdateError: 'Fout bij het bijwerken van deelnemercategorie.'
  },
  da: {
    backToTournaments: '← Tilbage til Turneringer',
    participants: 'Deltagere',
    totalParticipants: 'I alt: {count} deltagere',
    participantOrder: 'Nr.',
    participantUserId: 'Bruger-ID',
    participantName: 'Navn',
    participantEmail: 'E-mail',
    participantPhone: 'Telefon',
    participantCategory: 'Kategori',
    participantPartner: 'Partner',
    tshirtSize: 'T-shirt Størrelse',
    paymentStatus: 'Betalingsstatus',
    actions: 'Handlinger',
    editParticipant: 'Rediger Deltager',
    firstName: 'Fornavn',
    lastName: 'Efternavn',
    telegram: 'Telegram',
    message: 'Besked',
    partnerInfo: 'Partnerinformation',
    partnerName: 'Partnernavn',
    partnerEmail: 'Partner E-mail',
    partnerPhone: 'Partner Telefon',
    partnerTshirtSize: 'Partner T-shirt Størrelse',
    cancel: 'Annuller',
    save: 'Gem',
    paymentPending: 'Afventer',
    paymentPaid: 'Betalt',
    paymentRefunded: 'Tilbagebetalt',
    edit: 'Rediger',
    loading: 'Indlæser...',
    noParticipants: 'Ingen deltagere registreret endnu.',
    participantsLoadError: 'Fejl ved indlæsning af deltagere.',
    participantUpdated: 'Deltager opdateret med succes.',
    participantUpdateError: 'Fejl ved opdatering af deltager.',
    paymentStatusUpdated: 'Betalingsstatus opdateret med succes.',
    paymentStatusUpdateError: 'Fejl ved opdatering af betalingsstatus.',
    participantCategoryUpdated: 'Deltagerkategori opdateret med succes.',
    participantCategoryUpdateError: 'Fejl ved opdatering af deltagerkategori.'
  },
  sv: {
    backToTournaments: '← Tillbaka till Turneringar',
    participants: 'Deltagare',
    totalParticipants: 'Totalt: {count} deltagare',
    participantOrder: 'Nr.',
    participantUserId: 'Användar-ID',
    participantName: 'Namn',
    participantEmail: 'E-post',
    participantPhone: 'Telefon',
    participantCategory: 'Kategori',
    participantPartner: 'Partner',
    tshirtSize: 'T-shirt Storlek',
    paymentStatus: 'Betalningsstatus',
    actions: 'Åtgärder',
    editParticipant: 'Redigera Deltagare',
    firstName: 'Förnamn',
    lastName: 'Efternamn',
    telegram: 'Telegram',
    message: 'Meddelande',
    partnerInfo: 'Partnerinformation',
    partnerName: 'Partnernamn',
    partnerEmail: 'Partner E-post',
    partnerPhone: 'Partner Telefon',
    partnerTshirtSize: 'Partner T-shirt Storlek',
    cancel: 'Avbryt',
    save: 'Spara',
    paymentPending: 'Väntar',
    paymentPaid: 'Betald',
    paymentRefunded: 'Återbetalad',
    edit: 'Redigera',
    loading: 'Laddar...',
    noParticipants: 'Inga deltagare registrerade ännu.',
    participantsLoadError: 'Fel vid laddning av deltagare.',
    participantUpdated: 'Deltagare uppdaterad framgångsrikt.',
    participantUpdateError: 'Fel vid uppdatering av deltagare.',
    paymentStatusUpdated: 'Betalningsstatus uppdaterad framgångsrikt.',
    paymentStatusUpdateError: 'Fel vid uppdatering av betalningsstatus.',
    participantCategoryUpdated: 'Deltagarkategori uppdaterad framgångsrikt.',
    participantCategoryUpdateError: 'Fel vid uppdatering av deltagarkategori.'
  },
  no: {
    backToTournaments: '← Tilbake til Turneringer',
    participants: 'Deltakere',
    totalParticipants: 'Totalt: {count} deltakere',
    participantOrder: 'Nr.',
    participantUserId: 'Bruker-ID',
    participantName: 'Navn',
    participantEmail: 'E-post',
    participantPhone: 'Telefon',
    participantCategory: 'Kategori',
    participantPartner: 'Partner',
    tshirtSize: 'T-skjorte Størrelse',
    paymentStatus: 'Betalingsstatus',
    actions: 'Handlinger',
    editParticipant: 'Rediger Deltaker',
    firstName: 'Fornavn',
    lastName: 'Etternavn',
    telegram: 'Telegram',
    message: 'Melding',
    partnerInfo: 'Partnerinformasjon',
    partnerName: 'Partnernavn',
    partnerEmail: 'Partner E-post',
    partnerPhone: 'Partner Telefon',
    partnerTshirtSize: 'Partner T-skjorte Størrelse',
    cancel: 'Avbryt',
    save: 'Lagre',
    paymentPending: 'Venter',
    paymentPaid: 'Betalt',
    paymentRefunded: 'Refundert',
    edit: 'Rediger',
    loading: 'Laster...',
    noParticipants: 'Ingen deltakere registrert ennå.',
    participantsLoadError: 'Feil ved lasting av deltakere.',
    participantUpdated: 'Deltaker oppdatert med suksess.',
    participantUpdateError: 'Feil ved oppdatering av deltaker.',
    paymentStatusUpdated: 'Betalingsstatus oppdatert med suksess.',
    paymentStatusUpdateError: 'Feil ved oppdatering av betalingsstatus.',
    participantCategoryUpdated: 'Deltakerkategori oppdatert med suksess.',
    participantCategoryUpdateError: 'Feil ved oppdatering av deltakerkategori.'
  },
  ar: {
    backToTournaments: '← العودة إلى البطولات',
    participants: 'المشاركون',
    totalParticipants: 'الإجمالي: {count} مشارك',
    participantOrder: 'رقم',
    participantUserId: 'معرف المستخدم',
    participantName: 'الاسم',
    participantEmail: 'البريد الإلكتروني',
    participantPhone: 'الهاتف',
    participantCategory: 'الفئة',
    participantPartner: 'الشريك',
    tshirtSize: 'مقاس التي شيرت',
    paymentStatus: 'حالة الدفع',
    actions: 'الإجراءات',
    editParticipant: 'تعديل المشارك',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    telegram: 'تيليجرام',
    message: 'الرسالة',
    partnerInfo: 'معلومات الشريك',
    partnerName: 'اسم الشريك',
    partnerEmail: 'بريد الشريك الإلكتروني',
    partnerPhone: 'هاتف الشريك',
    partnerTshirtSize: 'مقاس التي شيرت للشريك',
    cancel: 'إلغاء',
    save: 'حفظ',
    paymentPending: 'قيد الانتظار',
    paymentPaid: 'مدفوع',
    paymentRefunded: 'مسترد',
    edit: 'تعديل',
    loading: 'جاري التحميل...',
    noParticipants: 'لم يتم تسجيل أي مشاركين بعد.',
    participantsLoadError: 'فشل تحميل المشاركين.',
    participantUpdated: 'تم تحديث المشارك بنجاح.',
    participantUpdateError: 'فشل تحديث المشارك.',
    paymentStatusUpdated: 'تم تحديث حالة الدفع بنجاح.',
    paymentStatusUpdateError: 'فشل تحديث حالة الدفع.',
    participantCategoryUpdated: 'تم تحديث فئة المشارك بنجاح.',
    participantCategoryUpdateError: 'فشل تحديث فئة المشارك.'
  },
  zh: {
    backToTournaments: '← 返回锦标赛',
    participants: '参与者',
    totalParticipants: '总计: {count} 名参与者',
    participantOrder: '编号',
    participantUserId: '用户ID',
    participantName: '姓名',
    participantEmail: '电子邮件',
    participantPhone: '电话',
    participantCategory: '类别',
    participantPartner: '搭档',
    tshirtSize: 'T恤尺寸',
    paymentStatus: '付款状态',
    actions: '操作',
    editParticipant: '编辑参与者',
    firstName: '名',
    lastName: '姓',
    telegram: 'Telegram',
    message: '消息',
    partnerInfo: '搭档信息',
    partnerName: '搭档姓名',
    partnerEmail: '搭档电子邮件',
    partnerPhone: '搭档电话',
    partnerTshirtSize: '搭档T恤尺寸',
    cancel: '取消',
    save: '保存',
    paymentPending: '待处理',
    paymentPaid: '已付款',
    paymentRefunded: '已退款',
    edit: '编辑',
    loading: '加载中...',
    noParticipants: '尚未注册任何参与者。',
    participantsLoadError: '加载参与者失败。',
    participantUpdated: '参与者更新成功。',
    participantUpdateError: '更新参与者失败。',
    paymentStatusUpdated: '付款状态更新成功。',
    paymentStatusUpdateError: '更新付款状态失败。',
    participantCategoryUpdated: '参与者类别更新成功。',
    participantCategoryUpdateError: '更新参与者类别失败。'
  }
};

// Функция для добавления недостающих ключей
function ensureKeysExist(targetData, sourceData, translations, lang, path = '') {
  let added = false;
  
  for (const key in sourceData) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (currentPath === 'Tournaments.bracket') {
      // Для секции bracket добавляем все необходимые ключи
      if (!targetData[key]) {
        targetData[key] = {};
      }
      
      requiredKeys.forEach(requiredKey => {
        if (!targetData[key][requiredKey]) {
          const translation = translations[lang]?.[requiredKey];
          if (translation) {
            targetData[key][requiredKey] = translation;
            added = true;
          } else if (sourceData[key] && sourceData[key][requiredKey]) {
            // Используем значение из en.json как fallback
            targetData[key][requiredKey] = sourceData[key][requiredKey];
            added = true;
          }
        }
      });
    } else if (typeof sourceData[key] === 'object' && !Array.isArray(sourceData[key])) {
      if (!targetData[key]) {
        targetData[key] = {};
        added = true;
      }
      if (ensureKeysExist(targetData[key], sourceData[key], translations, lang, currentPath)) {
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
    
    // Убеждаемся, что секция Tournaments.bracket существует
    if (!langData.Tournaments) {
      langData.Tournaments = {};
    }
    if (!langData.Tournaments.bracket) {
      langData.Tournaments.bracket = {};
    }
    
    // Добавляем недостающие ключи
    const langTranslations = translations[lang] || {};
    requiredKeys.forEach(key => {
      if (!langData.Tournaments.bracket[key]) {
        const translation = langTranslations[key];
        if (translation) {
          langData.Tournaments.bracket[key] = translation;
          modified = true;
          console.log(`✅ Added Tournaments.bracket.${key} to ${lang}.json`);
        } else if (enData.Tournaments?.bracket?.[key]) {
          // Используем значение из en.json как fallback
          langData.Tournaments.bracket[key] = enData.Tournaments.bracket[key];
          modified = true;
          console.log(`✅ Added Tournaments.bracket.${key} to ${lang}.json (from en.json)`);
        }
      }
    });
    
    // Синхронизируем остальные ключи из en.json
    if (ensureKeysExist(langData, enData, translations, lang)) {
      modified = true;
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

