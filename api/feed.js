export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLerj-DEth8q7EzA53mekUtVwuWog6n8GQ'
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch YouTube feed' });
    }

    const xml = await response.text();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
