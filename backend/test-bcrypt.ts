import bcrypt from 'bcryptjs';
import pool from './db/connection';

async function test() {
    try {
        const email = 'admin@corebiz.com';
        const res = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            console.log('User not found');
            return;
        }
        const hash = res.rows[0].password;
        const isValid = bcrypt.compareSync('admin123', hash);
        console.log(`Password 'admin123' for ${email} is ${isValid ? 'VALID' : 'INVALID'}`);
        console.log('Hash in DB:', hash);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

test();
