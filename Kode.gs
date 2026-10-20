const props = PropertiesService.getScriptProperties();
const INDEXNOW_KEY = props.getProperty("IndexNow_KEY");
const SHEET_ID = props.getProperty("SPREADSHEETS_ID");
const SITE_HOST = "www.aturdompet.my.id";
const SITE_URL = "https://" + SITE_HOST;
const SHEET_NAME = "LogIndexNow";

function submitToIndexNowWithLog() {
  const props = PropertiesService.getScriptProperties();
  const cache = JSON.parse(props.getProperty("idx_cache_final") || "[]");
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) || SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  if(sheet.getLastRow() == 0) sheet.appendRow(["Waktu", "Status", "Jumlah", "URL", "Catatan"]);

  try {
    const sitemap = UrlFetchApp.fetch(SITE_URL + "/sitemap.xml", {muteHttpExceptions: true}).getContentText();
    const xml = XmlService.parse(sitemap);
    const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = xml.getRootElement().getChildren('url', ns);

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const toSubmit = [];
    for (let u of urls) {
      const loc = u.getChild('loc', ns).getText();
      const lastmod = new Date(u.getChild('lastmod', ns).getText());
      if (lastmod >= sixHoursAgo &&!cache.includes(loc)) {
        toSubmit.push(loc);
      }
    }

    if (toSubmit.length === 0) {
      sheet.appendRow([new Date(), "SKIP", 0, "Tidak ada URL baru dalam 6 jam", "-"]);
      return;
    }

    // FIX: pakai 3 endpoint biar gak Address unavailable
    const endpoints = [
      "https://api.indexnow.org/indexnow",
      "https://yandex.com/indexnow"
    ];

    const payload = JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
      urlList: toSubmit
    });

    let success = false;
    let finalCode = 0;
    let lastError = "";

    for (let ep of endpoints) {
      try {
        const res = UrlFetchApp.fetch(ep, {
          method: "post",
          contentType: "application/json; charset=utf-8",
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        finalCode = res.getResponseCode();
        if (finalCode == 200 || finalCode == 202) {
          success = true;
          break;
        } else {
          lastError = "HTTP " + finalCode + " di " + ep;
        }
      } catch (e) {
        lastError = ep + " -> " + e.toString();
        continue;
      }
    }

    sheet.appendRow([
      new Date(),
      success? "SUKSES" : "GAGAL",
      toSubmit.length,
      toSubmit.join("\n"),
      success? "HTTP " + finalCode : lastError
    ]);

    if (success) {
      props.setProperty("idx_cache_final", JSON.stringify([...cache,...toSubmit].slice(-500)));
    }

  } catch (e) {
    sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
  }
}

// AUTO DELETE LOG LEBIH DARI 7 HARI
function autoDeleteIndexNowLog() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var sekarang = new Date();

  for (var i = data.length - 1; i >= 1; i--) {
    var tgl = new Date(data[i][0]);
    if(isNaN(tgl)) continue;
    var selisih = (sekarang - tgl) / (1000 * 60 * 60 * 24);
    if (selisih > 7) {
      sheet.deleteRow(i + 1);
    }
  }
}

// JALANKAN INI 1x AJA
function setupTriggerFinal() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("submitToIndexNowWithLog").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("autoDeleteIndexNowLog").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}

function forceSubmitAllToIndexNow() {
  const props = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) || SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  
  if(sheet.getLastRow() == 0) sheet.appendRow(["Waktu", "Status", "Jumlah", "URL", "Catatan"]);

  try {
    const sitemap = UrlFetchApp.fetch(SITE_URL + "/sitemap.xml", {muteHttpExceptions: true}).getContentText();
    const xml = XmlService.parse(sitemap);
    const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = xml.getRootElement().getChildren('url', ns);

    const toSubmit = [];
    // AMBIL SEMUA URL TANPA FILTER WAKTU & TANPA CEK CACHE
    for (let u of urls) {
      const loc = u.getChild('loc', ns).getText();
      toSubmit.push(loc);
    }

    if (toSubmit.length === 0) {
      Logger.log("Sitemap kosong atau gagal load.");
      return;
    }

    // Tembak ke Endpoint
    const endpoints = ["https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"];
    const payload = JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
      urlList: toSubmit
    });

    let success = false;
    let finalCode = 0;
    let lastError = "";

    for (let ep of endpoints) {
      try {
        const res = UrlFetchApp.fetch(ep, {
          method: "post",
          contentType: "application/json; charset=utf-8",
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        finalCode = res.getResponseCode();
        if (finalCode == 200 || finalCode == 202) {
          success = true;
          break;
        } else {
          lastError = "HTTP " + finalCode + " di " + ep;
        }
      } catch (e) {
        lastError = ep + " -> " + e.toString();
        continue;
      }
    }

    // Catat di log
    sheet.appendRow([
      new Date(),
      success ? "SUKSES (FORCE)" : "GAGAL (FORCE)",
      toSubmit.length,
      toSubmit.join("\n"),
      success ? "HTTP " + finalCode : lastError
    ]);

    // HAPUS CACHE LAMA SETELAH SUKSES
    if (success) {
      props.deleteProperty("idx_cache_final");
      Logger.log("SUKSES! Cache lama dihapus, semua URL (" + toSubmit.length + ") telah dikirim ulang.");
    }

  } catch (e) {
    sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
  }
}

function submitPagesToIndexNow() {
  const props = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) || SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  
  if(sheet.getLastRow() == 0) sheet.appendRow(["Waktu", "Status", "Jumlah", "URL", "Catatan"]);

  try {
    // Ambil URL dari sitemap-pages.xml
    const sitemapUrl = SITE_URL + "/sitemap-pages.xml";
    const sitemap = UrlFetchApp.fetch(sitemapUrl, {muteHttpExceptions: true}).getContentText();
    
    // Cek jika sitemap tidak ditemukan atau error
    if (sitemap.indexOf("<html") > -1) {
      sheet.appendRow([new Date(), "SKIP", 0, "-", "sitemap-pages.xml tidak ditemukan"]);
      return;
    }

    const xml = XmlService.parse(sitemap);
    const ns = XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = xml.getRootElement().getChildren('url', ns);

    const toSubmit = [];
    // Ambil semua URL halaman statis dari sitemap
    for (let u of urls) {
      const loc = u.getChild('loc', ns).getText();
      toSubmit.push(loc);
    }

    if (toSubmit.length === 0) {
      sheet.appendRow([new Date(), "SKIP", 0, "-", "Tidak ada halaman statis di sitemap"]);
      return;
    }

    // Kirim ke IndexNow
    const endpoints = ["https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"];
    const payload = JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
      urlList: toSubmit
    });

    let success = false;
    let finalCode = 0;
    let lastError = "";

    for (let ep of endpoints) {
      try {
        const res = UrlFetchApp.fetch(ep, {
          method: "post",
          contentType: "application/json; charset=utf-8",
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        finalCode = res.getResponseCode();
        if (finalCode == 200 || finalCode == 202) {
          success = true;
          break;
        } else {
          lastError = "HTTP " + finalCode + " di " + ep;
        }
      } catch (e) {
        lastError = ep + " -> " + e.toString();
        continue;
      }
    }

    sheet.appendRow([
      new Date(),
      success ? "SUKSES (PAGES)" : "GAGAL (PAGES)",
      toSubmit.length,
      toSubmit.join("\n"),
      success ? "HTTP " + finalCode : lastError
    ]);

  } catch (e) {
    sheet.appendRow([new Date(), "ERROR", 0, "-", e.toString()]);
  }
}
