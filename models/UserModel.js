const { pool } = require('../config/database');

const UserModel = {
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ name, email, password, phone, address }) => {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, phone || null, address || null]
    );
    return result.insertId;
  }
};

module.exports = UserModel;
