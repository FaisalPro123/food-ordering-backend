const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  console.log('🔄 Initializing database...');
  
  // Connection without database specified so we can create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'dbSetup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⏳ Running dbSetup.sql statements...');
    await connection.query(sqlContent);
    
    console.log('✓ Database initialized successfully with all tables and seed data!');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    console.error('Please make sure MySQL service is running locally on your machine.');
  } finally {
    await connection.end();
  }
};

initDatabase();
