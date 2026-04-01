const express = require('express');
const cors = require('cors');
const { seedData } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

seedData().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
