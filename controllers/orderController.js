const { pool } = require('../config/database');

exports.getAllOrders = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    if (req.user.role !== 'admin') {
      query += ' WHERE o.user_id = ?';
    }
    query += ' ORDER BY o.created_at DESC';
    const [orders] = req.user.role === 'admin' 
      ? await connection.query(query)
      : await connection.query(query, [req.user.id]);
    for (let order of orders) {
      const [items] = await connection.query(`
        SELECT oi.*, f.name as food_name, f.image as food_image
        FROM order_items oi
        LEFT JOIN foods f ON oi.food_id = f.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.getOrderById = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    if (req.user.role !== 'admin') {
      query += ' AND o.user_id = ?';
    }
    const [orders] = req.user.role === 'admin'
      ? await connection.query(query, [req.params.id])
      : await connection.query(query, [req.params.id, req.user.id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const [items] = await connection.query(`
      SELECT oi.*, f.name as food_name, f.image as food_image, c.name as category_name
      FROM order_items oi
      LEFT JOIN foods f ON oi.food_id = f.id
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE oi.order_id = ?
    `, [orders[0].id]);
    orders[0].items = items;
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { items, delivery_address, notes } = req.body;
    if (!items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }
    if (!delivery_address) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    let totalAmount = 0;
    const validatedItems = [];
    for (let item of items) {
      const [foods] = await connection.query(
        'SELECT * FROM foods WHERE id = ? AND is_available = true',
        [item.food_id]
      );
      if (foods.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Food with ID ${item.food_id} not found or not available` });
      }
      const food = foods[0];
      const subtotal = food.price * item.quantity;
      totalAmount += subtotal;
      validatedItems.push({
        food_id: food.id,
        quantity: item.quantity,
        price: food.price,
        subtotal: subtotal
      });
    }
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, order_number, total_amount, delivery_address, notes) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, orderNumber, totalAmount, delivery_address, notes || null]
    );
    const orderId = orderResult.insertId;
    for (let item of validatedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, food_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.food_id, item.quantity, item.price, item.subtotal]
      );
    }
    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { id: orderId, order_number: orderNumber, total_amount: totalAmount, items: validatedItems }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    if (!status || ![
      'pending',
       'processing',
       'waiting_confirmation',
        'completed', 
           'waiting_payment_confirmation',
        'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const [existing] = await connection.query('SELECT id, user_id FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.deleteOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await connection.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};
