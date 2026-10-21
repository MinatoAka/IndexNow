// ==========================================
// KONFIGURASI
// ==========================================
const props = PropertiesService.getScriptProperties();
const INDEXNOW_KEY = (props.getProperty("IndexNow_KEY") || "").trim();
const SHEET_ID = (props.getProperty("SPREADSHEETS_ID") || "").trim();
const SITE_HOST = (props.getProperty("SITE_HOST") || "www.aturdompet.my.id")
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");
const SITE_URL = (props.getProperty("SITE_URL") || "https://" + SITE_HOST).replace(/\/+$/, "");
const SHEET_NAME = props.getProperty("SHEET_NAME") || "LogIndexNow";
const ENDPOINTS = (() => {
  try {
    const parsed = JSON.parse(props.getProperty("TARGET_POINTS") || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch (e) {
    return [];
  }
})();

function validateConfig() {
  const missing = [];

  if (!INDEXNOW_KEY) missing.push("IndexNow_KEY");
  if (!SHEET_ID) missing.push("SPREADSHEETS_ID");
  if (!SITE_HOST) missing.push("SITE_HOST");
  if (!SITE_URL) missing.push("SITE_URL");

  if (missing.length > 0) {
    throw new Error("Konfigurasi belum lengkap: " + missing.join(", "));
  }

  if (!Array.isArray(ENDPOINTS) || ENDPOINTS.length === 0) {
    throw new Error("TARGET_POINTS belum diisi atau formatnya tidak valid.");
  }

  const invalidEndpoint = ENDPOINTS.some(function (ep) {
    return typeof ep !== "string" || !/^https?:\/\//i.test(ep);
  });

  if (invalidEndpoint) {
    throw new Error("TARGET_POINTS berisi URL endpoint yang tidak valid.");
  }
}
