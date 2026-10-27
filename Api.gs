// ==========================================
// FUNGSI KURIR UTAMA
// ==========================================

function normalizeUrlList(urlList) {
  if (!Array.isArray(urlList) || urlList.length === 0) return [];

  const seen = {};
  return urlList
    .map(function (item) {
      return typeof item === "string" ? item.trim() : "";
    })
    .filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function submitSingleBatch(urlList) {
  const payload = JSON.stringify({
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
    urlList: urlList
  });

  let lastCode = 0;
  let lastBody = "";

  for (let ep of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = UrlFetchApp.fetch(ep, {
          method: "post",
          headers: {
              "Content-Type": "application/json; charset=utf-8",
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36"
          },
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });

        lastCode = res.getResponseCode();
        lastBody = res.getContentText() || "";

        if (lastCode == 200 || lastCode == 202) {
          return { success: true, code: lastCode, error: "" };
        }

        if (attempt < 3) Utilities.sleep(1000 * attempt);
      } catch (e) {
        lastBody = e.toString();
        if (attempt < 3) Utilities.sleep(1000 * attempt);
      }
    }
  }

  return {
    success: false,
    code: lastCode,
    error: "Semua endpoint gagal. Terakhir: HTTP " + lastCode + " - " + lastBody
  };
}

function kirimKeIndexNow(urlList) {
  const urls = normalizeUrlList(urlList);
  if (urls.length === 0) return { success: false, code: 0, error: "List kosong" };

  const batches = chunkArray(urls, 500);
  let allSucceeded = true;
  let lastCode = 0;
  let lastError = "";

  for (let i = 0; i < batches.length; i++) {
    const result = submitSingleBatch(batches[i]);
    if (result.success) {
      lastCode = result.code;
    } else {
      allSucceeded = false;
      lastError = result.error;
    }
  }

  return {
    success: allSucceeded,
    code: lastCode,
    error: lastError || "Semua endpoint gagal"
  };
}

