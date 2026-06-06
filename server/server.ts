// ⚠️ dotenv MUST be configured first — before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import connectDB from './config/db';
import Store from './models/Store';
import StoreSettings from './models/StoreSettings';
import User from './models/User';

// Import routes
import authRoutes from './routes/authRoutes';
import storeRoutes from './routes/storeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import saleRoutes from './routes/saleRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import complaintRoutes from './routes/complaintRoutes';
import employeeRoutes from './routes/employeeRoutes';
import settingsRoutes from './routes/settingsRoutes';
import variantRoutes from './routes/variantRoutes';

const PORT = process.env.PORT || 5000;
const app = express();

// ── Startup Environment Validation ──────────────────────────────────────────
console.log('[Server] ─── Startup Check ──────────────────────────────────────');
console.log(`[Server] NODE_ENV     : ${process.env.NODE_ENV || 'development'}`);
console.log(`[Server] PORT         : ${PORT}`);
console.log(`[Server] MONGO_URI    : ${process.env.MONGO_URI ? '✅ SET' : '❌ MISSING — will use localhost fallback'}`);
console.log(`[Server] JWT_SECRET   : ${process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING — using insecure fallback'}`);
console.log('[Server] ────────────────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────

// Database connection → then seed default data + verify admin
connectDB().then(async () => {
  await initializeDefaultData();
  await verifyAdminAccount();
});

app.use(cors({
  origin: [
    'https://abishek8358.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Static folder upload configuration
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health Check Endpoint ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db: stateMap[dbState] || 'unknown',
    dbHost: mongoose.connection.host || null,
    environment: process.env.NODE_ENV || 'development',
    jwtConfigured: !!process.env.JWT_SECRET,
    mongoConfigured: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString()
  });
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api', analyticsRoutes); // stats endpoints mount on /api directly
app.use('/api/complaints', complaintRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Global Error]', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// ── Seed default demo store and accounts if the User collection is empty ─────
const initializeDefaultData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] ✅ Database already has ${userCount} user(s). Skipping seed.`);
      return;
    }

    console.log('[Seed] Database is empty. Seeding default demo data...');

    // 1. Create Default Store
    const store = new Store({
      storeName: 'CoreBiz Demo Store',
      ownerName: 'System Administrator',
      email: 'admin@corebiz.com',
      phone: '0000000000',
      isSetupComplete: 1
    });
    await store.save();

    // 2. Create Default Store Settings
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

    // 3. Create Default Admin User (admin123)
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

    // 4. Create Default Employee User (employee123)
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

    console.log('[Seed] ✅ Default demo store and users seeded successfully.');
    console.log('[Seed]    Admin:    admin@corebiz.com / admin123');
    console.log('[Seed]    Employee: employee@corebiz.com / employee123');
  } catch (err: any) {
    console.error('[Seed] ❌ Seeding Error:', err.message);
  }
};

// ── Verify admin account always exists — CREATE it automatically if missing ──
const verifyAdminAccount = async () => {
  try {
    const adminUser = await User.findOne({ email: 'admin@corebiz.com', role: 'admin' });
    if (adminUser) {
      console.log(`[Admin] ✅ Admin account verified: ${adminUser.email} (status: ${adminUser.status})`);
      return;
    }

    console.warn('[Admin] ⚠️  No admin@corebiz.com found. Auto-creating default admin account...');

    // Find or create a store to attach the admin to
    let store = await Store.findOne({});
    if (!store) {
      store = new Store({
        storeName: 'CoreBiz Demo Store',
        ownerName: 'System Administrator',
        email: 'admin@corebiz.com',
        phone: '0000000000',
        isSetupComplete: 1
      });
      await store.save();
      // Also create store settings
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
      console.log('[Admin] ✅ Created default store: CoreBiz Demo Store');
    }

    const hash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));
    const admin = new User({
      name: 'System Admin',
      email: 'admin@corebiz.com',
      password: hash,
      role: 'admin',
      storeId: store._id,
      status: 'active'
    });
    await admin.save();
    console.log('[Admin] ✅ Default admin account created: admin@corebiz.com / admin123');
  } catch (err: any) {
    console.error('[Admin] ❌ Failed to verify/create admin account:', err.message);
  }
};
// ────────────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] ✅ Running on http://localhost:${PORT}`);
  });
}

export default app;
