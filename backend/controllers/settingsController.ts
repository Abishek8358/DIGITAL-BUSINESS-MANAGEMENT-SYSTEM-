import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import StoreSettings from '../models/StoreSettings';
import Store from '../models/Store';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Brand from '../models/Brand';
import Variant from '../models/Variant';
import Customer from '../models/Customer';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Complaint from '../models/Complaint';

// GET settings (initializes defaults if not present)
export const getSettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    let settings = await StoreSettings.findOne({ storeId: storeId as any });
    if (!settings) {
      settings = new StoreSettings({
        storeId: storeId as any,
        currency: 'INR',
        defaultGst: 18,
        invoicePrefix: 'INV',
        invoiceFooter: 'Thank you for shopping!',
        lowStockThreshold: 5,
        criticalStockThreshold: 2
      });
      await settings.save();
    }
    
    // Map properties for frontend compatibility
    res.json({
      id: settings._id.toString(),
      storeId: settings.storeId.toString(),
      currency: settings.currency,
      defaultGst: settings.defaultGst,
      invoicePrefix: settings.invoicePrefix,
      invoiceFooter: settings.invoiceFooter,
      lowStockThreshold: settings.lowStockThreshold,
      criticalStockThreshold: settings.criticalStockThreshold,
      enableStockNotifications: settings.enableStockNotifications,
      defaultSalesSalary: settings.defaultSalesSalary,
      defaultManagerSalary: settings.defaultManagerSalary,
      defaultHelperSalary: settings.defaultHelperSalary
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update billing settings
export const updateBillingSettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  
  const { currency, defaultGst, invoicePrefix, invoiceFooter } = req.body;
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { storeId: req.user.store_id as any },
      { 
        currency, 
        defaultGst: parseFloat(defaultGst) || 18, 
        invoicePrefix, 
        invoiceFooter 
      },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update inventory settings
export const updateInventorySettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { lowStockThreshold, criticalStockThreshold, enableNotifications } = req.body;
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { storeId: req.user.store_id as any },
      { 
        lowStockThreshold: parseInt(lowStockThreshold) || 5, 
        criticalStockThreshold: parseInt(criticalStockThreshold) || 2, 
        enableStockNotifications: enableNotifications 
      },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET employee salary settings
export const getEmployeeSalarySettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const settings = await StoreSettings.findOne({ storeId: req.user.store_id as any });
    res.json({
      defaultSalesSalary: settings ? settings.defaultSalesSalary : 0,
      defaultManagerSalary: settings ? settings.defaultManagerSalary : 0,
      defaultHelperSalary: settings ? settings.defaultHelperSalary : 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update employee salary settings
export const updateEmployeeSalarySettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { defaultSalesSalary, defaultManagerSalary, defaultHelperSalary } = req.body;
  try {
    const settings = await StoreSettings.findOneAndUpdate(
      { storeId: req.user.store_id as any },
      {
        defaultSalesSalary: parseFloat(defaultSalesSalary) || 0,
        defaultManagerSalary: parseFloat(defaultManagerSalary) || 0,
        defaultHelperSalary: parseFloat(defaultHelperSalary) || 0
      },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST reset database and seed defaults (Super Admin Only)
export const resetDatabase = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  
  if (req.user.email !== 'admin@corebiz.com') {
    return res.status(403).json({ message: 'Only the system super-admin can perform a full reset' });
  }

  try {
    // Clear all Mongoose collections
    await Promise.all([
      SaleItem.deleteMany({}),
      Sale.deleteMany({}),
      Customer.deleteMany({}),
      Variant.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Complaint.deleteMany({}),
      User.deleteMany({}),
      StoreSettings.deleteMany({}),
      Store.deleteMany({})
    ]);

    // Seed Demo Store
    const store = new Store({
      storeName: 'CoreBiz Demo Store',
      ownerName: 'System Administrator',
      email: 'admin@corebiz.com',
      phone: '0000000000',
      isSetupComplete: 1
    });
    await store.save();

    // Seed Default Store Settings
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

    // Seed Default Admin (admin123)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', adminSalt);
    const admin = new User({
      name: 'Admin',
      email: 'admin@corebiz.com',
      password: adminHash,
      role: 'admin',
      storeId: store._id,
      status: 'active'
    });
    await admin.save();

    // Seed Default Employee (employee123)
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

    res.json({ success: true, message: 'Database reset and seeded successfully' });
  } catch (err: any) {
    console.error('Reset Database Error:', err);
    res.status(500).json({ error: err.message });
  }
};
