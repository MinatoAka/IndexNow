// ==========================================
// 2. FUNGSI KURIR (Dipakai oleh semua fungsi di bawah)
// ==========================================
function kirimKeIndexNow(urlList) {
  if (!urlList || urlList.length === 0) return { success: false, code: 0, error: "List kosong" };

  const payload = JSON.stringify({
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
    urlList: urlList
  });

  for (let ep of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = UrlFetchApp.fetch(ep, {
          method: "post",
          contentType: "application/json; charset=utf-8",
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        const code = res.getResponseCode();
        if (code == 200 || code == 202) {
          return { success: true, code: code, error: "" };
        }
        if (attempt < 3) Utilities.sleep(1000 * attempt);
      } catch (e) {
        if (attempt < 3) Utilities.sleep(1000 * attempt);
      }
    }
  }

  return { success: false, code: 0, error: "Semua endpoint gagal" };
}
