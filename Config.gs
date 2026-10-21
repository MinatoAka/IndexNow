// ==========================================
// 1. KONFIGURASI
// ==========================================
const props = PropertiesService.getScriptProperties();
const INDEXNOW_KEY = props.getProperty("IndexNow_KEY");
const SHEET_ID = props.getProperty("SPREADSHEETS_ID");
const SITE_HOST = "www.aturdompet.my.id";
const SITE_URL = "https://" + SITE_HOST;
const SHEET_NAME = "LogIndexNow";
const ENDPOINTS = (() => {
  try {
    return JSON.parse(props.getProperty("TARGET_POINTS") || "[]");
  } catch (e) {
    return [];
  }
})();

function validateConfig() {
  if (!INDEXNOW_KEY) throw new Error("IndexNow_KEY belum diisi.");
  if (!SHEET_ID) throw new Error("SPREADSHEETS_ID belum diisi.");
  if (!Array.isArray(ENDPOINTS) || ENDPOINTS.length === 0) {
    throw new Error("TARGET_POINTS belum diisi atau formatnya tidak valid.");
  }
}
