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
  let orders = [...db.orders];
  if (req.query.status) orders = orders.filter(o => o.status === req.query.status);
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    orders = orders.filter(o => o.customerName.toLowerCase().includes(s) || o.orderNumber.toLowerCase().includes(s));
  }
  if (req.query.date) {
    orders = orders.filter(o => o.createdAt.startsWith(req.query.date));
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const total = orders.length;
  const paginated = orders.slice((page - 1) * limit, page * limit);
  res.json({ orders: paginated, total, page, pages: Math.ceil(total / limit) });
});

router.post('/', authMiddleware, (req, res) => {
  const { customerName, items } = req.body;
  if (!customerName || !items || !items.length) return res.status(400).json({ error: 'Customer name and items required' });

  // Conflict: duplicate products
  const productIds = items.map(i => i.productId);
  if (new Set(productIds).size !== productIds.length) return res.status(400).json({ error: 'This product is already added to the order.' });

  // Validate each item
  const resolvedItems = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
    if (product.status !== 'active') return res.status(400).json({ error: `This product is currently unavailable: ${product.name}` });
    if (item.quantity > product.stock) return res.status(400).json({ error: `Only ${product.stock} items available in stock for "${product.name}"` });
    resolvedItems.push({ productId: product.id, productName: product.name, quantity: parseInt(item.quantity), unitPrice: product.price, subtotal: parseInt(item.quantity) * product.price });
  }

  // Deduct stock
  for (const item of resolvedItems) {
    const product = db.products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
    if (product.stock === 0) product.status = 'out_of_stock';
    updateRestockQueue(product);
  }

  const totalPrice = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const orderNum = `ORD-${1000 + db.orders.length}`;
  const order = { id: uuidv4(), orderNumber: orderNum, customerName, items: resolvedItems, totalPrice, status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.orders.push(order);
  addLog(`Order ${orderNum} created by ${req.user.name}`, 'order');
  res.json(order);
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  // If cancelling, restore stock
  if (status === 'Cancelled' && order.status !== 'Cancelled') {
    for (const item of order.items) {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
        if (product.stock > 0) product.status = 'active';
        updateRestockQueue(product);
      }
    }
    addLog(`Order ${order.orderNumber} cancelled — stock restored`, 'order');
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  addLog(`Order ${order.orderNumber} marked as ${status} by ${req.user.name}`, 'order');
  res.json(order);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const order = db.orders[idx];
  if (order.status !== 'Cancelled') return res.status(400).json({ error: 'Only cancelled orders can be deleted' });
  db.orders.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;
