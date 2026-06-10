const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/orders/excel', authMiddleware, adminMiddleware, exportController.exportOrdersToExcel);
router.get('/orders/pdf', authMiddleware, adminMiddleware, exportController.exportOrdersToPDF);
router.get('/foods/excel', authMiddleware, adminMiddleware, exportController.exportFoodsToExcel);
router.get('/orders/:id/pdf', authMiddleware, exportController.exportInvoicePDF);

module.exports = router;