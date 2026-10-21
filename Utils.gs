// ==========================================
// 5. UTILITY
// ==========================================
function autoDeleteIndexNowLog() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var sekarang = new Date();

  for (var i = data.length - 1; i >= 1; i--) {
    var tgl = new Date(data[i][0]);
    if(isNaN(tgl)) continue;
    var selisih = (sekarang - tgl) / (1000 * 60 * 60 * 24);
    if (selisih > 7) sheet.deleteRow(i + 1);
  }
}

function setupTriggerFinal() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("submitToIndexNowWithLog").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("autoDeleteIndexNowLog").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}
