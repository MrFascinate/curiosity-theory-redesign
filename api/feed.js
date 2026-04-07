export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PLAYLIST_FEED =
    'https://www.youtube.com/feeds/videos.xml?playlist_id=PLerj-DEth8q7EzA53mekUtVwuWog6n8GQ';

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Try multiple strategies in order
  const strategies = [
    // 1. Direct fetch with browser-like headers
    () => fetch(PLAYLIST_FEED, { headers }),
    // 2. allorigins proxy
    () => fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(PLAYLIST_FEED)),
    // 3. corsproxy.io
    () => fetch('https://corsproxy.io/?' + encodeURIComponent(PLAYLIST_FEED)),
  ];

  for (const tryFetch of strategies) {
    try {
      const response = await tryFetch();
      if (!response.ok) continue;

      const xml = await response.text();
      // Verify it's actually XML with feed entries
      if (!xml.includes('<entry>') && !xml.includes('<entry ')) continue;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
      return res.status(200).send(xml);
    } catch {
      continue;
    }
  }

  return res.status(502).json({ error: 'Failed to fetch YouTube feed from all sources' });
}
