const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

const translations = {
  fr: {
    delete: 'Supprimer',
    confirmDeleteParticipant: 'Êtes-vous sûr de vouloir supprimer le participant {name} ? Cette action ne peut pas être annulée.',
    participantDeleted: 'Participant supprimé avec succès.',
    participantDeleteError: 'Erreur lors de la suppression du participant.',
  },
  de: {
    delete: 'Löschen',
    confirmDeleteParticipant: 'Sind Sie sicher, dass Sie den Teilnehmer {name} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    participantDeleted: 'Teilnehmer erfolgreich gelöscht.',
    participantDeleteError: 'Fehler beim Löschen des Teilnehmers.',
  },
  it: {
    delete: 'Elimina',
    confirmDeleteParticipant: 'Sei sicuro di voler eliminare il partecipante {name}? Questa azione non può essere annullata.',
    participantDeleted: 'Partecipante eliminato con successo.',
    participantDeleteError: 'Errore durante l\'eliminazione del partecipante.',
  },
  ca: {
    delete: 'Eliminar',
    confirmDeleteParticipant: 'Esteu segur que voleu eliminar el participant {name}? Aquesta acció no es pot desfer.',
    participantDeleted: 'Participant eliminat amb èxit.',
    participantDeleteError: 'Error en eliminar el participant.',
  },
  nl: {
    delete: 'Verwijderen',
    confirmDeleteParticipant: 'Weet u zeker dat u deelnemer {name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
    participantDeleted: 'Deelnemer succesvol verwijderd.',
    participantDeleteError: 'Fout bij het verwijderen van deelnemer.',
  },
  da: {
    delete: 'Slet',
    confirmDeleteParticipant: 'Er du sikker på, at du vil slette deltageren {name}? Denne handling kan ikke fortrydes.',
    participantDeleted: 'Deltager slettet med succes.',
    participantDeleteError: 'Fejl ved sletning af deltager.',
  },
  sv: {
    delete: 'Radera',
    confirmDeleteParticipant: 'Är du säker på att du vill radera deltagaren {name}? Denna åtgärd kan inte ångras.',
    participantDeleted: 'Deltagare raderad framgångsrikt.',
    participantDeleteError: 'Fel vid radering av deltagare.',
  },
  no: {
    delete: 'Slett',
    confirmDeleteParticipant: 'Er du sikker på at du vil slette deltakeren {name}? Denne handlingen kan ikke angres.',
    participantDeleted: 'Deltaker slettet vellykket.',
    participantDeleteError: 'Feil ved sletting av deltaker.',
  },
  ar: {
    delete: 'حذف',
    confirmDeleteParticipant: 'هل أنت متأكد أنك تريد حذف المشارك {name}؟ لا يمكن التراجع عن هذا الإجراء.',
    participantDeleted: 'تم حذف المشارك بنجاح.',
    participantDeleteError: 'خطأ في حذف المشارك.',
  },
  zh: {
    delete: '删除',
    confirmDeleteParticipant: '您确定要删除参与者 {name} 吗？此操作无法撤销。',
    participantDeleted: '参与者已成功删除。',
    participantDeleteError: '删除参与者时出错。',
  },
};

const languages = ['fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File ${filePath} does not exist, skipping...`);
    return;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Ищем в секции Tournaments (не Admin.tournaments)
    if (!data.Tournaments) {
      console.log(`⚠️  Tournaments section not found in ${lang}.json, skipping...`);
      return;
    }
    
    const langTranslations = translations[lang];
    if (langTranslations) {
      Object.keys(langTranslations).forEach(key => {
        data.Tournaments[key] = langTranslations[key];
      });
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Updated delete participant translations in ${lang}.json`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');

