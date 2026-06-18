const CategoryModel = require('../models/CategoryModel');

exports.getAllCategories = async (req, res) => {
  try {
    const data = await CategoryModel.findAll();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const data = await CategoryModel.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const id = await CategoryModel.create({ name, description, icon });
    res.status(201).json({ success: true, message: 'Category created successfully', data: { id, name, description, icon } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const existing = await CategoryModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    await CategoryModel.update(req.params.id, req.body);
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const existing = await CategoryModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    if (await CategoryModel.hasFoods(req.params.id))
      return res.status(400).json({ success: false, message: 'Cannot delete category with existing foods' });
    await CategoryModel.delete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
