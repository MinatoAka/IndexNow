// ==========================================
// FUNGSI SITEMAP (Kolektor URL)
// ==========================================

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
      const statusCode = response.getResponseCode();

      if (statusCode >= 400) return;

      const sitemap = response.getContentText();
      if (!sitemap) return;

      const xml = XmlService.parse(sitemap);
      const root = xml.getRootElement();
      const rootName = (root.getName() || '').toLowerCase();
      const defaultNamespace = root.getNamespace();
      const sitemapNs = defaultNamespace || XmlService.getNamespace('http://www.sitemaps.org/schemas/sitemap/0.9');
      const isSitemapIndex = rootName === 'sitemapindex';
      const nodes = isSitemapIndex ? root.getChildren('sitemap', sitemapNs) : root.getChildren('url', sitemapNs);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const locNode = node.getChild('loc', sitemapNs);
        const loc = locNode ? String(locNode.getText()).trim() : '';

        if (!loc) continue;

        if (isSitemapIndex) {
          fetchAndParse(loc);
          continue;
        }

        const lastmodNode = node.getChild('lastmod', sitemapNs);
        const lastmodText = lastmodNode ? String(lastmodNode.getText()).trim() : '';
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
    return { error: '', urls: urls };
  } catch (e) {
    return { error: e.toString(), urls: [] };
  }
}
