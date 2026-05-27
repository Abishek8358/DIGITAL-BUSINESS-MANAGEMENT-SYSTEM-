import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import Store from '../models/Store';
import User from '../models/User';
import StoreSettings from '../models/StoreSettings';

const JWT_SECRET = process.env.JWT_SECRET || 'corebiz-secret-key';

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

    res.json({ success: true, message: 'Registration successful' });
  } catch (err: any) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Login authentication
export const login = async (req: AuthRequest, res: Response) => {
  const { email, password, role: requestedRole } = req.body;
  try {
    // 1. Fetch user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    // 2. Validate password
    const isPasswordValid = bcrypt.compareSync(password, user.password || '');
    if (!isPasswordValid || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    // 3. Validate Role Tier matching
    const isAdminTier = ['admin', 'owner'].includes(user.role);
    const isEmployeeTier = ['employee', 'manager', 'sales', 'helper'].includes(user.role);

    const isMatch = (requestedRole === 'admin' && isAdminTier) || 
                    (requestedRole === 'employee' && isEmployeeTier);

    if (!isMatch) {
      return res.status(401).json({ message: 'Access denied for this role tier' });
    }

    // 4. Success - Generate Token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        role: user.role, 
        name: user.name, 
        store_id: user.storeId.toString() 
      }, 
      JWT_SECRET
    );
    
    res.json({ 
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
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Login processing error: ' + err.message });
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
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
