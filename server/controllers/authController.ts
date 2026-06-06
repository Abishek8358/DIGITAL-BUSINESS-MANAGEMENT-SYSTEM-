import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Store from '../models/Store';
import User from '../models/User';
import StoreSettings from '../models/StoreSettings';

const JWT_SECRET = process.env.JWT_SECRET || 'corebiz-secret-key';
const JWT_EXPIRES_IN = '7d';

// Demo credentials info (served to frontend only when ENABLE_DEMO_LOGIN=true)
export const getDemoInfo = (req: Request, res: Response) => {
  const enabled = process.env.ENABLE_DEMO_LOGIN === 'true';
  if (!enabled) {
    return res.json({ enabled: false });
  }
  return res.json({
    enabled: true,
    admin: {
      email: 'admin@corebiz.com',
      password: 'admin123',
      role: 'admin'
    },
    employee: {
      email: 'employee@corebiz.com',
      password: 'employee123',
      role: 'employee'
    },
    note: 'For demonstration purposes only'
  });
};

// Register a new store and create its default admin user
export const register = async (req: AuthRequest, res: Response) => {
  const { name, email, password, storeName, phone } = req.body;
  try {
    // 1. Create Store
    const store = new Store({
      storeName,
      ownerName: name,
      phone,
      email
    });
    await store.save();

    // 2. Create Admin User
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    const user = new User({
      name,
      email,
      password: hash,
      role: 'admin',
      storeId: store._id,
      status: 'active'
    });
    await user.save();

    // 3. Initialize Store Settings
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

    console.log(`[Auth] ✅ Registration successful for: ${email}`);
    res.json({ success: true, message: 'Registration successful' });
  } catch (err: any) {
    console.error('[Auth] ❌ Registration Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Login authentication
export const login = async (req: AuthRequest, res: Response) => {
  const { email, password, role: requestedRole } = req.body;

  console.log(`[Auth] 🔐 Login attempt — email: ${email}, requestedRole: ${requestedRole}`);

  // Step 0: Verify MongoDB is actually connected
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) {
    console.error(`[Auth] ❌ Database not ready. readyState=${dbState}`);
    return res.status(503).json({ message: 'Database not available. Please try again shortly.' });
  }
  console.log(`[Auth] ✅ DB connection state: connected (readyState=${dbState})`);

  try {
    // Step 1: Fetch user by email
    console.log(`[Auth] 🔍 Searching for user with email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`[Auth] ⚠️  User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`[Auth] ✅ User found: ${user.name} | role: ${user.role} | status: ${user.status}`);

    // Step 2: Validate account status
    if (user.status !== 'active') {
      console.warn(`[Auth] ⚠️  Account is inactive for: ${email}`);
      return res.status(401).json({ message: 'Account is inactive. Contact your administrator.' });
    }

    // Step 3: Validate password
    const isPasswordValid = bcrypt.compareSync(password, user.password || '');
    if (!isPasswordValid) {
      console.warn(`[Auth] ⚠️  Password mismatch for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`[Auth] ✅ Password verified for: ${email}`);

    // Step 4: Validate Role Tier matching
    const isAdminTier = ['admin', 'owner'].includes(user.role);
    const isEmployeeTier = ['employee', 'manager', 'sales', 'helper'].includes(user.role);

    const isMatch = (requestedRole === 'admin' && isAdminTier) ||
                    (requestedRole === 'employee' && isEmployeeTier);

    if (!isMatch) {
      console.warn(`[Auth] ⚠️  Role mismatch: user.role=${user.role}, requestedRole=${requestedRole}`);
      return res.status(401).json({ message: `Access denied: your account role (${user.role}) does not match the selected login tier (${requestedRole}).` });
    }
    console.log(`[Auth] ✅ Role tier matched: ${user.role} → ${requestedRole}`);

    // Step 5: Generate JWT
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      store_id: user.storeId.toString()
    };

    if (!process.env.JWT_SECRET) {
      console.warn('[Auth] ⚠️  JWT_SECRET not set in environment. Using fallback secret — INSECURE in production!');
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log(`[Auth] ✅ JWT issued for: ${email} (expires in ${JWT_EXPIRES_IN})`);

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        store_id: user.storeId.toString()
      }
    });

  } catch (err: any) {
    console.error('[Auth] ❌ Login error:', err.message);
    return res.status(500).json({ message: 'Login failed due to a server error. Please try again.' });
  }
};

// Update profile password
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!req.user) return res.sendStatus(401);
  
  try {
    const user = await User.findById(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password || '')) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    user.password = hash;
    await user.save();
    
    console.log(`[Auth] ✅ Password changed for: ${user.email}`);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('[Auth] ❌ changePassword error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
