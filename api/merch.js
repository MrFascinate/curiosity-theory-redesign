const PRINTIFY_BASE = 'https://api.printify.com/v1';

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for token under multiple possible env var names
  const token = process.env.Printify_API_token
    || process.env.PRINTIFY_API_TOKEN
    || process.env.PRINTIFY_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Merch service is not configured' });
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

    // 2. Fetch products
    const productsRes = await fetch(
      `${PRINTIFY_BASE}/shops/${shopId}/products.json?limit=20`,
      { headers }
    );
    if (!productsRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch products from Printify' });
    }
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // 3. Map to frontend-friendly format (include all products, not just visible)
    const products = allProducts.map(product => {
      // Get the default image or the first one
      const defaultImage = product.images.find(img => img.is_default) || product.images[0];
      const imageUrl = defaultImage ? defaultImage.src : null;

      // Get all product images
      const images = product.images.map(img => img.src);

      // Calculate minimum price from enabled variants (price is in cents)
      const enabledVariants = product.variants.filter(v => v.is_enabled);
      const prices = enabledVariants.map(v => v.price);
      const minPrice = prices.length ? Math.min(...prices) / 100 : 0;
      const maxPrice = prices.length ? Math.max(...prices) / 100 : 0;
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
        visible: product.visible,
        externalUrl,
      };
    });

    // Build shop URL from shop data
    const shopUrl = shop.sales_channel_url || null;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    res.status(200).json({
      shop: { id: shopId, title: shop.title, url: shopUrl },
      products,
      totalFromApi: allProducts.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
