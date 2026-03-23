export default async function handler(req, res) {
  const PLAYLIST_FEED =
    'https://www.youtube.com/feeds/videos.xml?playlist_id=PLerj-DEth8q7EzA53mekUtVwuWog6n8GQ';

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/xml, text/xml, */*',
  };

  try {
    const response = await fetch(PLAYLIST_FEED, { headers });

    if (!response.ok) {
      // Fallback: try a CORS proxy as a last resort
      const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(PLAYLIST_FEED);
      const fallback = await fetch(proxy);
      if (!fallback.ok) {
        return res.status(502).json({ error: 'Failed to fetch YouTube feed' });
      }
      const xml = await fallback.text();
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
      return res.status(200).send(xml);
    }

    const xml = await response.text();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
