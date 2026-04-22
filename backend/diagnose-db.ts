import pool from './db/connection';

async function diagnose() {
    try {
        console.log('--- Tables ---');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- Duplicate Products ---');
        const dups = await pool.query(`
            SELECT name, store_id, COUNT(*), ARRAY_AGG(id) as ids
            FROM products
            GROUP BY name, store_id
            HAVING COUNT(*) > 1
        `);
        console.table(dups.rows);

        console.log('\n--- Sale Items referencing duplicates ---');
        const saleItems = await pool.query(`
            SELECT si.productid, p.name, p.store_id, COUNT(*)
            FROM sale_items si
            JOIN products p ON si.productid = p.id
            WHERE EXISTS (
                SELECT 1 FROM products p2 
                WHERE p2.name = p.name AND p2.store_id = p.store_id AND p2.id < p.id
            )
            GROUP BY si.productid, p.name, p.store_id
        `);
        console.table(saleItems.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

diagnose();
