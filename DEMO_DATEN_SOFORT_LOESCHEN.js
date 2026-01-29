// Demo-Daten sofort löschen - Browser-Console Code
// Kopieren Sie diesen Code in die Browser-Console (F12 → Console Tab)

fetch('https://prototyp-epidoc-production.up.railway.app/api/user/demo-data', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) {
    return response.json().then(data => {
      throw new Error(data.message || 'Fehler beim Löschen');
    });
  }
  return response.json();
})
.then(data => {
  console.log('✅ Erfolgreich gelöscht:', data);
  alert('Demo-Daten erfolgreich gelöscht!\n\n' +
        'Gelöscht:\n' +
        '- ' + data.deleted.seizures + ' Anfälle\n' +
        '- ' + data.deleted.befinden + ' Befinden-Einträge\n' +
        '- ' + data.deleted.medications + ' Medikamente\n\n' +
        'Die Seite wird jetzt neu geladen...');
  window.location.reload();
})
.catch(error => {
  console.error('❌ Fehler:', error);
  alert('Fehler beim Löschen:\n' + error.message + '\n\nBitte prüfen Sie:\n' +
        '1. Sind Sie eingeloggt?\n' +
        '2. Ist der Token gültig?\n' +
        '3. Prüfen Sie die Console für Details');
});

