// ==========================================
// UTILITY
// ==========================================

function ensureSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getActiveSheet();

  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan.");
  if (sheet.getLastRow() === 0) sheet.appendRow(["Waktu", "Status", "Jumlah", "URL", "Catatan"]);

  return sheet;
}

function withSubmitLock(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    return fn();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getCacheSet() {
  try {
    const cache = JSON.parse(props.getProperty("idx_cache_final") || "[]");
    return new Set(Array.isArray(cache) ? cache.filter(Boolean) : []);
  } catch (e) {
    return new Set();
  }
}

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
