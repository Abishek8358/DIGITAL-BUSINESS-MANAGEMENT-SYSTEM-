import pool from './db/connection';

async function migrate() {
    try {
        await pool.query("ALTER TABLE users RENAME COLUMN passwordhash TO password").catch(e => console.log(e.message));
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        await pool.query("UPDATE users SET status='active' WHERE status IS NULL");
        console.log('Migrated DB');
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
migrate();
