const FoodModel    = require('../models/FoodModel');
const CategoryModel = require('../models/CategoryModel');
const fs   = require('fs');
const path = require('path');

exports.getAllFoods = async (req, res) => {
  try {
    res.json({ success: true, data: await FoodModel.findAll() });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const data = await FoodModel.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createFood = async (req, res) => {
  try {
    const { category_id, name, description, price, is_available } = req.body;
    if (!category_id || !name || !price)
      return res.status(400).json({ success: false, message: 'category_id, name, and price are required' });
    if (!await CategoryModel.findById(category_id))
      return res.status(400).json({ success: false, message: 'Category not found' });
    const image = req.file ? req.file.filename : null;
    const id = await FoodModel.create({ category_id, name, description, price, image, is_available });
    res.status(201).json({ success: true, message: 'Food created successfully', data: { id, name, price, image } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const existing = await FoodModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Food not found' });

    let image = existing.image;
    if (req.file) {
      if (existing.image) {
        const old = path.join(__dirname, '../uploads', existing.image);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      image = req.file.filename;
    }
    const { category_id, name, description, price, is_available } = req.body;
    await FoodModel.update(req.params.id, { category_id, name, description, price, image, is_available });
    res.json({ success: true, message: 'Food updated successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const existing = await FoodModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Food not found' });
    if (existing.image) {
      const imgPath = path.join(__dirname, '../uploads', existing.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await FoodModel.delete(req.params.id);
    res.json({ success: true, message: 'Food deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
