import pool from './db/connection';

async function updateStoresTable() {
    try {
        console.log('Updating stores table with setup fields...');
        await pool.query(`
            ALTER TABLE stores 
            ADD COLUMN IF NOT EXISTS address TEXT,
            ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS is_setup_complete INT DEFAULT 0
        `);
        console.log('Stores table updated successfully');
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        process.exit(0);
    }
}

updateStoresTable();
