import pool from './db/connection';

async function migrateSettings() {
    try {
        console.log('Starting Settings Migration...');

        // 1. Update stores table for logo and contact email
        await pool.query(`
            ALTER TABLE stores 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS logo_url TEXT
        `);
        console.log('Updated "stores" table');

        // 2. Create store_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS store_settings (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) UNIQUE,
                currency VARCHAR(10) DEFAULT '₹',
                default_gst DECIMAL(5,2) DEFAULT 0,
                invoice_prefix VARCHAR(20) DEFAULT 'INV',
                invoice_footer TEXT,
                low_stock_threshold INT DEFAULT 10,
                critical_stock_threshold INT DEFAULT 5,
                enable_stock_notifications BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created "store_settings" table');

        // 3. Initialize settings for existing stores
        const stores = await pool.query("SELECT id FROM stores");
        for (const store of stores.rows) {
            await pool.query(`
                INSERT INTO store_settings (store_id) 
                VALUES ($1) 
                ON CONFLICT (store_id) DO NOTHING
            `, [store.id]);
        }
        console.log('Initialized settings for existing stores');

        console.log('Settings Migration Completed Successfully');
    } catch (err) {
        console.error('Settings Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrateSettings();
