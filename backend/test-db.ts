import pool from './db/connection';

async function test() {
    try {
        console.log('--- Customers Schema ---');
        const custSchema = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'");
        console.log(custSchema.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Sales Schema ---');
        const salesSchema = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales'");
        console.log(salesSchema.rows.map(r => r.column_name).join(', '));
        
        console.log('\n--- Users Schema ---');
        const usersSchema = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log(usersSchema.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        process.exit(0);
    }
}

test();
