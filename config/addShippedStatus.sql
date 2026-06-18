USE food_ordering_db;

-- Menambahkan status 'shipped' ke ENUM status di tabel orders
ALTER TABLE orders 
MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending';
