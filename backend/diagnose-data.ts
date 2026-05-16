import pool from './db/connection';

async function diagnose() {
  try {
    const stores = await pool.query('SELECT id, store_name FROM stores');
    console.log('Stores:', stores.rows);

    const users = await pool.query('SELECT id, email, role, store_id FROM users');
    console.log('Users:', users.rows);

    const sales = await pool.query('SELECT store_id, COUNT(*) FROM sales GROUP BY store_id');
    console.log('Sales per store:', sales.rows);

    const products = await pool.query('SELECT store_id, COUNT(*) FROM products GROUP BY store_id');
    console.log('Products per store:', products.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diagnose();
