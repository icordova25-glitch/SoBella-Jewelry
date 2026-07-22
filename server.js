const express = require('express');
const path = require('path');
const fs = require('fs');
let kv = null;

try {
  // Optional dependency in local dev; enabled automatically in Vercel when env vars exist.
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
} catch (error) {
  kv = null;
}

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const productsPath = path.join(dataDir, 'products.json');
const ordersPath = path.join(dataDir, 'orders.json');
const backofficeDir = path.join(__dirname, 'backoffice');
const businessBioPath = path.join(dataDir, 'business-bio.json');
const bankInfoPath = path.join(dataDir, 'bank-info.json');

const STORAGE_KEYS = {
  products: 'sobella:products',
  orders: 'sobella:orders',
  businessBio: 'sobella:businessBio',
  bankInfo: 'sobella:bankInfo',
};

const defaultProducts = [
  {
    sku: 'EARR-001',
    category: 'earings',
    name: 'Pearl Drop Earrings',
    description: 'Elegant pearl earrings for special occasions.',
    price: 89,
    stock: 12,
  },
  {
    sku: 'NECK-001',
    category: 'necklaces',
    name: 'Gold Chain Necklace',
    description: 'Layered gold necklace with a modern finish.',
    price: 120,
    stock: 8,
  },
  {
    sku: 'RING-001',
    category: 'rings',
    name: 'Diamond Accent Ring',
    description: 'A refined ring with a subtle sparkle.',
    price: 150,
    stock: 5,
  },
  {
    sku: 'BRACE-001',
    category: 'bracelets',
    name: 'Silver Cuff Bracelet',
    description: 'A polished bracelet with a timeless finish.',
    price: 95,
    stock: 7,
  },
];

const defaultOrders = [];
const defaultBusinessBio = {
  bio: 'SoBella Jewelry creates timeless, elegant pieces that celebrate modern love, personal style, and everyday luxury.',
};
const defaultBankInfo = {
  accountHolder: '',
  bankName: '',
  accountNumber: '',
  routingNumber: '',
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/backoffice', express.static(backofficeDir));

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function hasKvConfigured() {
  return Boolean(kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readStore(key, filePath, fallback) {
  if (hasKvConfigured()) {
    const value = await kv.get(key);
    if (value !== null && value !== undefined) {
      return value;
    }
    await kv.set(key, fallback);
    return fallback;
  }

  return readJson(filePath, fallback);
}

async function writeStore(key, filePath, data) {
  if (hasKvConfigured()) {
    await kv.set(key, data);
    return;
  }

  writeJson(filePath, data);
}

app.get('/api/products', async (req, res) => {
  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  res.json(products);
});

app.get('/api/health/storage', (req, res) => {
  const usingKv = hasKvConfigured();
  res.json({
    ok: true,
    storage: usingKv ? 'kv' : 'file',
    runtime: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/orders', async (req, res) => {
  const { customerName, email, items, paymentMethod } = req.body;

  if (!customerName || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please complete the checkout form.' });
  }

  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  const inventoryBySku = new Map(products.map((product) => [product.sku, product]));
  const orderedItems = [];

  for (const item of items) {
    const product = inventoryBySku.get(item.sku);

    if (!product) {
      return res.status(400).json({ error: `Product ${item.sku} was not found.` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
    }

    product.stock -= item.quantity;
    orderedItems.push({
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      lineTotal: product.price * item.quantity,
    });
  }

  const subtotal = orderedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal > 0 ? 12 : 0;
  const total = subtotal + shipping;

  const orders = await readStore(STORAGE_KEYS.orders, ordersPath, defaultOrders);
  const newOrder = {
    id: `ORD-${Date.now()}`,
    customerName,
    email,
    items: orderedItems,
    paymentMethod: paymentMethod || 'card',
    status: 'paid',
    total,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  await writeStore(STORAGE_KEYS.products, productsPath, products);
  await writeStore(STORAGE_KEYS.orders, ordersPath, orders);

  res.json({ success: true, order: newOrder });
});

app.get('/api/orders', async (req, res) => {
  const orders = await readStore(STORAGE_KEYS.orders, ordersPath, defaultOrders);
  res.json(orders);
});

app.get('/api/business-bio', async (req, res) => {
  const bio = await readStore(STORAGE_KEYS.businessBio, businessBioPath, defaultBusinessBio);
  res.json(bio);
});

app.post('/api/business-bio', async (req, res) => {
  const payload = {
    bio: String(req.body?.bio || '').slice(0, 500),
  };
  await writeStore(STORAGE_KEYS.businessBio, businessBioPath, payload);
  res.json(payload);
});

app.get('/api/business-bank-info', async (req, res) => {
  const bankInfo = await readStore(STORAGE_KEYS.bankInfo, bankInfoPath, defaultBankInfo);
  res.json(bankInfo);
});

app.post('/api/business-bank-info', async (req, res) => {
  const payload = {
    accountHolder: String(req.body?.accountHolder || '').trim(),
    bankName: String(req.body?.bankName || '').trim(),
    accountNumber: String(req.body?.accountNumber || '').trim(),
    routingNumber: String(req.body?.routingNumber || '').trim(),
  };
  await writeStore(STORAGE_KEYS.bankInfo, bankInfoPath, payload);
  res.json(payload);
});

app.post('/api/admin/products', async (req, res) => {
  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  const payload = req.body || {};

  if (!payload.sku || !payload.name || !payload.category) {
    return res.status(400).json({ error: 'SKU, name, and category are required.' });
  }

  const existing = products.find((item) => item.sku === payload.sku);
  if (existing) {
    return res.status(400).json({ error: `Product ${payload.sku} already exists.` });
  }

  const product = {
    sku: String(payload.sku).trim(),
    category: String(payload.category).trim(),
    name: String(payload.name).trim(),
    description: String(payload.description || '').trim(),
    price: Number(payload.price || 0),
    stock: Number(payload.stock || 0),
    image: String(payload.image || ''),
  };

  products.push(product);
  await writeStore(STORAGE_KEYS.products, productsPath, products);
  res.json({ success: true, product });
});

app.put('/api/admin/products/:sku', async (req, res) => {
  const { sku } = req.params;
  const updates = req.body || {};
  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  const index = products.findIndex((item) => item.sku === sku);

  if (index === -1) {
    return res.status(404).json({ error: `Product ${sku} was not found.` });
  }

  const product = products[index];
  const operation = updates.operation;

  if (operation === 'restock') {
    product.stock = Number(product.stock || 0) + 1;
  } else if (operation === 'decrease') {
    product.stock = Math.max(0, Number(product.stock || 0) - 1);
  } else if (operation === 'delete') {
    products.splice(index, 1);
    await writeStore(STORAGE_KEYS.products, productsPath, products);
    return res.json({ deleted: true, sku });
  } else {
    if (updates.name !== undefined) {
      product.name = String(updates.name).trim();
    }
    if (updates.category !== undefined) {
      product.category = String(updates.category).trim();
    }
    if (updates.description !== undefined) {
      product.description = String(updates.description);
    }
    if (updates.price !== undefined) {
      product.price = Number(updates.price);
    }
    if (updates.stock !== undefined) {
      product.stock = Math.max(0, Number(updates.stock));
    }
    if (updates.image !== undefined) {
      product.image = String(updates.image || '');
    }
  }

  products[index] = product;
  await writeStore(STORAGE_KEYS.products, productsPath, products);
  res.json({ success: true, product });
});

app.get('/backoffice', (req, res) => {
  res.sendFile(path.join(backofficeDir, 'admin.html'));
});

app.get('/backoffice/admin', (req, res) => {
  res.redirect(302, '/backoffice/admin.html');
});

app.get('/backoffice/orders', (req, res) => {
  res.redirect(302, '/backoffice/orders.html');
});

app.get('/admin', (req, res) => {
  res.redirect(302, '/backoffice/admin.html');
});

app.get('/admin.html', (req, res) => {
  res.redirect(302, '/backoffice/admin.html');
});

app.get('/orders', (req, res) => {
  res.redirect(302, '/backoffice/orders.html');
});

app.get('/orders.html', (req, res) => {
  res.redirect(302, '/backoffice/orders.html');
});

app.get('/review', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'review.html'));
});

app.get('/backoffice/*', (req, res) => {
  res.redirect(302, '/backoffice/admin.html');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Jewelry store running at http://localhost:${port}`);
});
