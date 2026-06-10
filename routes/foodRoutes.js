const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', foodController.getAllFoods);
router.get('/:id', foodController.getFoodById);
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), foodController.createFood);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), foodController.updateFood);
router.delete('/:id', authMiddleware, adminMiddleware, foodController.deleteFood);

module.exports = router;