const { pool }  = require('../config/database');
const OrderModel = require('../models/OrderModel');
const FoodModel  = require('../models/FoodModel');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.findAll(req.user.id, req.user.role === 'admin');
    for (const order of orders) {
      order.items = await OrderModel.findItems(order.id);
    }
    res.json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id, req.user.id, req.user.role === 'admin');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.items = await OrderModel.findItems(order.id);
    res.json({ success: true, data: order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { items, delivery_address, notes } = req.body;
    if (!items?.length)     throw { status: 400, message: 'Order items are required' };
    if (!delivery_address)  throw { status: 400, message: 'Delivery address is required' };

    let totalAmount = 0;
    const validated = [];

    for (const item of items) {
      const food = await FoodModel.findAvailableById(item.food_id);
      if (!food) throw { status: 400, message: `Food ID ${item.food_id} not found or unavailable` };
      const subtotal = food.price * item.quantity;
      totalAmount += subtotal;
      validated.push({ food_id: food.id, quantity: item.quantity, price: food.price, subtotal });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderId = await OrderModel.create(connection, {
      user_id: req.user.id, order_number: orderNumber, total_amount: totalAmount, delivery_address, notes
    });

    for (const item of validated) {
      await OrderModel.createItem(connection, { order_id: orderId, ...item });
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Order created successfully',
      data: { id: orderId, order_number: orderNumber, total_amount: totalAmount, items: validated }
    });
  } catch (e) {
    await connection.rollback();
    if (e.status) return res.status(e.status).json({ success: false, message: e.message });
    console.error('Create order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!status) 
      return res.status(400).json({ success: false, message: 'Status is required' });
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    
    const isAdmin = req.user.role === 'admin';
    const order = await OrderModel.findById(req.params.id, req.user.id, isAdmin);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (!isAdmin && order.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied' });
    
    await OrderModel.updateStatus(req.params.id, status);
    res.json({ success: true, message: 'Order status updated' });
  } catch (e) {
    console.error('Update status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id, null, true);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await OrderModel.delete(req.params.id);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
