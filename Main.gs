// ==========================================
// 3. FUNGSI UTAMA (Otomatis via Trigger)
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

function getSitemapUrls(sitemapUrl, onlyRecent) {
  const response = UrlFetchApp.fetch(sitemapUrl, { muteHttpExceptions: true });
  const sitemap = response.getContentText();

  if (!sitemap || response.getResponseCode() >= 400) {
    return { error: "Gagal mengambil sitemap.xml (HTTP " + response.getResponseCode() + ")", urls: [] };
  }

  try {
    const xml = XmlService.parse(sitemap);
    const ns = XmlService.getNamespace("http://www.sitemaps.org/schemas/sitemap/0.9");
    const urlNodes = xml.getRootElement().getChildren("url", ns);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const urls = [];

    for (let i = 0; i < urlNodes.length; i++) {
      const node = urlNodes[i];
      const locNode = node.getChild("loc", ns);
      const lastmodNode = node.getChild("lastmod", ns);
      const loc = locNode ? locNode.getText() : "";

      if (!loc) continue;

      if (onlyRecent) {
        const lastmodText = lastmodNode ? lastmodNode.getText() : "";
        const lastmod = lastmodText ? new Date(lastmodText) : null;
        if (lastmod && !isNaN(lastmod.getTime()) && lastmod < sixHoursAgo) continue;
      }

      urls.push(loc);
    }

    return { error: "", urls: urls };
  } catch (e) {
    return { error: e.toString(), urls: [] };
  }
}

function appendLogRow(status, count, urls, note) {
  const sheet = ensureSheet();
  sheet.appendRow([new Date(), status, count, urls, note]);
}

function submitToIndexNowWithLog() {
  return withSubmitLock(function () {
    try {
      validateConfig();
      const cache = getCacheSet();
      const sheet = ensureSheet();
      const sitemapUrl = SITE_URL + "/sitemap.xml";
      const sitemapResult = getSitemapUrls(sitemapUrl, true);

      if (sitemapResult.error) {
        sheet.appendRow([new Date(), "ERROR", 0, "-", sitemapResult.error]);
        return;
      }

      const toSubmit = sitemapResult.urls.filter(function (url) {
        return !cache.has(url);
      });

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
        for (let i = 0; i < toSubmit.length; i++) {
          cache.add(toSubmit[i]);
        }
        props.setProperty("idx_cache_final", JSON.stringify(Array.from(cache).slice(-500)));
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
  return withSubmitLock(function () {
    try {
      validateConfig();
      const sheet = ensureSheet();
      const sitemapUrl = SITE_URL + "/sitemap.xml";
      const sitemapResult = getSitemapUrls(sitemapUrl, false);

      if (sitemapResult.error) {
        sheet.appendRow([new Date(), "ERROR", 0, "-", sitemapResult.error]);
        return;
      }

      const toSubmit = sitemapResult.urls;
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
  return withSubmitLock(function () {
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
      const ns = XmlService.getNamespace("http://www.sitemaps.org/schemas/sitemap/0.9");
      const urlNodes = xml.getRootElement().getChildren("url", ns);
      const toSubmit = [];

      for (let i = 0; i < urlNodes.length; i++) {
        const locNode = urlNodes[i].getChild("loc", ns);
        if (locNode && locNode.getText()) {
          toSubmit.push(locNode.getText());
        }
      }

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
