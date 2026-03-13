import pool from './db/connection';

async function migrateV2() {
    try {
        console.log('Starting Phase 2 Migration...');

        // 1. Update customers table: rename mobile to phone, add total_spent and last_visit
        await pool.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'mobile') THEN
                    ALTER TABLE customers RENAME COLUMN mobile TO phone;
                END IF;
            END $$;
        `);
        
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('Updated "customers" table');

        // 2. Update users table: add salary and join_date
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE
        `);
        console.log('Updated "users" table');

        // 3. Update store_settings table: add salary defaults
        await pool.query(`
            ALTER TABLE store_settings 
            ADD COLUMN IF NOT EXISTS default_sales_salary DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS default_manager_salary DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS default_helper_salary DECIMAL(12,2) DEFAULT 0
        `);
        console.log('Updated "store_settings" table');

        console.log('Phase 2 Migration Completed Successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrateV2();
