export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCxFN5wHxJ7oig9TF9oadaug'
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
