const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Stripe = require('stripe');
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
    category: 'earrings',
    name: 'Pearl Drop Earrings',
    description: 'Elegant pearl earrings for special occasions.',
    price: 89,
    stock: 12,
  },
  {
    sku: 'EARR-002',
    category: 'earrings',
    name: 'Golden Halo Studs',
    description: 'Classic stud earrings with a bright polished finish.',
    price: 74,
    stock: 9,
  },
  {
    sku: 'EARR-003',
    category: 'earrings',
    name: 'Luna Drop Earrings',
    description: 'Soft drop earrings designed for evening glow.',
    price: 98,
    stock: 6,
  },
  {
    sku: 'EARR-004',
    category: 'earrings',
    name: 'Twist Hoop Earrings',
    description: 'Lightweight hoops with a modern twisted silhouette.',
    price: 82,
    stock: 10,
  },
  {
    sku: 'EARR-005',
    category: 'earrings',
    name: 'Crystal Bloom Earrings',
    description: 'A delicate floral sparkle for elevated everyday wear.',
    price: 105,
    stock: 5,
  },
  {
    sku: 'EARR-006',
    category: 'earrings',
    name: 'Minimal Bar Earrings',
    description: 'Slim statement earrings with a refined gold profile.',
    price: 68,
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
    sku: 'NECK-002',
    category: 'necklaces',
    name: 'Celeste Pendant Necklace',
    description: 'A luminous pendant necklace with a delicate chain.',
    price: 132,
    stock: 7,
  },
  {
    sku: 'NECK-003',
    category: 'necklaces',
    name: 'Layered Orbit Necklace',
    description: 'Two graceful chains designed for stacked styling.',
    price: 144,
    stock: 6,
  },
  {
    sku: 'NECK-004',
    category: 'necklaces',
    name: 'Pearl Line Necklace',
    description: 'Modern pearl accents balanced with clean gold lines.',
    price: 128,
    stock: 9,
  },
  {
    sku: 'NECK-005',
    category: 'necklaces',
    name: 'Solstice Chain',
    description: 'A sculptural chain necklace for warm minimal styling.',
    price: 156,
    stock: 4,
  },
  {
    sku: 'NECK-006',
    category: 'necklaces',
    name: 'Velvet Light Necklace',
    description: 'Soft shine and a sleek silhouette for daily layering.',
    price: 118,
    stock: 11,
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
    sku: 'RING-002',
    category: 'rings',
    name: 'Aurora Band',
    description: 'A sleek stacking band with a polished finish.',
    price: 92,
    stock: 12,
  },
  {
    sku: 'RING-003',
    category: 'rings',
    name: 'Pearl Crest Ring',
    description: 'A contemporary ring centered with a luminous pearl.',
    price: 138,
    stock: 5,
  },
  {
    sku: 'RING-004',
    category: 'rings',
    name: 'Nova Signet Ring',
    description: 'Bold signet lines softened with a warm golden sheen.',
    price: 147,
    stock: 8,
  },
  {
    sku: 'RING-005',
    category: 'rings',
    name: 'Twilight Open Ring',
    description: 'Open-ended design with a balanced minimal profile.',
    price: 101,
    stock: 9,
  },
  {
    sku: 'RING-006',
    category: 'rings',
    name: 'Radiant Curve Ring',
    description: 'A curved band crafted to catch light from every angle.',
    price: 115,
    stock: 6,
  },
  {
    sku: 'BRACE-001',
    category: 'bracelets',
    name: 'Silver Cuff Bracelet',
    description: 'A polished bracelet with a timeless finish.',
    price: 95,
    stock: 7,
  },
  {
    sku: 'BRACE-002',
    category: 'bracelets',
    name: 'Golden Link Bracelet',
    description: 'Classic links reimagined with a clean modern profile.',
    price: 104,
    stock: 10,
  },
  {
    sku: 'BRACE-003',
    category: 'bracelets',
    name: 'Pearl Chain Bracelet',
    description: 'A slim chain bracelet finished with pearl detail.',
    price: 88,
    stock: 8,
  },
  {
    sku: 'BRACE-004',
    category: 'bracelets',
    name: 'Lustre Tennis Bracelet',
    description: 'A refined bracelet with subtle sparkle and structure.',
    price: 162,
    stock: 4,
  },
  {
    sku: 'BRACE-005',
    category: 'bracelets',
    name: 'Sculpted Open Bracelet',
    description: 'An airy open bracelet with soft architectural lines.',
    price: 110,
    stock: 7,
  },
  {
    sku: 'BRACE-006',
    category: 'bracelets',
    name: 'Velvet Rope Bracelet',
    description: 'Textured rope detailing for a richer layered look.',
    price: 96,
    stock: 9,
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

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }));
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

function getStripeClient() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

function getCheckoutBaseUrl(req) {
  const configured = String(process.env.SITE_URL || '').trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim() || 'https';
  const host = String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();
  return `${protocol}://${host}`.replace(/\/$/, '');
}

function processPayment(paymentMethod, cardData = {}) {
  if (paymentMethod !== 'card') {
    return { success: true, message: 'Bank transfer selected. No card payment required.' };
  }

  const cardNumber = String(cardData.cardNumber || '').replace(/\s+/g, '');
  const expiry = String(cardData.expiry || '').trim();
  const cvc = String(cardData.cvc || '').trim();

  if (cardNumber.length < 12 || cardNumber.length > 19) {
    return { success: false, message: 'Payment failed: invalid card number.' };
  }
  if (cvc.length < 3) {
    return { success: false, message: 'Payment failed: invalid CVC.' };
  }
  if (!expiry.includes('/')) {
    return { success: false, message: 'Payment failed: invalid expiry date.' };
  }

  const [expiryMonthRaw, expiryYearRaw] = expiry.split('/', 2);
  if (!/^\d+$/.test(expiryMonthRaw) || !/^\d+$/.test(expiryYearRaw)) {
    return { success: false, message: 'Payment failed: invalid expiry date.' };
  }

  const expiryMonth = Number(expiryMonthRaw);
  const expiryYear = Number(expiryYearRaw);
  if (expiryMonth < 1 || expiryMonth > 12) {
    return { success: false, message: 'Payment failed: invalid expiry month.' };
  }
  if (expiryYear < 24) {
    return { success: false, message: 'Payment failed: card expired.' };
  }
  if (cardNumber.endsWith('1111') || cardNumber.endsWith('0000')) {
    return { success: false, message: 'Payment failed: card was declined.' };
  }

  return { success: true, message: 'Payment processed successfully.' };
}

function buildOrderLineItems(products, items) {
  const inventoryBySku = new Map(products.map((product) => [product.sku, product]));
  const orderedItems = [];

  for (const item of items) {
    const product = inventoryBySku.get(item.sku);

    if (!product) {
      throw new Error(`Product ${item.sku} was not found.`);
    }

    const quantity = Math.max(1, Number(item.quantity || 1));
    if (product.stock < quantity) {
      throw new Error(`Not enough stock for ${product.name}.`);
    }

    orderedItems.push({
      sku: product.sku,
      name: product.name,
      quantity,
      price: product.price,
      lineTotal: product.price * quantity,
    });
  }

  return orderedItems;
}

function buildOrderSummary(orderedItems) {
  const subtotal = orderedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal > 0 ? 12 : 0;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

async function createOrder({ customerName, email, items, paymentMethod = 'card', status = 'paid', source = 'manual', paymentId = null }) {
  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  const orderedItems = buildOrderLineItems(products, items);

  for (const lineItem of orderedItems) {
    const product = products.find((entry) => entry.sku === lineItem.sku);
    if (product) {
      product.stock -= lineItem.quantity;
    }
  }

  const totals = buildOrderSummary(orderedItems);
  const orders = await readStore(STORAGE_KEYS.orders, ordersPath, defaultOrders);
  const newOrder = {
    id: `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    customerName,
    email,
    items: orderedItems,
    paymentMethod,
    status,
    total: totals.total,
    shipping: totals.shipping,
    source,
    paymentId,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  await writeStore(STORAGE_KEYS.products, productsPath, products);
  await writeStore(STORAGE_KEYS.orders, ordersPath, orders);
  return newOrder;
}

async function createCheckoutSession(req, { customerName, email, items, paymentMethod = 'card' }) {
  const stripeClient = getStripeClient();
  if (!stripeClient) {
    const order = await createOrder({ customerName, email, items, paymentMethod, source: 'demo' });
    return { success: true, order, checkoutUrl: null, demo: true };
  }

  const products = await readStore(STORAGE_KEYS.products, productsPath, defaultProducts);
  const orderedItems = buildOrderLineItems(products, items);
  const totals = buildOrderSummary(orderedItems);
  const baseUrl = getCheckoutBaseUrl(req);
  const successUrl = String(process.env.STRIPE_SUCCESS_URL || `${baseUrl}/review?payment=success`).trim();
  const cancelUrl = String(process.env.STRIPE_CANCEL_URL || `${baseUrl}/review?payment=cancelled`).trim();

  const lineItems = orderedItems.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  if (totals.shipping > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shipping' },
        unit_amount: Math.round(totals.shipping * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      customerName,
      email,
      items: JSON.stringify(items),
      paymentMethod,
    },
  });

  return { success: true, checkoutUrl: session.url, demo: false };
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

  try {
    const order = await createOrder({ customerName, email, items, paymentMethod, source: 'manual' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not create order.' });
  }
});

app.post('/api/checkout/create-session', async (req, res) => {
  const { customerName, email, items, paymentMethod = 'card', cardData = {} } = req.body || {};

  if (!customerName || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please complete the checkout form.' });
  }

  if (paymentMethod === 'card') {
    const paymentResult = processPayment(paymentMethod, cardData);
    if (!paymentResult.success) {
      return res.status(400).json({ success: false, error: paymentResult.message });
    }
  }

  try {
    const result = await createCheckoutSession(req, { customerName, email, items, paymentMethod });
    res.json({ ...result, paymentStatus: 'processed' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not create checkout session.' });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  const stripeClient = getStripeClient();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  if (!stripeClient || !webhookSecret) {
    return res.status(400).json({ error: 'Stripe is not configured.' });
  }

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid webhook signature.' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    try {
      await createOrder({
        customerName: metadata.customerName || '',
        email: metadata.email || '',
        items: JSON.parse(metadata.items || '[]'),
        paymentMethod: metadata.paymentMethod || 'card',
        source: 'stripe',
        paymentId: session.id,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Unable to finalize order.' });
    }
  }

  res.json({ received: true });
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
