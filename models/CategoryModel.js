const { pool } = require('../config/database');

const CategoryModel = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  create: async ({ name, description, icon }) => {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description || null, icon || null]
    );
    return result.insertId;
  },

  update: async (id, { name, description, icon }) => {
    await pool.query(
      'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?',
      [name, description, icon, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  },

  hasFoods: async (id) => {
    const [rows] = await pool.query('SELECT id FROM foods WHERE category_id = ?', [id]);
    return rows.length > 0;
  }
};

module.exports = CategoryModel;
