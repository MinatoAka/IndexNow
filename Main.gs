// ==========================================
// 3. FUNGSI UTAMA (Otomatis via Trigger)
// ==========================================
function ensureSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) || SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan.");
  if (sheet.getLastRow() == 0) sheet.appendRow(["Waktu", "Status", "Jumlah", "URL", "Catatan"]);
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

function submitToIndexNowWithLog() {
  return withSubmitLock(function() {
    try {
      validateConfig();
      const cache = JSON.parse(props.getProperty("idx_cache_final") || "[]");
      const sheet = ensureSheet();
      const sitemapUrl = SITE_URL + "/sitemap.xml";
      const response = UrlFetchApp.fetch(sitemapUrl, { muteHttpExceptions: true });
      const sitemap = response.getContentText();

      if (!sitemap || response.getResponseCode() >= 400) {
        sheet.appendRow([new Date(), "ERROR", 0, "-", "Gagal mengambil sitemap.xml (HTTP " + response.getResponseCode() + ")"]);
        return;
      }

      const xml = XmlService.parse(sitemap);
      const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
      const urls = xml.getRootElement().getChildren('url', ns);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const toSubmit = [];

      for (let u of urls) {
        const loc = u.getChild('loc', ns).getText();
        const lastmod = new Date(u.getChild('lastmod', ns).getText());
        if (lastmod >= sixHoursAgo && !cache.includes(loc)) {
          toSubmit.push(loc);
        }
      }

      if (toSubmit.length === 0) {
        sheet.appendRow([new Date(), "SKIP", 0, "Tidak ada URL baru dalam 6 jam", "-"]);
        return;
      }

      const result = kirimKeIndexNow(toSubmit);
      sheet.appendRow([
        new Date(),
        result.success ? "SUKSES" : "GAGAL",
        toSubmit.length,
        toSubmit.join("\n"),
        result.success ? "HTTP " + result.code : result.error
      ]);

      if (result.success) {
        props.setProperty("idx_cache_final", JSON.stringify([...cache, ...toSubmit].slice(-500)));
      }
    } catch (e) {
      try {
        const sheet = ensureSheet();
        sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
      } catch (sheetErr) {
        Logger.log("submitToIndexNowWithLog error: " + e.toString());
      }
    }
  });
}

// ==========================================
// 4. FUNGSI MANUAL (Force Submit & Halaman Statis)
// ==========================================
function forceSubmitAllToIndexNow() {
  return withSubmitLock(function() {
    try {
      validateConfig();
      const sheet = ensureSheet();
      const sitemapUrl = SITE_URL + "/sitemap.xml";
      const response = UrlFetchApp.fetch(sitemapUrl, { muteHttpExceptions: true });
      const sitemap = response.getContentText();

      if (!sitemap || response.getResponseCode() >= 400) {
        sheet.appendRow([new Date(), "ERROR", 0, "-", "Gagal mengambil sitemap.xml (HTTP " + response.getResponseCode() + ")"]);
        return;
      }

      const xml = XmlService.parse(sitemap);
      const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
      const urls = xml.getRootElement().getChildren('url', ns);
      const toSubmit = [];

      for (let u of urls) toSubmit.push(u.getChild('loc', ns).getText());
      if (toSubmit.length === 0) return;

      const result = kirimKeIndexNow(toSubmit);
      sheet.appendRow([
        new Date(),
        result.success ? "SUKSES (FORCE)" : "GAGAL (FORCE)",
        toSubmit.length,
        toSubmit.join("\n"),
        result.success ? "HTTP " + result.code : result.error
      ]);

      if (result.success) {
        props.deleteProperty("idx_cache_final");
        Logger.log("SUKSES! Cache dihapus, " + toSubmit.length + " URL terkirim ulang.");
      }
    } catch (e) {
      try {
        const sheet = ensureSheet();
        sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
      } catch (sheetErr) {
        Logger.log("forceSubmitAllToIndexNow error: " + e.toString());
      }
    }
  });
}

function submitPagesToIndexNow() {
  return withSubmitLock(function() {
    try {
      validateConfig();
      const sheet = ensureSheet();
      const sitemapUrl = SITE_URL + "/sitemap-pages.xml";
      const response = UrlFetchApp.fetch(sitemapUrl, { muteHttpExceptions: true });
      const sitemap = response.getContentText();

      if (!sitemap || response.getResponseCode() >= 400 || sitemap.indexOf("<html") > -1) {
        sheet.appendRow([new Date(), "SKIP", 0, "-", "sitemap-pages.xml tidak ditemukan atau gagal dimuat"]);
        return;
      }

      const xml = XmlService.parse(sitemap);
      const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
      const urls = xml.getRootElement().getChildren('url', ns);
      const toSubmit = [];

      for (let u of urls) toSubmit.push(u.getChild('loc', ns).getText());
      if (toSubmit.length === 0) return;

      const result = kirimKeIndexNow(toSubmit);
      sheet.appendRow([
        new Date(),
        result.success ? "SUKSES (PAGES)" : "GAGAL (PAGES)",
        toSubmit.length,
        toSubmit.join("\n"),
        result.success ? "HTTP " + result.code : result.error
      ]);
    } catch (e) {
      try {
        const sheet = ensureSheet();
        sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
      } catch (sheetErr) {
        Logger.log("submitPagesToIndexNow error: " + e.toString());
      }
    }
  });
}
