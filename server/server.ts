import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

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

dotenv.config({ override: true });

const PORT = process.env.PORT || 5000;
const app = express();

// Database connection
connectDB().then(() => {
  // Initialize default seed data if database is empty
  initializeDefaultData();
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

// Seed default demo store and accounts if the User collection is empty
const initializeDefaultData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return; // DB already has users, skip seeding

    console.log('Database is empty. Seeding default demo data...');

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

    console.log('Seeded default demo store and users successfully');
  } catch (err: any) {
    console.error('Seeding Error:', err);
  }
};

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
