/* ============================================================
   Fieldstone Goods — admin behaviour
   NOTE: this login is a client-side demo only (see README). It
   is not real authentication — anyone with the password in the
   page source can sign in. Don't use this pattern in production.
   ============================================================ */

const CATEGORY_GLYPH = { Pantry: '🍯', Home: '🏺', Apothecary: '🕯️', Garden: '🌱' };
const ADMIN_PASSWORD = 'fieldstone2026';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Auth ---------- */
function checkAuth() {
  if (sessionStorage.getItem(DB.KEYS.auth) === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminShell').style.display = 'grid';
    renderAll();
  }
}
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = document.getElementById('passwordInput').value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem(DB.KEYS.auth, 'true');
    checkAuth();
  } else {
    document.getElementById('loginError').classList.add('show');
  }
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(DB.KEYS.auth);
  location.reload();
});

/* ---------- Navigation ---------- */
document.querySelectorAll('.side-link[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.side-link[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + btn.getAttribute('data-view')).classList.add('active');
  });
});

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const products = DB.getProducts();
  const orders = DB.getOrders();
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOOS').textContent = products.filter(p => p.stock === 0).length;
  document.getElementById('statOrders').textContent = orders.length;
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('statRevenue').textContent = DB.fmt(revenue);

  const body = document.getElementById('recentOrdersBody');
  const recent = orders.slice(0, 6);
  body.innerHTML = recent.length ? recent.map(o => `
    <tr>
      <td class="mono">${o.id}</td>
      <td>${o.customer.name}</td>
      <td>${o.items.reduce((s, i) => s + i.qty, 0)} items</td>
      <td class="mono">${DB.fmt(o.total)}</td>
      <td><span class="pill ${o.status.toLowerCase()}">${o.status}</span></td>
    </tr>
  `).join('') : `<tr><td colspan="5" class="no-data">No orders yet — they'll show up here once a customer checks out.</td></tr>`;
}

/* ---------- Products ---------- */
function stockPill(stock) {
  if (stock === 0) return `<span class="pill out">Out of stock</span>`;
  if (stock <= 10) return `<span class="pill low">Low · ${stock} left</span>`;
  return `<span class="pill ok">In stock · ${stock}</span>`;
}

function renderProductsTable() {
  const products = DB.getProducts();
  const body = document.getElementById('productsBody');
  body.innerHTML = products.length ? products.map(p => `
    <tr>
      <td>
        <div class="cell-prod">
          <span class="g">${CATEGORY_GLYPH[p.category] || '📦'}</span>
          <div><div class="n">${p.name}</div><div class="s">${p.sku}</div></div>
        </div>
      </td>
      <td>${p.category}</td>
      <td class="mono">${DB.fmt(p.price)}</td>
      <td>${stockPill(p.stock)}</td>
      <td>${p.badge ? `<span class="pill ok">${p.badge}</span>` : '—'}</td>
      <td>
        <div class="row-actions">
          <button data-edit="${p.id}">Edit</button>
          <button class="danger" data-del="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="6" class="no-data">No products yet. Add your first one above.</td></tr>`;

  body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openProductModal(b.getAttribute('data-edit'))));
  body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteProduct(b.getAttribute('data-del'))));
}

function deleteProduct(id) {
  const products = DB.getProducts();
  const p = products.find(x => x.id === id);
  if (!confirm(`Remove "${p.name}" from the catalog? This can't be undone.`)) return;
  DB.saveProducts(products.filter(x => x.id !== id));
  renderProductsTable();
  renderDashboard();
  showToast('Product removed');
}

function openProductModal(id) {
  const overlay = document.getElementById('productModalOverlay');
  const form = document.getElementById('productForm');
  form.reset();
  if (id) {
    const p = DB.getProducts().find(x => x.id === id);
    document.getElementById('productModalTitle').textContent = 'Edit product';
    document.getElementById('productId').value = p.id;
    document.getElementById('fName').value = p.name;
    document.getElementById('fCategory').value = p.category;
    document.getElementById('fSku').value = p.sku;
    document.getElementById('fPrice').value = p.price;
    document.getElementById('fStock').value = p.stock;
    document.getElementById('fUnit').value = p.unit;
    document.getElementById('fDesc').value = p.desc;
    document.getElementById('fBadge').value = p.badge || '';
  } else {
    document.getElementById('productModalTitle').textContent = 'Add product';
    document.getElementById('productId').value = '';
  }
  overlay.classList.add('open');
}
document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(null));
document.getElementById('closeProductModal').addEventListener('click', () => document.getElementById('productModalOverlay').classList.remove('open'));

document.getElementById('productForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const products = DB.getProducts();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('fName').value.trim(),
    category: document.getElementById('fCategory').value,
    sku: document.getElementById('fSku').value.trim(),
    price: parseFloat(document.getElementById('fPrice').value),
    stock: parseInt(document.getElementById('fStock').value, 10),
    unit: document.getElementById('fUnit').value.trim() || 'each',
    desc: document.getElementById('fDesc').value.trim(),
    badge: document.getElementById('fBadge').value,
  };
  if (id) {
    const idx = products.findIndex(x => x.id === id);
    products[idx] = { ...products[idx], ...data };
    showToast('Product updated');
  } else {
    data.id = DB.nextId('p', products);
    products.push(data);
    showToast('Product added');
  }
  DB.saveProducts(products);
  document.getElementById('productModalOverlay').classList.remove('open');
  renderProductsTable();
  renderDashboard();
});

/* ---------- Orders ---------- */
function renderOrdersTable() {
  const orders = DB.getOrders();
  const body = document.getElementById('ordersBody');
  body.innerHTML = orders.length ? orders.map(o => `
    <tr>
      <td class="mono">${o.id}</td>
      <td>${o.customer.name}<br><span class="s" style="font-size:11px; color:#8a8c7a;">${o.customer.email}</span></td>
      <td>${new Date(o.date).toLocaleDateString()}</td>
      <td>${o.items.reduce((s, i) => s + i.qty, 0)} items</td>
      <td class="mono">${DB.fmt(o.total)}</td>
      <td>
        <select class="status-select" data-status="${o.id}">
          ${['Pending', 'Shipped', 'Completed'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="6" class="no-data">No orders yet — they'll show up here once a customer checks out.</td></tr>`;

  body.querySelectorAll('[data-status]').forEach(sel => {
    sel.addEventListener('change', () => {
      const orders = DB.getOrders();
      const order = orders.find(o => o.id === sel.getAttribute('data-status'));
      order.status = sel.value;
      DB.saveOrders(orders);
      renderDashboard();
      showToast(`${order.id} marked ${order.status}`);
    });
  });
}

function renderAll() {
  renderDashboard();
  renderProductsTable();
  renderOrdersTable();
}

checkAuth();
