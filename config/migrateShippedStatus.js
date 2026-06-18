const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'food_ordering_db'
    });

    console.log('⚡ Connected to database');

    // Menambahkan status 'shipped' ke ENUM
    await connection.query(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') 
      DEFAULT 'pending'
    `);

    console.log('✅ Migration successful: Added "shipped" status to orders table');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
