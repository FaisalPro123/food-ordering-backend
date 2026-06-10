const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getAllFoods = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [foods] = await connection.query(`
      SELECT f.*, c.name as category_name, c.icon as category_icon
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      ORDER BY f.created_at DESC
    `);
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.getFoodById = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [foods] = await connection.query(`
      SELECT f.*, c.name as category_name, c.icon as category_icon
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.id = ?
    `, [req.params.id]);
    if (foods.length === 0) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    res.json({ success: true, data: foods[0] });
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.createFood = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { category_id, name, description, price, is_available } = req.body;
    if (!category_id || !name || !price) {
      return res.status(400).json({ success: false, message: 'Category ID, name, and price are required' });
    }
    const [categories] = await connection.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (categories.length === 0) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }
    const image = req.file ? req.file.filename : null;
    const [result] = await connection.query(
      'INSERT INTO foods (category_id, name, description, price, image, is_available) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description || null, price, image, is_available !== undefined ? is_available : true]
    );
    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      data: { id: result.insertId, category_id, name, description, price, image, is_available }
    });
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.updateFood = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { category_id, name, description, price, is_available } = req.body;
    const [existing] = await connection.query('SELECT * FROM foods WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    let image = existing[0].image;
    if (req.file) {
      if (existing[0].image) {
        const oldImagePath = path.join(__dirname, '../uploads', existing[0].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = req.file.filename;
    }
    await connection.query(
      'UPDATE foods SET category_id = ?, name = ?, description = ?, price = ?, image = ?, is_available = ? WHERE id = ?',
      [category_id, name, description, price, image, is_available, req.params.id]
    );
    res.json({ success: true, message: 'Food updated successfully' });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.deleteFood = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT * FROM foods WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    if (existing[0].image) {
      const imagePath = path.join(__dirname, '../uploads', existing[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await connection.query('DELETE FROM foods WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};
