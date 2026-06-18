const { pool } = require('../config/database');

const OrderModel = {

  findAll: async (userId, isAdmin) => {
    let query = `
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${!isAdmin ? 'WHERE o.user_id = ?' : ''}
      ORDER BY o.created_at DESC
    `;
    const [orders] = isAdmin
      ? await pool.query(query)
      : await pool.query(query, [userId]);
    return orders;
  },

  findById: async (id, userId, isAdmin) => {
    let query = `
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? ${!isAdmin ? 'AND o.user_id = ?' : ''}
    `;
    const [rows] = isAdmin
      ? await pool.query(query, [id])
      : await pool.query(query, [id, userId]);
    return rows[0] || null;
  },

  // Items dari sebuah order (relasi order_items + foods)
  findItems: async (orderId) => {
    const [rows] = await pool.query(`
      SELECT oi.*, f.name AS food_name, f.image AS food_image, c.name AS category_name
      FROM order_items oi
      LEFT JOIN foods f ON oi.food_id = f.id
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE oi.order_id = ?
    `, [orderId]);
    return rows;
  },

  
  create: async (connection, { user_id, order_number, total_amount, delivery_address, notes }) => {
    const [result] = await connection.query(
      'INSERT INTO orders (user_id, order_number, total_amount, delivery_address, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, order_number, total_amount, delivery_address, notes || null]
    );
    return result.insertId;
  },

  // Buat order item 
  createItem: async (connection, { order_id, food_id, quantity, price, subtotal }) => {
    await connection.query(
      'INSERT INTO order_items (order_id, food_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
      [order_id, food_id, quantity, price, subtotal]
    );
  },

  updateStatus: async (id, status) => {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  },

  delete: async (id) => {
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  }
};

module.exports = OrderModel;
