// ==========================================
// FUNGSI UTAMA (Otomatis via Trigger)
// ==========================================

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
// FUNGSI MANUAL (Force Submit & Halaman Statis)
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
      
      // Menggunakan fungsi dari Sitemap.gs (DRY Principle)
      // Parameter kedua 'false' artinya ambil semua URL, tanpa filter 6 jam
      const sitemapResult = getSitemapUrls(sitemapUrl, false);

      // Validasi jika error atau sitemap kosong
      if (sitemapResult.error || sitemapResult.urls.length === 0) {
        sheet.appendRow([new Date(), "SKIP", 0, "-", "sitemap-pages.xml kosong atau gagal dimuat"]);
        return;
      }

      const toSubmit = sitemapResult.urls;
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
