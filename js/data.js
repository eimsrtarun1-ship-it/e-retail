/* ============================================================
   Fieldstone Goods — data layer
   Everything lives in localStorage so the storefront and the
   admin panel (this file, shared by both pages) always agree.
   ============================================================ */

const DB = {
  KEYS: { products: 'fg_products', orders: 'fg_orders', cart: 'fg_cart', auth: 'fg_admin_auth' },

  seedProducts: [
    { id: 'p01', sku: 'PT-101', name: 'Smoked Sea Salt', category: 'Pantry', price: 9.5, stock: 42, unit: 'jar · 4oz', desc: 'Applewood-smoked over three days, finished coarse for the table.', badge: 'Bestseller' },
    { id: 'p02', sku: 'PT-118', name: 'Wildflower Honey', category: 'Pantry', price: 14, stock: 18, unit: 'jar · 12oz', desc: 'Raw and unfiltered, pulled from hives two ridgelines over.', badge: '' },
    { id: 'p03', sku: 'PT-142', name: 'Small-Batch Sourdough Starter', category: 'Pantry', price: 12, stock: 9, unit: 'kit', desc: 'A living culture, 40 years old, with a feeding schedule card.', badge: 'New' },
    { id: 'p04', sku: 'HM-210', name: 'Waxed Canvas Apron', category: 'Home', price: 58, stock: 15, unit: 'one size', desc: 'Heavyweight canvas, brass hardware, softens with every wash.', badge: '' },
    { id: 'p05', sku: 'HM-233', name: 'Cast Iron Skillet, 10"', category: 'Home', price: 44, stock: 0, unit: 'each', desc: 'Pre-seasoned and ready for the stovetop or open fire.', badge: '' },
    { id: 'p06', sku: 'HM-256', name: 'Beeswax Food Wraps', category: 'Home', price: 22, stock: 27, unit: 'set of 3', desc: 'Reusable wraps in three sizes, cotton and tree resin only.', badge: '' },
    { id: 'p07', sku: 'AP-305', name: 'Chamomile & Oat Soap Bar', category: 'Apothecary', price: 8, stock: 33, unit: 'bar · 4oz', desc: 'Cold-processed with dried chamomile grown on the back lot.', badge: '' },
    { id: 'p08', sku: 'AP-318', name: 'Cedar & Sage Candle', category: 'Apothecary', price: 19, stock: 21, unit: 'tin · 8oz', desc: 'Hand-poured soy wax, cotton wick, burns about 40 hours.', badge: 'Bestseller' },
    { id: 'p09', sku: 'GD-402', name: 'Heirloom Tomato Seed Set', category: 'Garden', price: 11, stock: 50, unit: 'pack of 5', desc: 'Five open-pollinated varieties, saved and dried on-site.', badge: '' },
    { id: 'p10', sku: 'GD-417', name: 'Forged Hand Trowel', category: 'Garden', price: 26, stock: 12, unit: 'each', desc: 'One-piece forged steel with an ash wood handle.', badge: 'New' },
  ],

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); },

  init() {
    if (!localStorage.getItem(this.KEYS.products)) this.write(this.KEYS.products, this.seedProducts);
    if (!localStorage.getItem(this.KEYS.orders)) this.write(this.KEYS.orders, []);
    if (!localStorage.getItem(this.KEYS.cart)) this.write(this.KEYS.cart, []);
  },

  getProducts() { return this.read(this.KEYS.products, []); },
  saveProducts(list) { this.write(this.KEYS.products, list); },

  getOrders() { return this.read(this.KEYS.orders, []); },
  saveOrders(list) { this.write(this.KEYS.orders, list); },

  getCart() { return this.read(this.KEYS.cart, []); },
  saveCart(list) { this.write(this.KEYS.cart, list); },

  nextId(prefix, list) {
    let n = list.length + 1;
    let id;
    do { id = prefix + String(n).padStart(2, '0'); n++; } while (list.some(x => x.id === id));
    return id;
  },

  fmt(n) { return '$' + Number(n).toFixed(2); },
};

DB.init();
