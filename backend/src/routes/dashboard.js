const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = db.orders.filter(o => o.createdAt.startsWith(today));
  const pendingOrders = db.orders.filter(o => o.status === 'Pending').length;
  const completedOrders = db.orders.filter(o => o.status === 'Delivered').length;
  const lowStockItems = db.products.filter(p => p.stock < p.threshold).length;
  const revenueToday = todayOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0);

  // Weekly orders for chart (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = db.orders.filter(o => o.createdAt.startsWith(dateStr));
    weeklyData.push({
      date: dateStr,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0)
    });
  }

  const productSummary = db.products.map(p => ({
    id: p.id, name: p.name, stock: p.stock, threshold: p.threshold, status: p.status,
    stockStatus: p.stock === 0 ? 'Out of Stock' : p.stock < p.threshold ? 'Low Stock' : 'OK'
  })).sort((a, b) => a.stock - b.stock).slice(0, 10);

  res.json({
    totalOrdersToday: todayOrders.length,
    pendingOrders,
    completedOrders,
    lowStockItems,
    revenueToday,
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    weeklyData,
    productSummary,
    activityLog: db.activityLog.slice(0, 10)
  });
});

router.get('/restock-queue', authMiddleware, (req, res) => {
  res.json(db.restockQueue);
});

router.delete('/restock-queue/:id', authMiddleware, (req, res) => {
  const idx = db.restockQueue.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.restockQueue.splice(idx, 1);
  res.json({ success: true });
});

router.get('/activity-log', authMiddleware, (req, res) => {
  res.json(db.activityLog.slice(0, 20));
});

module.exports = router;
