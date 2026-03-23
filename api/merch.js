const PRINTIFY_BASE = 'https://api.printify.com/v1';

export default async function handler(req, res) {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'PRINTIFY_API_TOKEN not configured' });
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // 1. Auto-discover shop ID
    const shopsRes = await fetch(`${PRINTIFY_BASE}/shops.json`, { headers });
    if (!shopsRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch shops from Printify' });
    }
    const shops = await shopsRes.json();
    if (!shops.length) {
      return res.status(404).json({ error: 'No shops found on this Printify account' });
    }
    const shop = shops[0];
    const shopId = shop.id;

    // 2. Fetch published products
    const productsRes = await fetch(
      `${PRINTIFY_BASE}/shops/${shopId}/products.json?limit=20`,
      { headers }
    );
    if (!productsRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch products from Printify' });
    }
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // 3. Filter to only published products and map to frontend-friendly format
    const products = allProducts
      .filter(p => p.visible)
      .map(product => {
        // Get the default image or the first one
        const defaultImage = product.images.find(img => img.is_default) || product.images[0];
        const imageUrl = defaultImage ? defaultImage.src : null;

        // Get all product images
        const images = product.images.map(img => img.src);

        // Calculate minimum price from enabled variants (price is in cents)
        const enabledVariants = product.variants.filter(v => v.is_enabled);
        const prices = enabledVariants.map(v => v.price);
        const minPrice = Math.min(...prices) / 100;
        const maxPrice = Math.max(...prices) / 100;
        const hasVariants = enabledVariants.length > 1;

        // Build external URL for the Pop-Up Store
        const externalUrl = product.external
          ? product.external.link || null
          : null;

        return {
          id: product.id,
          title: product.title,
          image: imageUrl,
          images,
          price: minPrice,
          maxPrice,
          hasVariants,
          externalUrl,
        };
      });

    // Build shop URL from shop data
    const shopUrl = shop.sales_channel_url || null;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    res.status(200).json({ shop: { id: shopId, title: shop.title, url: shopUrl }, products });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
