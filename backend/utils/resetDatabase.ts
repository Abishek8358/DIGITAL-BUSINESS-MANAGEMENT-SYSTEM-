import pool from '../db/connection';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const resetDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("⚠️  WARNING: This will DELETE ALL TRANSACTIONAL DATA across all stores.");
    console.log("This including Sales, Products, Customers, Users, and Store Settings.");
    
    const answer = await new Promise((resolve) => {
      rl.question("Are you sure you want to continue? Type 'yes' to proceed: ", (ans) => {
        resolve(ans.toLowerCase());
      });
    });

    if (answer !== 'yes') {
      console.log("❌ Reset aborted.");
      process.exit(0);
    }

    console.log("🚀 Starting database reset...");
    await client.query('BEGIN');

    // 1. Truncate all tables with CASCADE to handle foreign keys
    // Including the new hierarchy tables (variants, brands, complaints)
    await client.query(`
      TRUNCATE TABLE 
        sale_items, 
        sales, 
        customers, 
        variants, 
        brands, 
        products, 
        categories, 
        complaints, 
        users, 
        store_settings, 
        stores 
      RESTART IDENTITY CASCADE
    `);

    console.log("✅ All tables truncated and identities reset.");

    // 2. Create Default Store
    const storeRes = await client.query(
      "INSERT INTO stores (store_name, owner_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id",
      ['CoreBiz Demo Store', 'System Administrator', 'admin@corebiz.com', '0000000000']
    );
    const storeId = storeRes.rows[0].id;

    // 3. Create Default Admin
    const adminHash = bcrypt.hashSync('admin123', 10);
    await client.query(
      "INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
      ['Admin', 'admin@corebiz.com', adminHash, 'admin', storeId, 'active']
    );

    // 4. Create Default Employee
    const employeeHash = bcrypt.hashSync('employee123', 10);
    await client.query(
      "INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
      ['Employee', 'employee@corebiz.com', employeeHash, 'employee', storeId, 'active']
    );

    await client.query('COMMIT');
    
    console.log("\n✨ DATABASE RESET SUCCESSFUL");
    console.log("-----------------------------------------");
    console.log("✅ Default Store: CoreBiz Demo Store");
    console.log("✅ Default Admin: admin@corebiz.com / admin123");
    console.log("✅ Default Employee: employee@corebiz.com / employee123");
    console.log("-----------------------------------------");
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Database reset failed:", error);
  } finally {
    client.release();
    rl.close();
    process.exit(0);
  }
};

resetDatabase();
