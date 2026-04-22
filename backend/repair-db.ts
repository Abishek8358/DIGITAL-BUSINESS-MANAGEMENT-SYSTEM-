import pool from './db/connection';

async function verifyAndRepairSchema() {
    try {
        console.log('Starting Schema Audit & Repair...');

        // 1. Ensure Products have Unique constraint per store
        // First, check if it exists
        const productConstraintCheck = await pool.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conname = 'products_name_store_id_unique'
        `);
        
        if (productConstraintCheck.rows.length === 0) {
            console.log('Enforcing product uniqueness per store...');
            
            // 1. Move all sale_items references to the "original" (lowest ID) product
            await pool.query(`
                UPDATE sale_items si
                SET productid = (
                    SELECT MIN(p2.id)
                    FROM products p1
                    JOIN products p2 ON p1.name = p2.name AND p1.store_id = p2.store_id
                    WHERE p1.id = si.productid
                )
                WHERE EXISTS (
                    SELECT 1 FROM products p
                    WHERE p.id = si.productid
                )
            `);

            // 2. Delete the duplicate products (safe now because references are gone)
            await pool.query(`
                DELETE FROM products 
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM products
                    GROUP BY name, store_id
                )
            `);

            // 3. Add the unique constraint
            await pool.query(`
                ALTER TABLE products 
                ADD CONSTRAINT products_name_store_id_unique UNIQUE (name, store_id)
            `);
            
            console.log('Product uniqueness constraint enforced successfully.');
        }

        // 2. Ensure stores has email column (already in schema.sql but let's be sure)
        await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
        
        // 3. Ensure users has salary and join_date and phone (for employees)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2) DEFAULT 0`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);

        console.log('Schema Audit & Repair Completed.');
    } catch (err) {
        console.error('Schema Repair failed:', err);
    } finally {
        process.exit(0);
    }
}

verifyAndRepairSchema();
