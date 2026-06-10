const { pool } = require('../config/database');

exports.getAllCategories = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [categories] = await connection.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.getCategoryById = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [categories] = await connection.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: categories[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.createCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const [result] = await connection.query(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description || null, icon || null]
    );
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: result.insertId, name, description, icon }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.updateCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, description, icon } = req.body;
    const [existing] = await connection.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await connection.query(
      'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?',
      [name, description, icon, req.params.id]
    );
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.deleteCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const [foods] = await connection.query('SELECT id FROM foods WHERE category_id = ?', [req.params.id]);
    if (foods.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with existing foods' });
    }
    await connection.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};
