// ==========================================
// 5. UTILITY
// ==========================================
function autoDeleteIndexNowLog() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const sekarang = new Date();

  for (let i = data.length - 1; i >= 1; i--) {
    const tgl = new Date(data[i][0]);
    if (isNaN(tgl.getTime())) continue;

    const selisih = (sekarang - tgl) / (1000 * 60 * 60 * 24);
    if (selisih > 7) sheet.deleteRow(i + 1);
  }
}

function setupTriggerFinal() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("submitToIndexNowWithLog").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("autoDeleteIndexNowLog").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}
