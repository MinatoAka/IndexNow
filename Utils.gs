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

function getManagedTriggers() {
  const managed = ["submitToIndexNowWithLog", "autoDeleteIndexNowLog"];
  return ScriptApp.getProjectTriggers().filter(function (trigger) {
    return managed.indexOf(trigger.getHandlerFunction()) !== -1;
  });
}

function ensureTimeTrigger(functionName, createTriggerFn, isValidTriggerFn) {
  const triggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === functionName;
  });

  const hasValidTrigger = triggers.some(function (trigger) {
    return isValidTriggerFn(trigger);
  });

  if (hasValidTrigger) return;

  triggers.forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  createTriggerFn();
}

function setupTriggerFinal() {
  ensureTimeTrigger(
    "submitToIndexNowWithLog",
    function () {
      ScriptApp.newTrigger("submitToIndexNowWithLog").timeBased().everyHours(6).create();
    },
    function (trigger) {
      return trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getHandlerFunction() === "submitToIndexNowWithLog";
    }
  );

  ensureTimeTrigger(
    "autoDeleteIndexNowLog",
    function () {
      ScriptApp.newTrigger("autoDeleteIndexNowLog").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
    },
    function (trigger) {
      return (
        trigger.getEventType() === ScriptApp.EventType.CLOCK &&
        trigger.getHandlerFunction() === "autoDeleteIndexNowLog"
      );
    }
  );
}
