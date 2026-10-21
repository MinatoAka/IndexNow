function getSitemapUrls(sitemapUrl, onlyRecent) {
  const seenUrls = {};
  const seenSitemaps = {};
  const urls = [];
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

function fetchAndParse(currentUrl) {
    if (!currentUrl || seenSitemaps[currentUrl]) return;
    seenSitemaps[currentUrl] = true;

    try {
      const response = UrlFetchApp.fetch(currentUrl, { muteHttpExceptions: true });
      const sitemap = response.getContentText();

      if (!sitemap || response.getResponseCode() >= 400) return;

      const xml = XmlService.parse(sitemap);
      const root = xml.getRootElement();
      const rootName = (root.getName() || "").toLowerCase();
      const ns = XmlService.getNamespace("http://www.sitemaps.org/schemas/sitemap/0.9");
      const isSitemapIndex = rootName === "sitemapindex";
      const nodes = isSitemapIndex ? root.getChildren("sitemap", ns) : root.getChildren("url", ns);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const locNode = node.getChild("loc", ns);
        const loc = locNode ? locNode.getText() : "";

        if (!loc) continue;

        if (isSitemapIndex) {
          fetchAndParse(loc);
          continue;
        }

        const lastmodNode = node.getChild("lastmod", ns);
        const lastmodText = lastmodNode ? lastmodNode.getText() : "";
        const lastmod = lastmodText ? new Date(lastmodText) : null;

        if (onlyRecent && lastmod && !isNaN(lastmod.getTime()) && lastmod < sixHoursAgo) continue;

        if (!seenUrls[loc]) {
          seenUrls[loc] = true;
          urls.push(loc);
        }
      }
    } catch (e) {
      // Abaikan sitemap yang gagal diparse; tugas berikutnya tetap berjalan.
    }
  }

  try {
    fetchAndParse(sitemapUrl);
    return { error: "", urls: urls };
  } catch (e) {
    return { error: e.toString(), urls: [] };
  }
}
