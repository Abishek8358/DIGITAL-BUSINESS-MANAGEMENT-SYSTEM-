import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

// Models
import Store from '../models/Store';
import StoreSettings from '../models/StoreSettings';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Customer from '../models/Customer';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Brand from '../models/Brand';
import Variant from '../models/Variant';
import Complaint from '../models/Complaint';
import Billing from '../models/Billing';
import Inventory from '../models/Inventory';
import Invoice from '../models/Invoice';

dotenv.config({ override: true });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const resetDatabase = async () => {
  try {
    console.log("⚠️  WARNING: This will DELETE ALL DATA in your MongoDB Atlas collections.");
    console.log("This includes Sales, Products, Customers, Users, Settings, and Brands.");
    
    const answer = await new Promise<string>((resolve) => {
      rl.question("Are you sure you want to continue? Type 'yes' to proceed: ", (ans) => {
        resolve(ans.trim().toLowerCase());
      });
    });

    if (answer !== 'yes') {
      console.log("❌ Reset aborted.");
      process.exit(0);
    }

    console.log("🚀 Connecting to database...");
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/corebiz';
    await mongoose.connect(connStr);
    console.log("✅ Database connected. Starting reset...");

    // Delete all documents in all collections
    await Promise.all([
      Store.deleteMany({}),
      StoreSettings.deleteMany({}),
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      SaleItem.deleteMany({}),
      Brand.deleteMany({}),
      Variant.deleteMany({}),
      Complaint.deleteMany({}),
      Billing.deleteMany({}),
      Inventory.deleteMany({}),
      Invoice.deleteMany({})
    ]);

    console.log("✅ All collections cleared successfully.");

    // Seeding default Demo Store
    const store = new Store({
      storeName: 'CoreBiz Demo Store',
      ownerName: 'System Administrator',
      email: 'admin@corebiz.com',
      phone: '0000000000',
      isSetupComplete: 1
    });
    await store.save();

    // Seeding default settings
    const settings = new StoreSettings({
      storeId: store._id,
      currency: 'INR',
      defaultGst: 18,
      invoicePrefix: 'INV',
      invoiceFooter: 'Thank you for shopping!',
      lowStockThreshold: 5,
      criticalStockThreshold: 2
    });
    await settings.save();

    // Seeding admin account (admin123)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', adminSalt);
    const admin = new User({
      name: 'System Admin',
      email: 'admin@corebiz.com',
      password: adminHash,
      role: 'admin',
      storeId: store._id,
      status: 'active'
    });
    await admin.save();

    // Seeding employee account (employee123)
    const employeeSalt = bcrypt.genSaltSync(10);
    const employeeHash = bcrypt.hashSync('employee123', employeeSalt);
    const employee = new User({
      name: 'Employee',
      email: 'employee@corebiz.com',
      password: employeeHash,
      role: 'employee',
      storeId: store._id,
      status: 'active'
    });
    await employee.save();

    console.log("\n✨ DATABASE RESET & SEEDING SUCCESSFUL");
    console.log("-----------------------------------------");
    console.log("✅ Default Store: CoreBiz Demo Store");
    console.log("✅ Default Admin: admin@corebiz.com / admin123");
    console.log("✅ Default Employee: employee@corebiz.com / employee123");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ Database reset failed:", error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetDatabase();
