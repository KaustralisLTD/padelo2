const fs = require('fs');
const path = require('path');

// Переводы правил турнира для разных языков
const translations = {
  it: {
    title: "Regole del Torneo",
    back: "Torna alla tabella",
    editRules: "Modifica Regole",
    save: "Salva",
    saving: "Salvataggio...",
    cancel: "Annulla",
    rulesSaved: "Regole salvate con successo!",
    errorSaving: "Errore nel salvataggio delle regole",
    loading: "Caricamento...",
    payment: {
      title: "Pagamento",
      text: "Il pagamento verrà effettuato prima di giocare la prima partita di ogni coppia. Può essere effettuato con carta o contanti alla tenda principale dell'evento."
    },
    gameRules: {
      title: "Regole di Gioco",
      winner: "Il vincitore della partita sarà colui che raggiunge 9 giochi o ha il punteggio più alto durante i 45 minuti di ogni partita. Con punto d'oro. In caso di pareggio 8-8, verrà giocato un Tie-Break fino a 7 punti con una differenza di 2.",
      tieBreak: "A 45 minuti, suonerà un 'corno' (mentre il corno suona, se un punto è in corso, quel punto deve essere finito). In caso di pareggio nei giochi, il gioco in corso deve essere finito, e se in quel momento c'è un pareggio nei giochi senza iniziare il gioco successivo, verrà giocato un punto d'oro per determinare il vincitore.",
      timeLimit: "Se il Tie-Break di 8-8 è in corso quando i 45 minuti sono scaduti, il Tie-Break deve essere finito normalmente.",
      semifinals: "Semifinali e finali saranno al meglio di 2 set + super tie-break senza limite di tempo."
    },
    warmup: {
      title: "Riscaldamento",
      text: "Cerca di riscaldarti rapidamente poiché è incluso nei 45 minuti. Poiché conoscerai in anticipo i campi in cui parteciperai, puoi riscaldarti nelle vicinanze ed essere pronto a giocare. Approfitta per riscaldarti se il campo dove giochi è finito presto."
    },
    results: {
      title: "Risultati",
      text: "Una volta terminata la partita, il vincitore deve indicare il risultato alla tenda immediatamente. Se non lo fa, non segnerà punti."
    },
    points: {
      title: "Sistema di Punti",
      win: "Ogni partita vinta segnerà 2 punti e persa segnerà 1 punto.",
      loss: "In caso di pareggio nei punti per la qualificazione al turno successivo, verrà preso in considerazione la media (giochi vinti - giochi persi).",
      tiebreaker: "In caso di pareggio nei punti e nella media, verrà considerato lo scontro diretto."
    },
    qualification: {
      title: "Qualificazione",
      text: "I primi 2 di ogni gruppo si qualificano (eccetto Donne B+ dove si qualificano i primi 4). In Donne B, le 2 migliori squadre classificate prime si qualificano direttamente alle semifinali."
    },
    otherRules: {
      title: "Altre Regole",
      exterior: "Il gioco esterno non è consentito a meno che non sia stato precedentemente concordato da entrambe le coppie e siano d'accordo.",
      disputed: "Durante le partite, qualsiasi punto dubbio per entrambe le parti verrà rigiocato.",
      balls: "I cambi di palla verranno effettuati con nuove palle ogni 4-5 partite per campo. Finali con nuove palle.",
      partner: "Non puoi cambiare partner una volta che la prima partita del torneo è iniziata.",
      media: "Durante il torneo verranno scattate foto e video. Partecipando, accetti l'uso di queste immagini e video per qualsiasi scopo."
    }
  },
  // Добавлю остальные языки по мере необходимости
};

// Функция для обновления файла переводов
function updateTranslations(lang, translations) {
  const filePath = path.join(__dirname, '..', 'messages', `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!content.Tournaments) {
    content.Tournaments = {};
  }
  
  if (!content.Tournaments.rules) {
    content.Tournaments.rules = {};
  }
  
  // Обновляем правила
  Object.assign(content.Tournaments.rules, translations);
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${lang}.json`);
}

// Обновляем переводы
Object.keys(translations).forEach(lang => {
  updateTranslations(lang, translations[lang]);
});

console.log('Done!');

