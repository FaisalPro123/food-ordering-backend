const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { requestLogger } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/export', exportRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Food Ordering API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      foods: '/api/foods',
      orders: '/api/orders',
      export: '/api/export'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('='.repeat(50));
  await testConnection();
  console.log('='.repeat(50));
  console.log('📝 API Documentation:');
  console.log('   - Auth: http://localhost:' + PORT + '/api/auth');
  console.log('   - Categories: http://localhost:' + PORT + '/api/categories');
  console.log('   - Foods: http://localhost:' + PORT + '/api/foods');
  console.log('   - Orders: http://localhost:' + PORT + '/api/orders');
  console.log('   - Export: http://localhost:' + PORT + '/api/export');
  console.log('='.repeat(50));
});