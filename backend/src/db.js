const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory data store
const db = {
  users: [],
  categories: [],
  products: [],
  orders: [],
  restockQueue: [],
  activityLog: []
};

// Seed demo data
async function seedData() {
  // Demo users
  const hashedPassword = await bcrypt.hash('demo123', 10);
  db.users.push({
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@demo.com',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
  db.users.push({
    id: uuidv4(),
    name: 'Manager User',
    email: 'manager@demo.com',
    password: hashedPassword,
    role: 'manager',
    createdAt: new Date().toISOString()
  });

  // Categories
  const cats = ['Electronics', 'Clothing', 'Grocery', 'Books', 'Sports'];
  cats.forEach(name => {
    db.categories.push({ id: uuidv4(), name, createdAt: new Date().toISOString() });
  });

  // Products
  const products = [
    { name: 'iPhone 13', category: 'Electronics', price: 799, stock: 3, threshold: 5 },
    { name: 'Samsung Galaxy S22', category: 'Electronics', price: 699, stock: 8, threshold: 5 },
    { name: 'Sony Headphones', category: 'Electronics', price: 199, stock: 0, threshold: 3 },
    { name: 'T-Shirt (Blue)', category: 'Clothing', price: 25, stock: 20, threshold: 10 },
    { name: 'Running Shoes', category: 'Sports', price: 89, stock: 4, threshold: 5 },
    { name: 'Python Book', category: 'Books', price: 45, stock: 15, threshold: 5 },
    { name: 'Rice (5kg)', category: 'Grocery', price: 12, stock: 50, threshold: 20 },
    { name: 'Laptop Stand', category: 'Electronics', price: 55, stock: 2, threshold: 5 },
  ];

  products.forEach(p => {
    const cat = db.categories.find(c => c.name === p.category);
    const status = p.stock === 0 ? 'out_of_stock' : 'active';
    const prod = {
      id: uuidv4(),
      name: p.name,
      categoryId: cat.id,
      categoryName: cat.name,
      price: p.price,
      stock: p.stock,
      threshold: p.threshold,
      status,
      createdAt: new Date().toISOString()
    };
    db.products.push(prod);

    if (p.stock < p.threshold) {
      const priority = p.stock === 0 ? 'High' : p.stock <= p.threshold / 2 ? 'High' : p.stock <= p.threshold * 0.75 ? 'Medium' : 'Low';
      db.restockQueue.push({
        id: uuidv4(),
        productId: prod.id,
        productName: prod.name,
        currentStock: prod.stock,
        threshold: prod.threshold,
        priority,
        addedAt: new Date().toISOString()
      });
    }
  });

  // Sample orders
  const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
  for (let i = 0; i < 5; i++) {
    const prod = db.products[i];
    const qty = 1;
    const order = {
      id: uuidv4(),
      orderNumber: `ORD-${1000 + i}`,
      customerName: `Customer ${i + 1}`,
      items: [{ productId: prod.id, productName: prod.name, quantity: qty, unitPrice: prod.price, subtotal: qty * prod.price }],
      totalPrice: qty * prod.price,
      status: statuses[i % statuses.length],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600000).toISOString()
    };
    db.orders.push(order);
  }

  // Activity log
  db.activityLog.push({ id: uuidv4(), message: 'System initialized with demo data', time: new Date().toISOString(), type: 'system' });
  db.activityLog.push({ id: uuidv4(), message: 'Order #ORD-1000 created', time: new Date(Date.now() - 1800000).toISOString(), type: 'order' });
  db.activityLog.push({ id: uuidv4(), message: 'Stock updated for "Samsung Galaxy S22"', time: new Date(Date.now() - 3600000).toISOString(), type: 'stock' });
  db.activityLog.push({ id: uuidv4(), message: 'Product "Sony Headphones" added to Restock Queue', time: new Date(Date.now() - 7200000).toISOString(), type: 'restock' });
}

function addLog(message, type = 'system') {
  db.activityLog.unshift({ id: uuidv4(), message, time: new Date().toISOString(), type });
  if (db.activityLog.length > 50) db.activityLog.pop();
}

module.exports = { db, seedData, addLog, uuidv4 };
