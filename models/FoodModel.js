const { pool } = require('../config/database');

const FoodModel = {
  findAll: async () => {
    const [rows] = await pool.query(`
      SELECT f.*, c.name AS category_name, c.icon AS category_icon
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      ORDER BY f.created_at DESC
    `);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(`
      SELECT f.*, c.name AS category_name, c.icon AS category_icon
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.id = ?
    `, [id]);
    return rows[0] || null;
  },

  findAvailableById: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM foods WHERE id = ? AND is_available = true', [id]
    );
    return rows[0] || null;
  },

  create: async ({ category_id, name, description, price, image, is_available }) => {
    const [result] = await pool.query(
      'INSERT INTO foods (category_id, name, description, price, image, is_available) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description || null, price, image, is_available ?? true]
    );
    return result.insertId;
  },

  update: async (id, { category_id, name, description, price, image, is_available }) => {
    await pool.query(
      'UPDATE foods SET category_id=?, name=?, description=?, price=?, image=?, is_available=? WHERE id=?',
      [category_id, name, description, price, image, is_available, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM foods WHERE id = ?', [id]);
  }
};

module.exports = FoodModel;
