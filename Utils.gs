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
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  if (!data.length) return;

  const header = data[0];
  const keepRows = [header];
  const sekarang = new Date();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawDate = row[0];

    if (!rawDate) {
      keepRows.push(row);
      continue;
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      keepRows.push(row);
      continue;
    }

    const selisihHari = (sekarang - parsedDate) / (1000 * 60 * 60 * 24);
    if (selisihHari <= 7) {
      keepRows.push(row);
    }
  }

  if (keepRows.length !== sheet.getLastRow()) {
    sheet.clearContents();
    if (keepRows.length > 0) {
      sheet.getRange(1, 1, keepRows.length, keepRows[0].length).setValues(keepRows);
    }
  }
}
