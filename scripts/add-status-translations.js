const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

const translations = {
  ua: {
    statusUpdated: 'Статус успішно оновлено',
    clickToEditStatus: 'Натисніть для редагування статусу'
  },
  ru: {
    statusUpdated: 'Статус успешно обновлен',
    clickToEditStatus: 'Нажмите для редактирования статуса'
  },
  es: {
    statusUpdated: 'Estado actualizado correctamente',
    clickToEditStatus: 'Haga clic para editar el estado'
  },
  fr: {
    statusUpdated: 'Statut mis à jour avec succès',
    clickToEditStatus: 'Cliquez pour modifier le statut'
  },
  de: {
    statusUpdated: 'Status erfolgreich aktualisiert',
    clickToEditStatus: 'Klicken Sie, um den Status zu bearbeiten'
  },
  it: {
    statusUpdated: 'Stato aggiornato con successo',
    clickToEditStatus: 'Clicca per modificare lo stato'
  },
  ca: {
    statusUpdated: 'Estat actualitzat correctament',
    clickToEditStatus: 'Feu clic per editar l\'estat'
  },
  nl: {
    statusUpdated: 'Status succesvol bijgewerkt',
    clickToEditStatus: 'Klik om de status te bewerken'
  },
  da: {
    statusUpdated: 'Status opdateret med succes',
    clickToEditStatus: 'Klik for at redigere status'
  },
  sv: {
    statusUpdated: 'Status uppdaterad',
    clickToEditStatus: 'Klicka för att redigera status'
  },
  no: {
    statusUpdated: 'Status oppdatert',
    clickToEditStatus: 'Klikk for å redigere status'
  },
  ar: {
    statusUpdated: 'تم تحديث الحالة بنجاح',
    clickToEditStatus: 'انقر لتعديل الحالة'
  },
  zh: {
    statusUpdated: '状态更新成功',
    clickToEditStatus: '点击编辑状态'
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
    
    if (!data.Tournaments) {
      data.Tournaments = {};
    }
    
    if (translations[lang]) {
      data.Tournaments.statusUpdated = translations[lang].statusUpdated;
      data.Tournaments.clickToEditStatus = translations[lang].clickToEditStatus;
    } else if (lang === 'en') {
      // English already has these keys
      if (!data.Tournaments.statusUpdated) data.Tournaments.statusUpdated = 'Status updated successfully';
      if (!data.Tournaments.clickToEditStatus) data.Tournaments.clickToEditStatus = 'Click to edit status';
    } else {
      // Fallback to English for other languages
      data.Tournaments.statusUpdated = data.Tournaments.statusUpdated || 'Status updated successfully';
      data.Tournaments.clickToEditStatus = data.Tournaments.clickToEditStatus || 'Click to edit status';
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

