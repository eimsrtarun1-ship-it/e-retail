/* ============================================================
   Fieldstone Goods — storefront behaviour
   ============================================================ */

const CATEGORY_GLYPH = { Pantry: '🍯', Home: '🏺', Apothecary: '🕯️', Garden: '🌱' };

let state = { category: 'All', query: '' };

function getFilteredProducts() {
  const products = DB.getProducts();
  return products.filter(p => {
    const matchesCat = state.category === 'All' || p.category === state.category;
    const matchesQuery = !state.query || p.name.toLowerCase().includes(state.query) || p.desc.toLowerCase().includes(state.query);
    return matchesCat && matchesQuery;
  });
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const list = getFilteredProducts();
  document.getElementById('resultCount').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  document.getElementById('productTotal').textContent = DB.getProducts().length;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <h3>Nothing on the shelf for that</h3>
      <p>Try a different category or search term.</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="card">
      <div class="card-media">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <span class="glyph">${CATEGORY_GLYPH[p.category] || '📦'}</span>
        ${p.stock === 0 ? `<div class="stock-out">Out of stock</div>` : ''}
      </div>
      <div class="card-body">
        <span class="card-cat">${p.category} · ${p.sku}</span>
        <h3 class="card-name">${p.name}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-foot">
          <div class="price-tag">${DB.fmt(p.price)}<span class="unit">${p.unit}</span></div>
          <button class="btn btn-sm ${p.stock === 0 ? 'btn-outline' : 'btn-primary'}" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Sold out' : 'Add +'}
          </button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add')));
  });
}

function addToCart(productId) {
  const cart = DB.getCart();
  const line = cart.find(c => c.id === productId);
  const product = DB.getProducts().find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  const currentQty = line ? line.qty : 0;
  if (currentQty >= product.stock) { showToast(`Only ${product.stock} left in stock`); return; }
  if (line) line.qty += 1; else cart.push({ id: productId, qty: 1 });
  DB.saveCart(cart);
  updateCartUI();
  showToast(`Added ${product.name} to your basket`);
}

function updateCartQty(productId, delta) {
  const cart = DB.getCart();
  const line = cart.find(c => c.id === productId);
  if (!line) return;
  const product = DB.getProducts().find(p => p.id === productId);
  line.qty += delta;
  if (line.qty > product.stock) line.qty = product.stock;
  if (line.qty <= 0) {
    const idx = cart.indexOf(line);
    cart.splice(idx, 1);
  }
  DB.saveCart(cart);
  updateCartUI();
}

function removeFromCart(productId) {
  DB.saveCart(DB.getCart().filter(c => c.id !== productId));
  updateCartUI();
}

function cartTotal() {
  const cart = DB.getCart();
  const products = DB.getProducts();
  return cart.reduce((sum, line) => {
    const p = products.find(x => x.id === line.id);
    return sum + (p ? p.price * line.qty : 0);
  }, 0);
}

function updateCartUI() {
  const cart = DB.getCart();
  const products = DB.getProducts();
  const count = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = DB.fmt(cartTotal());
  document.getElementById('checkoutBtn').disabled = cart.length === 0;

  const body = document.getElementById('cartBody');
  if (cart.length === 0) {
    body.innerHTML = `<div class="empty-state"><h3>Your basket is empty</h3><p>Add something from the catalog.</p></div>`;
    return;
  }
  body.innerHTML = cart.map(line => {
    const p = products.find(x => x.id === line.id);
    if (!p) return '';
    return `
    <div class="cart-line">
      <div class="glyph-sm">${CATEGORY_GLYPH[p.category] || '📦'}</div>
      <div class="cart-line-info">
        <div class="n">${p.name}</div>
        <div class="p mono">${DB.fmt(p.price)} each</div>
        <div class="qty-row">
          <button class="qty-btn" data-dec="${p.id}">−</button>
          <span class="n mono">${line.qty}</span>
          <button class="qty-btn" data-inc="${p.id}">+</button>
          <button class="remove-link" data-remove="${p.id}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');

  body.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => updateCartQty(b.getAttribute('data-inc'), 1)));
  body.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => updateCartQty(b.getAttribute('data-dec'), -1)));
  body.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removeFromCart(b.getAttribute('data-remove'))));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Drawer / modal wiring ---------- */
function openCart() {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
}
function closeCartDrawer() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
}

function placeOrder(formData) {
  const cart = DB.getCart();
  const products = DB.getProducts();
  const items = cart.map(line => {
    const p = products.find(x => x.id === line.id);
    return { id: p.id, name: p.name, price: p.price, qty: line.qty };
  });
  const total = cartTotal();

  // decrement stock
  const updatedProducts = products.map(p => {
    const line = cart.find(c => c.id === p.id);
    return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
  });
  DB.saveProducts(updatedProducts);

  const orders = DB.getOrders();
  const id = 'ORD-' + String(orders.length + 1).padStart(4, '0');
  const order = {
    id, date: new Date().toISOString(), items, total,
    customer: { name: formData.name, email: formData.email, address: formData.address, city: formData.city, zip: formData.zip },
    status: 'Pending',
  };
  orders.unshift(order);
  DB.saveOrders(orders);
  DB.saveCart([]);
  return order;
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCartDrawer);
  document.getElementById('overlay').addEventListener('click', closeCartDrawer);

  document.getElementById('chipRail').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.getAttribute('data-cat');
    renderProducts();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  const checkoutOverlay = document.getElementById('checkoutOverlay');
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (DB.getCart().length === 0) return;
    closeCartDrawer();
    checkoutOverlay.classList.add('open');
  });
  document.getElementById('closeCheckout').addEventListener('click', () => checkoutOverlay.classList.remove('open'));

  document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const order = placeOrder(data);
    checkoutOverlay.classList.remove('open');
    document.getElementById('confirmOrderId').textContent = `${order.id} · ${DB.fmt(order.total)}`;
    document.getElementById('confirmOverlay').classList.add('open');
    e.target.reset();
    renderProducts();
    updateCartUI();
  });

  const confirmOverlay = document.getElementById('confirmOverlay');
  const closeConfirm = () => confirmOverlay.classList.remove('open');
  document.getElementById('closeConfirm').addEventListener('click', closeConfirm);
  document.getElementById('doneConfirm').addEventListener('click', closeConfirm);
});
