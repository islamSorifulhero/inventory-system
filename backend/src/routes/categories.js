const express = require('express');
const { db, uuidv4, addLog } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.json(db.categories);
});

router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  if (db.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Category already exists' });
  }
  const cat = { id: uuidv4(), name, createdAt: new Date().toISOString() };
  db.categories.push(cat);
  addLog(`Category "${name}" created by ${req.user.name}`, 'system');
  res.json(cat);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const cat = db.categories[idx];
  db.categories.splice(idx, 1);
  addLog(`Category "${cat.name}" deleted`, 'system');
  res.json({ success: true });
});

module.exports = router;
