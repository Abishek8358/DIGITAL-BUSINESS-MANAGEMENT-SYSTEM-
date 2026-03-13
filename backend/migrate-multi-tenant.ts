import pool from './db/connection';

async function migrate() {
    try {
        console.log('Starting Multi-Tenant Migration...');

        // 1. Create stores table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                store_name VARCHAR(255) NOT NULL,
                owner_name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created "stores" table');

        // 2. Insert a default store for existing data
        const storeCheck = await pool.query("SELECT id FROM stores WHERE id = 1");
        if (storeCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO stores (id, store_name, owner_name, phone)
                VALUES (1, 'Default Store', 'System Admin', '0000000000')
                ON CONFLICT (id) DO NOTHING
            `);
            console.log('Inserted default store');
        }

        // 3. Update users table
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id)");
        // Update user roles check - Postgres doesn't easily allow updating existing check constraints, 
        // but we can drop and recreate or just handle it in logic. 
        // For simplicity and safety in a migration script:
        await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'employee', 'owner'))");
        
        await pool.query("UPDATE users SET store_id = 1 WHERE store_id IS NULL");
        console.log('Updated "users" table');

        // 4. Update tenant-scoped tables
        const tables = ['categories', 'products', 'customers', 'sales'];
        for (const table of tables) {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id)`);
            await pool.query(`UPDATE ${table} SET store_id = 1 WHERE store_id IS NULL`);
            console.log(`Updated "${table}" table`);
        }

        // 5. Special case for categories: remove unique constraint on name if it exists,
        // as different stores might have same category names.
        await pool.query("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key");
        await pool.query("ALTER TABLE categories ADD CONSTRAINT categories_name_store_unique UNIQUE (name, store_id)");
        console.log('Updated categories unique constraint');

        console.log('Multi-Tenant Migration Completed Successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
