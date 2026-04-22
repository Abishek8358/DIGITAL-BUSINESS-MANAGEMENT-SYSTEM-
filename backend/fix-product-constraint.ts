import pool from './db/connection';

async function fixConstraint() {
  try {
    console.log('Fixing product uniqueness constraint...');
    await pool.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_store_id_unique');
    await pool.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_brand_store_id_unique');
    await pool.query('ALTER TABLE products ADD CONSTRAINT products_name_brand_store_id_unique UNIQUE (name, brand, store_id)');
    console.log('Done: products now unique by (name, brand, store_id)');
  } catch(e) {
    console.error('Fix failed:', e);
  } finally {
    process.exit(0);
  }
}

fixConstraint();
