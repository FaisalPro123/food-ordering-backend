const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportOrdersToExcel = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.query(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.status, 
        o.delivery_address, o.created_at,
        u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order Number', key: 'order_number', width: 20 },
      { header: 'Customer Name', key: 'customer_name', width: 25 },
      { header: 'Email', key: 'customer_email', width: 30 },
      { header: 'Phone', key: 'customer_phone', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Delivery Address', key: 'delivery_address', width: 40 },
      { header: 'Order Date', key: 'created_at', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };

    orders.forEach(order => {
      worksheet.addRow({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        total_amount: `Rp ${order.total_amount.toLocaleString('id-ID')}`,
        status: order.status,
        delivery_address: order.delivery_address,
        created_at: new Date(order.created_at).toLocaleString('id-ID')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.exportOrdersToPDF = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.query(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.status, 
        o.delivery_address, o.created_at,
        u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Food Orders Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
    doc.moveDown(2);

    orders.forEach((order, index) => {
      if (index > 0) {
        doc.moveDown();
      }
      doc.fontSize(12).text(`Order #${order.order_number}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Customer: ${order.customer_name} (${order.customer_email})`);
      doc.text(`Total: Rp ${order.total_amount.toLocaleString('id-ID')}`);
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.text(`Date: ${new Date(order.created_at).toLocaleString('id-ID')}`);
      doc.text(`Address: ${order.delivery_address}`);
      
      if (index < orders.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      }
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.exportFoodsToExcel = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [foods] = await connection.query(`
      SELECT 
        f.id, f.name, f.description, f.price, f.is_available, f.created_at,
        c.name as category_name
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      ORDER BY f.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Foods');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Available', key: 'is_available', width: 12 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF5722' }
    };

    foods.forEach(food => {
      worksheet.addRow({
        id: food.id,
        name: food.name,
        category_name: food.category_name,
        description: food.description,
        price: `Rp ${food.price.toLocaleString('id-ID')}`,
        is_available: food.is_available ? 'Yes' : 'No',
        created_at: new Date(food.created_at).toLocaleString('id-ID')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=foods_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.exportInvoicePDF = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    const [orders] = await connection.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [items] = await connection.query(`
      SELECT oi.*, f.name as food_name
      FROM order_items oi
      LEFT JOIN foods f ON oi.food_id = f.id
      WHERE oi.order_id = ?
    `, [orderId]);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.order_number}.pdf`);
    doc.pipe(res);

    doc.fillColor('#00B14F').fontSize(24).text('SantapKu Receipt', { align: 'left' });
    doc.fillColor('#2C2C2C').fontSize(10).text('Online Food Delivery System', { align: 'left' });
    doc.moveDown(2);

    const yStart = doc.y;
    doc.fontSize(10);
    doc.text(`Order Number: ${order.order_number}`, 50, yStart);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString('id-ID')}`, 50, yStart + 15);
    doc.text(`Status: ${order.status.toUpperCase()}`, 50, yStart + 30);

    doc.text('Deliver To:', 320, yStart, { bold: true });
    doc.text(`${order.customer_name}`, 320, yStart + 15);
    doc.text(`${order.customer_phone}`, 320, yStart + 30);
    doc.text(`${order.delivery_address}`, 320, yStart + 45, { width: 200 });

    doc.moveDown(4);

    const tableTop = doc.y + 40;
    doc.fontSize(10).fillColor('#6C6C6C');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
    doc.text('Price', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Subtotal', 470, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#EEF2F5').stroke();

    let currentY = tableTop + 25;
    doc.fillColor('#2C2C2C');
    items.forEach(item => {
      doc.text(item.food_name || 'Unknown Food Item', 50, currentY, { width: 240 });
      doc.text(item.quantity.toString(), 300, currentY, { width: 50, align: 'right' });
      doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 370, currentY, { width: 80, align: 'right' });
      doc.text(`Rp ${item.subtotal.toLocaleString('id-ID')}`, 470, currentY, { width: 80, align: 'right' });
      currentY += 20;
    });

    doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor('#EEF2F5').stroke();
    currentY += 15;

    const totalLabelX = 350;
    const totalValueX = 470;
    
    doc.text('Subtotal:', totalLabelX, currentY, { width: 100, align: 'right' });
    doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, totalValueX, currentY, { width: 80, align: 'right' });
    
    currentY += 15;
    doc.text('Delivery Fee:', totalLabelX, currentY, { width: 100, align: 'right' });
    doc.text('Rp 10.000', totalValueX, currentY, { width: 80, align: 'right' });

    currentY += 20;
    doc.moveTo(350, currentY).lineTo(550, currentY).strokeColor('#EEF2F5').stroke();
    currentY += 10;

    doc.fontSize(12).fillColor('#00B14F');
    doc.text('Total Amount:', totalLabelX, currentY, { width: 100, align: 'right' });
    doc.text(`Rp ${(parseFloat(order.total_amount) + 10000).toLocaleString('id-ID')}`, totalValueX, currentY, { width: 80, align: 'right' });

    if (order.notes) {
      currentY += 40;
      doc.fontSize(10).fillColor('#6C6C6C').text('Order Notes:', 50, currentY);
      doc.fillColor('#2C2C2C').text(order.notes, 50, currentY + 15, { width: 400 });
    }

    doc.end();
  } catch (error) {
    console.error('Export Invoice PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};