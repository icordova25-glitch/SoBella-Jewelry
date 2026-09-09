const state = {
  products: [],
  cart: [],
  activeCategory: 'all',
  heroSlides: [],
  activeHeroSlideIndex: 0,
};

const productsEl = document.getElementById('products');
const cartSection = document.querySelector('.checkout-card');
const statusMessage = document.getElementById('statusMessage');
const heroSlidesEl = document.getElementById('heroSlides');
const heroSlideDotsEl = document.getElementById('heroSlideDots');
const productRefreshChannel = window.BroadcastChannel ? new BroadcastChannel('sobella-products') : null;
const categoryButtons = document.querySelectorAll('.category-btn');
const mobileCategoryToggle = document.getElementById('mobileCategoryToggle');
const categoryDrawer = document.getElementById('categoryDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerClose = document.getElementById('drawerClose');
const businessBioEl = document.getElementById('businessBio');
const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
const heroSlidesApiBase = window.location.protocol === 'file:' ? 'http://localhost:3001' : 'https://www.sobellajewelrycoadmin.com';
const fallbackHeroSlides = [
  { id: 'slide-1', image: '/assets/logo/sobella-logo.svg', alt: 'SOBELLA JEWELRY CO. logo' },
  { id: 'slide-2', image: '/assets/placeholders/gallery/gallery-1.svg', alt: 'SOBELLA hero slide 2' },
  { id: 'slide-3', image: '/assets/placeholders/gallery/gallery-2.svg', alt: 'SOBELLA hero slide 3' },
  { id: 'slide-4', image: '/assets/placeholders/gallery/gallery-3.svg', alt: 'SOBELLA hero slide 4' },
  { id: 'slide-5', image: '/assets/placeholders/gallery/gallery-4.svg', alt: 'SOBELLA hero slide 5' },
  { id: 'slide-6', image: '/assets/placeholders/gallery/gallery-5.svg', alt: 'SOBELLA hero slide 6' },
];
let heroSlideIntervalId = null;

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function heroSlidesUrl(path) {
  return `${heroSlidesApiBase}${path}`;
}

function notifyProductRefresh() {
  if (productRefreshChannel) {
    productRefreshChannel.postMessage({ type: 'refresh' });
  }
  localStorage.setItem('sobella-product-refresh', String(Date.now()));
}

async function loadProducts() {
  const response = await fetch(apiUrl('/api/products'));
  state.products = await response.json();
  renderProducts();
}

async function loadBusinessBio() {
  const response = await fetch(apiUrl('/api/business-bio'));
  const data = await response.json();
  if (businessBioEl) {
    businessBioEl.textContent = data.bio || 'A modern jewelry studio crafting elegant pieces with timeless beauty.';
  }
}

function renderHeroSlides() {
  if (!heroSlidesEl || !heroSlideDotsEl) {
    return;
  }

  const slides = state.heroSlides.length ? state.heroSlides : fallbackHeroSlides;
  heroSlidesEl.innerHTML = '';
  heroSlideDotsEl.innerHTML = '';

  slides.forEach((slide, index) => {
    const image = document.createElement('img');
    image.className = `hero-slide${index === state.activeHeroSlideIndex ? ' active' : ''}`;
    image.src = slide.image;
    image.alt = slide.alt;
    image.loading = index === 0 ? 'eager' : 'lazy';
    heroSlidesEl.appendChild(image);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `hero-slide-dot${index === state.activeHeroSlideIndex ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => {
      state.activeHeroSlideIndex = index;
      updateActiveHeroSlide();
      startHeroSlideshow();
    });
    heroSlideDotsEl.appendChild(dot);
  });

  updateActiveHeroSlide();
}

function updateActiveHeroSlide() {
  const slideElements = heroSlidesEl?.querySelectorAll('.hero-slide') || [];
  const dotElements = heroSlideDotsEl?.querySelectorAll('.hero-slide-dot') || [];
  slideElements.forEach((slide, index) => {
    slide.classList.toggle('active', index === state.activeHeroSlideIndex);
  });
  dotElements.forEach((dot, index) => {
    dot.classList.toggle('active', index === state.activeHeroSlideIndex);
  });
}

function startHeroSlideshow() {
  if (heroSlideIntervalId) {
    window.clearInterval(heroSlideIntervalId);
  }

  const slides = state.heroSlides.length ? state.heroSlides : fallbackHeroSlides;
  if (slides.length <= 1) {
    return;
  }

  heroSlideIntervalId = window.setInterval(() => {
    state.activeHeroSlideIndex = (state.activeHeroSlideIndex + 1) % slides.length;
    updateActiveHeroSlide();
  }, 4000);
}

async function loadHeroSlides() {
  try {
    const response = await fetch(heroSlidesUrl('/api/hero-slides'));
    if (!response.ok) {
      throw new Error(`Hero slides request failed with status ${response.status}`);
    }
    const slides = await response.json();
    state.heroSlides = Array.isArray(slides) && slides.length ? slides.slice(0, 6) : fallbackHeroSlides;
  } catch (error) {
    state.heroSlides = fallbackHeroSlides;
  }
  state.activeHeroSlideIndex = 0;
  renderHeroSlides();
  startHeroSlideshow();
}

function renderProducts() {
  productsEl.innerHTML = '';

  const normalizeCategory = (value) => String(value || '').trim().toLowerCase();
  const selectedCategory = normalizeCategory(state.activeCategory);

  const filteredProducts = selectedCategory === 'all'
    ? state.products
    : state.products.filter((product) => {
        const category = normalizeCategory(product.category);
        return category === selectedCategory;
      });

  filteredProducts.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const imageMarkup = product.image ? `<img class="product-image" src="${product.image}" alt="${product.name}" />` : '';
    card.innerHTML = `
      ${imageMarkup}
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p class="price">$${product.price}</p>
      <div class="product-actions">
        ${product.image ? `<button class="secondary-btn" data-action="view" data-image="${product.image}">View</button>` : ''}
        <button data-sku="${product.sku}">Add to cart</button>
      </div>
    `;
    const addButton = card.querySelector('button[data-sku]');
    addButton.addEventListener('click', () => addToCart(product.sku));
    const viewButton = card.querySelector('button[data-action="view"]');
    if (viewButton) {
      viewButton.addEventListener('click', () => showImagePreview(viewButton.dataset.image));
    }
    productsEl.appendChild(card);
  });
}

function saveCart() {
  localStorage.setItem('sobella-cart', JSON.stringify(state.cart));
}

function loadCart() {
  const raw = localStorage.getItem('sobella-cart');
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      state.cart = parsed;
    }
  } catch (error) {
    console.warn('Unable to parse stored cart', error);
  }
}

function addToCart(sku) {
  const existing = state.cart.find((item) => item.sku === sku);
  if (existing) {
    existing.quantity += 1;
  } else {
    const product = state.products.find((item) => item.sku === sku);
    state.cart.push({ sku, quantity: 1, name: product.name, price: product.price });
  }
  saveCart();
  renderCart();
}

function renderCart() {
  if (cartSection) {
    cartSection.querySelector('h2').textContent = state.cart.length ? 'Bag ready' : 'Bag';
    const message = state.cart.length
      ? `${state.cart.reduce((sum, item) => sum + item.quantity, 0)} item${state.cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'} ready for review`
      : 'Review your selections before checkout.';
    cartSection.querySelector('p').textContent = message;
  }
}

function showImagePreview(imageUrl) {
  const overlay = document.createElement('div');
  overlay.className = 'image-preview-overlay';
  overlay.innerHTML = `
    <div class="image-preview-card">
      <button class="image-preview-close" type="button" aria-label="Close image preview">×</button>
      <img src="${imageUrl}" alt="Product preview" />
    </div>
  `;
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.classList.contains('image-preview-close')) {
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

function showReviewAndPay() {
  if (cartSection) {
    let reviewButton = cartSection.querySelector('.review-pay-btn');

    if (!reviewButton) {
      reviewButton = document.createElement('button');
      reviewButton.className = 'review-pay-btn';
      reviewButton.type = 'button';
      reviewButton.textContent = 'Review and Pay';
      cartSection.appendChild(reviewButton);
    }

    if (reviewButton.dataset.bound === 'true') {
      return;
    }

    reviewButton.addEventListener('click', () => {
      if (state.cart.length === 0) {
        statusMessage.textContent = 'Add at least one item to your bag first.';
        return;
      }
      window.location.href = 'review.html';
    });
    reviewButton.dataset.bound = 'true';
  }
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  if (mobileCategoryToggle) {
    mobileCategoryToggle.setAttribute('aria-expanded', 'false');
  }
}

function openDrawer() {
  document.body.classList.add('drawer-open');
  if (mobileCategoryToggle) {
    mobileCategoryToggle.setAttribute('aria-expanded', 'true');
  }
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.activeCategory = button.dataset.category;
    categoryButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    renderProducts();
    closeDrawer();
  });
});

if (mobileCategoryToggle) {
  mobileCategoryToggle.addEventListener('click', openDrawer);
}

if (productRefreshChannel) {
  productRefreshChannel.addEventListener('message', () => loadProducts());
}
window.addEventListener('storage', (event) => {
  if (event.key === 'sobella-product-refresh') {
    loadProducts();
  }
});

if (drawerClose) {
  drawerClose.addEventListener('click', closeDrawer);
}

if (drawerBackdrop) {
  drawerBackdrop.addEventListener('click', closeDrawer);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDrawer();
  }
});

loadCart();
showReviewAndPay();
loadProducts();
loadBusinessBio();
loadHeroSlides();
renderCart();
