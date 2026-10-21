// ==========================================
// 1. KONFIGURASI
// ==========================================
const props = PropertiesService.getScriptProperties();
const INDEXNOW_KEY = props.getProperty("IndexNow_KEY");
const SHEET_ID = props.getProperty("SPREADSHEETS_ID");
const SITE_HOST = "www.aturdompet.my.id";
const SITE_URL = "https://" + SITE_HOST;
const SHEET_NAME = "LogIndexNow";
const ENDPOINTS = JSON.parse(props.getProperty("TARGET_POINTS") || "[]");
