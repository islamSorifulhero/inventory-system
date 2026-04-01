const express = require('express');
const { db, uuidv4, addLog } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function updateRestockQueue(product) {
  const existingIdx = db.restockQueue.findIndex(r => r.productId === product.id);
  if (product.stock < product.threshold) {
    const priority = product.stock === 0 ? 'High' : product.stock <= product.threshold * 0.5 ? 'High' : product.stock <= product.threshold * 0.75 ? 'Medium' : 'Low';
    if (existingIdx === -1) {
      db.restockQueue.push({ id: uuidv4(), productId: product.id, productName: product.name, currentStock: product.stock, threshold: product.threshold, priority, addedAt: new Date().toISOString() });
      addLog(`Product "${product.name}" added to Restock Queue`, 'restock');
    } else {
      db.restockQueue[existingIdx].currentStock = product.stock;
      db.restockQueue[existingIdx].priority = priority;
    }
    db.restockQueue.sort((a, b) => a.currentStock - b.currentStock);
  } else if (existingIdx !== -1) {
    db.restockQueue.splice(existingIdx, 1);
  }
}

router.get('/', authMiddleware, (req, res) => {
  let products = [...db.products];
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(s) || p.categoryName.toLowerCase().includes(s));
  }
  if (req.query.category) products = products.filter(p => p.categoryId === req.query.category);
  if (req.query.status) products = products.filter(p => p.status === req.query.status);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const total = products.length;
  const paginated = products.slice((page - 1) * limit, page * limit);
  res.json({ products: paginated, total, page, pages: Math.ceil(total / limit) });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, categoryId, price, stock, threshold } = req.body;
  if (!name || !categoryId || price == null || stock == null || threshold == null) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const cat = db.categories.find(c => c.id === categoryId);
  if (!cat) return res.status(400).json({ error: 'Invalid category' });
  const status = parseInt(stock) === 0 ? 'out_of_stock' : 'active';
  const product = { id: uuidv4(), name, categoryId, categoryName: cat.name, price: parseFloat(price), stock: parseInt(stock), threshold: parseInt(threshold), status, createdAt: new Date().toISOString() };
  db.products.push(product);
  updateRestockQueue(product);
  addLog(`Product "${name}" added by ${req.user.name}`, 'product');
  res.json(product);
});

router.put('/:id', authMiddleware, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, categoryId, price, stock, threshold, status } = req.body;
  const cat = categoryId ? db.categories.find(c => c.id === categoryId) : null;
  const product = db.products[idx];
  if (name) product.name = name;
  if (categoryId && cat) { product.categoryId = categoryId; product.categoryName = cat.name; }
  if (price != null) product.price = parseFloat(price);
  if (stock != null) product.stock = parseInt(stock);
  if (threshold != null) product.threshold = parseInt(threshold);
  if (status) product.status = status;
  if (product.stock === 0) product.status = 'out_of_stock';
  else if (product.status === 'out_of_stock' && product.stock > 0) product.status = 'active';
  updateRestockQueue(product);
  addLog(`Stock updated for "${product.name}" by ${req.user.name}`, 'stock');
  res.json(product);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const product = db.products[idx];
  db.products.splice(idx, 1);
  const qIdx = db.restockQueue.findIndex(r => r.productId === product.id);
  if (qIdx !== -1) db.restockQueue.splice(qIdx, 1);
  addLog(`Product "${product.name}" deleted by ${req.user.name}`, 'product');
  res.json({ success: true });
});

router.post('/:id/restock', authMiddleware, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Valid quantity required' });
  const product = db.products[idx];
  product.stock += parseInt(quantity);
  if (product.stock > 0) product.status = 'active';
  updateRestockQueue(product);
  addLog(`Restocked "${product.name}" +${quantity} units by ${req.user.name}`, 'stock');
  res.json(product);
});

module.exports = router;
