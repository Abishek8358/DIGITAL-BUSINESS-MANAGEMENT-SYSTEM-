import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db/connection';

dotenv.config({ override: true });

const JWT_SECRET = process.env.JWT_SECRET || 'corebiz-secret-key';
const app = express();

app.use(cors());
app.use(express.json());

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Logo Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.user?.store_id || 'unknown'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user object now includes store_id
    next();
  });
};

// --- SMS Helper (Fast2SMS — set FAST2SMS_API_KEY in .env to enable) ---
const sendSMS = async (phone: string, message: string): Promise<void> => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.log('[SMS] No FAST2SMS_API_KEY set — skipping SMS to', phone);
      return;
    }
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      console.warn('[SMS] Invalid phone number:', phone);
      return;
    }
    const body = JSON.stringify({
      route: 'q', message, language: 'english', flash: 0, numbers: clean
    });
    const https = await import('https');
    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: { authorization: apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    await new Promise<void>((resolve) => {
      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (c: any) => { data += c; });
        res.on('end', () => { console.log('[SMS] Sent to', clean, ':', data); resolve(); });
      });
      req.on('error', (e: any) => { console.error('[SMS] Error:', e.message); resolve(); });
      req.write(body);
      req.end();
    });
  } catch (e: any) {
    console.error('[SMS] Unexpected error:', e.message);
  }
};

// --- API Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, storeName, phone } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Store (with email from registration)
    const storeResult = await client.query(
      'INSERT INTO stores (store_name, owner_name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
      [storeName, name, phone, email]
    );
    const storeId = storeResult.rows[0].id;

    // 2. Create Admin User
    const hash = bcrypt.hashSync(password, 10);
    await client.query(
      'INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hash, 'admin', storeId, 'active']
    );

    // 3. Initialize Settings with requested defaults
    await client.query(
      `INSERT INTO store_settings 
       (store_id, currency, default_gst, invoice_prefix, invoice_footer, low_stock_threshold, critical_stock_threshold) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [storeId, 'INR', 18, 'INV', 'Thank you for shopping!', 5, 2]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Registration successful' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role: requestedRole } = req.body;
  try {
    // 1. Fetch user by email first to check their actual role
    const result = await pool.query('SELECT id, email, password, role, name, status, store_id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    // 2. Validate password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    // 3. Validate Role Tier matching
    // Admin tier: must have role 'admin' or 'owner'
    // Employee tier: must have role 'employee', 'manager', 'sales', or 'helper'
    const isAdminTier = ['admin', 'owner'].includes(user.role);
    const isEmployeeTier = ['employee', 'manager', 'sales', 'helper'].includes(user.role);

    const isMatch = (requestedRole === 'admin' && isAdminTier) || 
                    (requestedRole === 'employee' && isEmployeeTier);

    if (!isMatch) {
      return res.status(401).json({ message: 'Access denied for this role tier' });
    }

    // 4. Success - Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, store_id: user.store_id }, 
      JWT_SECRET
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, name: user.name, store_id: user.store_id } 
    });

  } catch(err: any) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Login processing error: ' + err.message });
  }
});

// Update Profile Password
app.put('/api/auth/profile/password', authenticateToken, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    
    const hash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Store - Get store profile (used by Setup Wizard to prefill form)
app.get('/api/store', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT store_name as "storeName", owner_name as "ownerName", phone, email, 
              address, gst_number as "gstNumber", logo_url as "logoUrl", 
              is_setup_complete as "isSetupComplete", created_at 
       FROM stores WHERE id = $1`,
      [req.user.store_id]
    );
    res.json(result.rows[0] || {});
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alias for the same endpoint (used explicitly by Setup Wizard)
app.get('/api/store/profile', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT store_name as "storeName", owner_name as "ownerName", phone, email, 
              address, gst_number as "gstNumber", logo_url as "logoUrl",
              is_setup_complete as "isSetupComplete"
       FROM stores WHERE id = $1`,
      [req.user.store_id]
    );
    res.json(result.rows[0] || {});
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store/setup', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  // Only update the fields the Setup Wizard collects (address, gst) — do NOT overwrite
  // store_name / owner_name / phone already saved during registration.
  const { address, gstNumber, categories, storeName, ownerName, phone } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch current values as fallback so we never null-out registration data
    const current = await client.query('SELECT store_name, owner_name, phone FROM stores WHERE id = $1', [req.user.store_id]);
    const cur = current.rows[0] || {};

    await client.query(`
      UPDATE stores SET 
        store_name = $1,
        owner_name = $2,
        phone = $3,
        address = $4,
        gst_number = $5,
        is_setup_complete = 1
      WHERE id = $6
    `, [
      storeName || cur.store_name,
      ownerName || cur.owner_name,
      phone     || cur.phone,
      address,
      gstNumber,
      req.user.store_id
    ]);
    
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await client.query('INSERT INTO categories (name, store_id) VALUES ($1, $2) ON CONFLICT (name, store_id) DO NOTHING', [cat, req.user.store_id]);
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('Setup Error:', e);
    res.status(500).json({ error: e.message || 'Setup failed' });
  } finally {
    client.release();
  }
});

// Categories
app.get('/api/categories', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE store_id = $1 ORDER BY name ASC', [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, store_id) VALUES ($1, $2) ON CONFLICT (name, store_id) DO NOTHING RETURNING id',
      [name.trim(), req.user.store_id]
    );
    if (result.rows.length === 0) return res.status(409).json({ error: 'Category already exists' });
    res.json({ id: result.rows[0].id, name: name.trim() });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', authenticateToken, async (req: any, res) => {
  try {
    const products = await pool.query(`
      SELECT p.id, p.name, p.categoryid as "categoryId", p.brand, p.costprice as "costPrice", p.sellingprice as "sellingPrice", 
             p.gstpercent as "gstPercent", p.stock, p.minimumstock as "minimumStock", p.reorderquantity as "reorderQuantity", 
             p.imageurl as "imageUrl", p.description, 
             c.name as "categoryName"
      FROM products p 
      LEFT JOIN categories c ON p.categoryid = c.id
      WHERE p.store_id = $1
    `, [req.user.store_id]);
    res.json(products.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  let { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  
  try {
    // 1. Sanitize numeric fields
    const sanitizedCost = parseFloat(costPrice) || 0;
    const sanitizedSell = parseFloat(sellingPrice) || 0;
    const sanitizedGst = parseFloat(gstPercent) || 0;
    const sanitizedStock = parseInt(stock) || 0;
    const sanitizedMinStock = parseInt(minimumStock) || 5;
    const sanitizedReorder = parseInt(reorderQuantity) || 10;

    if (sanitizedCost < 0 || sanitizedSell < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    // 2. Category Lookup if categoryId is a name (string)
    if (isNaN(parseInt(categoryId))) {
      const catLookup = await pool.query('SELECT id FROM categories WHERE name = $1 AND store_id = $2', [categoryId, req.user.store_id]);
      if (catLookup.rows.length > 0) {
        categoryId = catLookup.rows[0].id;
      }
    }

    const result = await pool.query(`
      INSERT INTO products (name, categoryid, brand, costprice, sellingprice, gstpercent, stock, minimumstock, reorderquantity, description, imageurl, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
    `, [name, categoryId, brand, sanitizedCost, sanitizedSell, sanitizedGst, sanitizedStock, sanitizedMinStock, sanitizedReorder, description, imageUrl, req.user.store_id]);
    
    res.json({ id: result.rows[0].id });
  } catch(err: any) {
    console.error('Product Creation Error:', err);
    if (err.code === '23505') {
       return res.status(400).json({ error: 'A product with this name AND brand already exists. Use a different brand/variant.' });
    }
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  try {
    const result = await pool.query(`
      UPDATE products SET name=$1, categoryid=$2, brand=$3, costprice=$4, sellingprice=$5, gstpercent=$6, stock=$7, minimumstock=$8, reorderquantity=$9, description=$10, imageurl=$11
      WHERE id=$12 AND store_id=$13
    `, [name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl, req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found or access denied' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found or access denied' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HIERARCHY: Brands ───────────────────────────────────────────────────────

// GET all brands for a product
app.get('/api/products/:productId/brands', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, product_id as "productId", name FROM brands WHERE product_id = $1 AND store_id = $2 ORDER BY name ASC',
      [req.params.productId, req.user.store_id]
    );
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create brand under a product
app.post('/api/brands', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { productId, name } = req.body;
  if (!productId || !name) return res.status(400).json({ error: 'productId and name required' });
  try {
    const result = await pool.query(
      'INSERT INTO brands (product_id, store_id, name) VALUES ($1, $2, $3) ON CONFLICT (product_id, name) DO NOTHING RETURNING id',
      [productId, req.user.store_id, name.trim()]
    );
    if (result.rows.length === 0) return res.status(409).json({ error: 'Brand already exists for this product' });
    res.json({ id: result.rows[0].id, productId, name: name.trim() });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE brand (cascades variants)
app.delete('/api/brands/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    const result = await pool.query('DELETE FROM brands WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Brand not found' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HIERARCHY: Variants ─────────────────────────────────────────────────────

// GET variants for a brand
app.get('/api/brands/:brandId/variants', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT id, brand_id as "brandId", variant_name as "variantName",
              selling_price as "sellingPrice", cost_price as "costPrice",
              gst_percent as "gstPercent", stock, minimum_stock as "minimumStock", image_url as "imageUrl"
       FROM variants WHERE brand_id = $1 AND store_id = $2 ORDER BY variant_name ASC`,
      [req.params.brandId, req.user.store_id]
    );
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create variant under a brand
app.post('/api/variants', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { brandId, variantName, sellingPrice, costPrice, gstPercent, stock, minimumStock, imageUrl } = req.body;
  if (!brandId || !variantName) return res.status(400).json({ error: 'brandId and variantName required' });
  try {
    const result = await pool.query(
      `INSERT INTO variants (brand_id, store_id, variant_name, selling_price, cost_price, gst_percent, stock, minimum_stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [brandId, req.user.store_id, variantName.trim(),
       parseFloat(sellingPrice) || 0, parseFloat(costPrice) || 0, parseFloat(gstPercent) || 0,
       parseInt(stock) || 0, parseInt(minimumStock) || 5, imageUrl || null]
    );
    res.json({ id: result.rows[0].id });
  } catch(err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Variant name already exists for this brand' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update variant
app.put('/api/variants/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { variantName, sellingPrice, costPrice, gstPercent, stock, minimumStock, imageUrl } = req.body;
  try {
    const result = await pool.query(
      `UPDATE variants SET variant_name=$1, selling_price=$2, cost_price=$3, gst_percent=$4, stock=$5, minimum_stock=$6, image_url=$7
       WHERE id=$8 AND store_id=$9`,
      [variantName, parseFloat(sellingPrice) || 0, parseFloat(costPrice) || 0, parseFloat(gstPercent) || 0,
       parseInt(stock) || 0, parseInt(minimumStock) || 5, imageUrl || null, req.params.id, req.user.store_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Variant not found' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE variant
app.delete('/api/variants/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    const result = await pool.query('DELETE FROM variants WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Variant not found' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FLAT VARIANTS — for Billing POS ────────────────────────────────────────
// Returns a flat list of all variants with product/brand/category context for the billing page
app.get('/api/variants/flat', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id as "variantId",
        v.variant_name as "variantName",
        v.selling_price as "sellingPrice",
        v.cost_price as "costPrice",
        v.gst_percent as "gstPercent",
        v.stock,
        v.minimum_stock as "minimumStock",
        COALESCE(v.image_url, p.imageurl) as "imageUrl",
        b.id as "brandId",
        b.name as "brandName",
        p.id as "productId",
        p.name as "productName",
        p.categoryid as "categoryId",
        c.name as "categoryName"
      FROM variants v
      JOIN brands b ON v.brand_id = b.id
      JOIN products p ON b.product_id = p.id
      LEFT JOIN categories c ON p.categoryid = c.id
      WHERE v.store_id = $1
      ORDER BY c.name ASC, p.name ASC, b.name ASC, v.variant_name ASC
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET full hierarchy for product management ────────────────────────────────
app.get('/api/products/hierarchy', authenticateToken, async (req: any, res) => {
  try {
    // Get products
    const products = await pool.query(`
      SELECT p.id, p.name, p.categoryid as "categoryId", p.imageurl as "imageUrl", p.description,
             c.name as "categoryName"
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.id
      WHERE p.store_id = $1
      ORDER BY c.name ASC, p.name ASC
    `, [req.user.store_id]);

    // Get all brands for this store
    const brands = await pool.query(
      'SELECT id, product_id as "productId", name FROM brands WHERE store_id = $1 ORDER BY name ASC',
      [req.user.store_id]
    );

    // Get all variants for this store
    const variants = await pool.query(`
      SELECT id, brand_id as "brandId", variant_name as "variantName",
             selling_price as "sellingPrice", cost_price as "costPrice",
             gst_percent as "gstPercent", stock, minimum_stock as "minimumStock", image_url as "imageUrl"
      FROM variants WHERE store_id = $1 ORDER BY variant_name ASC
    `, [req.user.store_id]);

    // Assemble hierarchy
    const brandsByProduct = new Map<number, any[]>();
    const variantsByBrand = new Map<number, any[]>();

    for (const v of variants.rows) {
      if (!variantsByBrand.has(v.brandId)) variantsByBrand.set(v.brandId, []);
      variantsByBrand.get(v.brandId)!.push(v);
    }
    for (const b of brands.rows) {
      if (!brandsByProduct.has(b.productId)) brandsByProduct.set(b.productId, []);
      brandsByProduct.get(b.productId)!.push({ ...b, variants: variantsByBrand.get(b.id) || [] });
    }

    const hierarchy = products.rows.map(p => ({
      ...p,
      brands: brandsByProduct.get(p.id) || []
    }));

    res.json(hierarchy);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', authenticateToken, async (req: any, res) => {
  try {
    // Return unique customers per store based on phone
    const result = await pool.query(`
      SELECT DISTINCT ON (phone) id, name, phone as "mobile", total_spent as "totalPurchases", last_visit as "lastPurchaseDate", loyalty_points as "loyaltyPoints" 
      FROM customers 
      WHERE store_id = $1 
      ORDER BY phone, last_visit DESC
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req: any, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, store_id) VALUES ($1, $2, $3) ON CONFLICT (phone, store_id) DO UPDATE SET name = EXCLUDED.name RETURNING id', 
      [name, phone, req.user.store_id]
    );
    res.json({ id: result.rows[0].id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Customer Lookup (Loyalty Points) ─────────────────────────────────────────
app.get('/api/customers/lookup/:phone', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, phone, loyalty_points as "loyaltyPoints" FROM customers WHERE phone = $1 AND store_id = $2',
      [req.params.phone, req.user.store_id]
    );
    if (result.rows.length === 0) {
      return res.json({ found: false, loyaltyPoints: 0 });
    }
    res.json({ found: true, ...result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id/history', authenticateToken, async (req: any, res) => {
  try {
    const history = await pool.query(`
      SELECT s.id, s.invoiceid as "invoiceId", s.grandtotal as "total", s.date,
             (SELECT json_agg(json_build_object('productName', p.name, 'quantity', si.quantity, 'total', si.total))
              FROM sale_items si
              JOIN products p ON si.productid = p.id
              WHERE si.saleid = s.id) as items
      FROM sales s
      WHERE s.customerid = $1 AND s.store_id = $2
      ORDER BY s.date DESC
    `, [req.params.id, req.user.store_id]);
    res.json(history.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sales & Billing
app.post('/api/sales', authenticateToken, async (req: any, res) => {
  const { customerId: providedId, customerName, customerPhone, items, subtotal, gstTotal, grandTotal } = req.body;
  const invoiceId = 'INV-' + Date.now();
  const date = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalCustomerId = providedId;

    if (customerPhone) {
      // Robust customer upsert by phone number within the store
      const existingCust = await client.query(
        'SELECT id FROM customers WHERE phone = $1 AND store_id = $2',
        [customerPhone, req.user.store_id]
      );
      
      if (existingCust.rows.length > 0) {
        finalCustomerId = existingCust.rows[0].id;
        await client.query(
          'UPDATE customers SET total_spent = total_spent + $1, last_visit = CURRENT_TIMESTAMP, name = $2 WHERE id = $3', 
          [grandTotal, customerName || 'Walking Customer', finalCustomerId]
        );
      } else {
        const newCust = await client.query(
          'INSERT INTO customers (name, phone, total_spent, last_visit, store_id) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING id',
          [customerName || 'Walking Customer', customerPhone, grandTotal, req.user.store_id]
        );
        finalCustomerId = newCust.rows[0].id;
      }
    } else if (!providedId) {
      // If no phone and no ID, check if a generic "Walking Customer" exists for this store
      const walkingCust = await client.query(
        'SELECT id FROM customers WHERE name = $1 AND phone IS NULL AND store_id = $2',
        ['Walking Customer', req.user.store_id]
      );
      if (walkingCust.rows.length > 0) {
        finalCustomerId = walkingCust.rows[0].id;
        await client.query('UPDATE customers SET total_spent = total_spent + $1, last_visit = CURRENT_TIMESTAMP WHERE id = $2', [grandTotal, finalCustomerId]);
      } else {
        const newWalking = await client.query(
          'INSERT INTO customers (name, total_spent, last_visit, store_id) VALUES ($1, $2, CURRENT_TIMESTAMP, $3) RETURNING id',
          ['Walking Customer', grandTotal, req.user.store_id]
        );
        finalCustomerId = newWalking.rows[0].id;
      }
    }

    const saleResult = await client.query(`
      INSERT INTO sales (invoiceid, customerid, subtotal, gsttotal, grandtotal, date, createdby, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [invoiceId, finalCustomerId, subtotal, gstTotal, grandTotal, date, req.user.id, req.user.store_id]);

    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      const variantId = item.variantId || null;
      const productId = item.productId || item.id || null;
      const unitPrice = item.sellingPrice;
      const gstPercent = item.gstPercent || 0;
      // GST-INCLUSIVE extraction formula for the backend item records
      const gstAmt = ((unitPrice * gstPercent) / (100 + gstPercent)) * item.quantity;

      await client.query(`
        INSERT INTO sale_items (saleid, productid, variant_id, quantity, unitprice, gstamount, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [saleId, productId, variantId, item.quantity, unitPrice, gstAmt, item.total]);

      if (variantId) {
        // New hierarchy: deduct from variant stock
        await client.query('UPDATE variants SET stock = stock - $1 WHERE id = $2 AND store_id = $3', [item.quantity, variantId, req.user.store_id]);
      } else if (productId) {
        // Legacy: deduct from product stock
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND store_id = $3', [item.quantity, productId, req.user.store_id]);
      }
    }


    // ── Loyalty Points Logic ──────────────────────────────────────────────────
    let pointsEarned = 0;
    let pointsRedeemed = 0;
    let newPointsBalance = 0;

    if (finalCustomerId) {
      // Calculate points earned: ₹100 = 1 point (round down)
      pointsEarned = Math.floor(Number(grandTotal) / 100);

      // Handle points redemption
      const reqPointsToRedeem = parseInt(req.body.pointsToRedeem) || 0;
      if (reqPointsToRedeem > 0 && customerPhone) {
        // Validate: fetch current balance
        const custPoints = await client.query(
          'SELECT loyalty_points FROM customers WHERE id = $1',
          [finalCustomerId]
        );
        const currentPoints = parseInt(custPoints.rows[0]?.loyalty_points) || 0;
        // Points cannot exceed balance or grand total
        pointsRedeemed = Math.min(reqPointsToRedeem, currentPoints, Math.floor(Number(grandTotal)));
      }

      // Update customer loyalty points: add earned, subtract redeemed
      const pointsDelta = pointsEarned - pointsRedeemed;
      await client.query(
        'UPDATE customers SET loyalty_points = GREATEST(loyalty_points + $1, 0) WHERE id = $2',
        [pointsDelta, finalCustomerId]
      );

      // Store points on the sale record (prevents double-awarding)
      await client.query(
        'UPDATE sales SET points_earned = $1, points_redeemed = $2 WHERE id = $3',
        [pointsEarned, pointsRedeemed, saleId]
      );

      // Fetch the updated balance
      const updatedCust = await client.query(
        'SELECT loyalty_points FROM customers WHERE id = $1',
        [finalCustomerId]
      );
      newPointsBalance = parseInt(updatedCust.rows[0]?.loyalty_points) || 0;
    }

    await client.query('COMMIT');

    res.json({ id: saleId, invoiceId, pointsEarned, pointsRedeemed, newPointsBalance });
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('[Sales Error]', e.stack || e.message);
    require('fs').appendFileSync('backend_error.log', new Date().toISOString() + ' ' + (e.stack || e.message) + '\\n');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }

  // ── SMS Bill: fire-and-forget AFTER response is sent (never blocks checkout) ────
  if (customerPhone) {
    try {
      const storeName = await pool.query('SELECT store_name FROM stores WHERE id = $1', [req.user.store_id]);
      const sName = storeName.rows[0]?.store_name || 'CoreBiz';
      const smsText = `Thank you for shopping at ${sName}!\nInvoice: ${invoiceId}\nTotal: Rs.${grandTotal}\nVisit again!\n-${sName}`;
      sendSMS(customerPhone, smsText);
    } catch (_) { /* SMS errors are non-fatal */ }
  }
});

app.get('/api/sales/:id', authenticateToken, async (req: any, res) => {
  try {
    const saleResult = await pool.query(`
      SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
             c.name as "customerName", c.phone as "customerMobile"
      FROM sales s
      LEFT JOIN customers c ON s.customerid = c.id
      WHERE s.id = $1 AND s.store_id = $2
    `, [req.params.id, req.user.store_id]);

    const sale = saleResult.rows[0];
    if (!sale) return res.sendStatus(404);

    const itemsResult = await pool.query(`
      SELECT si.id, si.saleid as "saleId", si.productid as "productId", si.quantity, si.unitprice as "unitPrice", si.gstamount as "gstAmount", si.total, 
             p.name as "productName"
      FROM sale_items si
      JOIN products p ON si.productid = p.id
      WHERE si.saleid = $1 AND p.store_id = $2
    `, [req.params.id, req.user.store_id]);

    res.json({ ...sale, items: itemsResult.rows });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
  try {
    const [productsRes, salesRes, customersRes, revenueRes, lowStockRes, recentSalesRes, profitRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM products WHERE store_id = $1', [req.user.store_id]),
      pool.query('SELECT COUNT(*) as count FROM sales WHERE store_id = $1', [req.user.store_id]),
      pool.query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1', [req.user.store_id]),
      pool.query(`
        SELECT to_char(month, 'Mon') as month, COALESCE(SUM(s.grandtotal), 0) as revenue
        FROM generate_series(date_trunc('year', CURRENT_DATE), date_trunc('year', CURRENT_DATE) + interval '11 months', interval '1 month') AS month
        LEFT JOIN sales s ON date_trunc('month', s.date) = month AND s.store_id = $1
        GROUP BY month
        ORDER BY month
      `, [req.user.store_id]),
      pool.query(`
        (SELECT p.id as "id", p.name as "name", p.brand as "brand", p.stock, s.low_stock_threshold as "threshold", 'product' as "type"
         FROM products p
         JOIN store_settings s ON p.store_id = s.store_id
         WHERE p.stock < s.low_stock_threshold AND p.store_id = $1)
        UNION ALL
        (SELECT v.id as "id", v.variant_name as "name", b.name as "brand", v.stock, s.low_stock_threshold as "threshold", 'variant' as "type"
         FROM variants v
         JOIN brands b ON v.brand_id = b.id
         JOIN store_settings s ON v.store_id = s.store_id
         WHERE v.stock < s.low_stock_threshold AND v.store_id = $1)
        LIMIT 10
      `, [req.user.store_id]),
      pool.query(`
        SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
               c.name as "customerName" 
        FROM sales s 
        LEFT JOIN customers c ON s.customerid = c.id 
        WHERE s.store_id = $1
        ORDER BY s.date DESC LIMIT 5
      `, [req.user.store_id]),
      pool.query(`
        SELECT COALESCE(SUM(si.quantity * (si.unitprice - COALESCE(v.cost_price, p.costprice))), 0) AS "totalProfit"
        FROM sale_items si
        LEFT JOIN variants v ON si.variant_id = v.id
        LEFT JOIN products p ON si.productid = p.id
        WHERE (p.store_id = $1 OR v.store_id = $1)
      `, [req.user.store_id])
    ]);

    // Calculate current month's revenue from the 12-month result
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' });
    const currentMonthRevenue = revenueRes.rows.find(r => r.month === currentMonthName)?.revenue || 0;

    res.json({
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      totalSales: parseInt(salesRes.rows[0].count, 10),
      totalCustomers: parseInt(customersRes.rows[0].count, 10),
      monthlyRevenue: parseFloat(currentMonthRevenue as string) || 0,
      lowStock: lowStockRes.rows,
      recentSales: recentSalesRes.rows,
      revenueHistory: revenueRes.rows,
      totalProfit: parseFloat(profitRes.rows[0].totalProfit) || 0
    });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employee Dashboard Stats
app.get('/api/employee/dashboard', authenticateToken, async (req: any, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // simple today date
    const [salesCountRes, revenueRes, recentSalesRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM sales WHERE createdby = $1 AND store_id = $2 AND DATE(date) = CURRENT_DATE`, [req.user.id, req.user.store_id]),
      pool.query(`SELECT COALESCE(SUM(grandtotal), 0) as revenue FROM sales WHERE createdby = $1 AND store_id = $2 AND DATE(date) = CURRENT_DATE`, [req.user.id, req.user.store_id]),
      pool.query(`
        SELECT s.id, s.invoiceid as "invoiceId", s.grandtotal as "grandTotal", s.date, c.name as "customerName"
        FROM sales s
        LEFT JOIN customers c ON s.customerid = c.id
        WHERE s.createdby = $1 AND s.store_id = $2
        ORDER BY s.date DESC LIMIT 5
      `, [req.user.id, req.user.store_id])
    ]);

    res.json({
      todaySalesCount: parseInt(salesCountRes.rows[0].count, 10),
      todayRevenue: parseFloat(revenueRes.rows[0].revenue) || 0,
      recentSales: recentSalesRes.rows
    });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory Alerts
app.get('/api/inventory/low-stock', authenticateToken, async (req: any, res) => {
  try {
    const [variantsRes, productsRes] = await Promise.all([
      // Get low stock variants (New Hierarchy)
      pool.query(`
        SELECT v.id, v.variant_name as name, v.stock, v.minimum_stock as "minStock", 
               p.name as "productName", b.name as "brandName"
        FROM variants v
        JOIN brands b ON v.brand_id = b.id
        JOIN products p ON b.product_id = p.id
        WHERE v.store_id = $1 AND v.stock <= v.minimum_stock
        ORDER BY v.stock ASC
      `, [req.user.store_id]),
      // Get low stock products (Legacy / Base)
      pool.query(`
        SELECT p.id, p.name, p.stock, p.minimumstock as "minStock", p.brand
        FROM products p
        WHERE p.store_id = $1 AND p.stock <= p.minimumstock
      `, [req.user.store_id])
    ]);

    res.json({
      variants: variantsRes.rows,
      products: productsRes.rows
    });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Add Stock to Variant (Admin Only) ────────────────────────────────────────
app.put('/api/variants/add-stock/:id', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  const { quantity } = req.body;
  const qty = parseInt(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantity must be a positive number' });
  try {
    const result = await pool.query(
      'UPDATE variants SET stock = stock + $1 WHERE id = $2 AND store_id = $3 RETURNING id, stock',
      [qty, req.params.id, req.user.store_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Variant not found' });
    res.json({ success: true, newStock: result.rows[0].stock });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Complaints System ─────────────────────────────────────────────────────────

// Employee: Raise a complaint
app.post('/api/complaints', authenticateToken, async (req: any, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  try {
    const result = await pool.query(
      'INSERT INTO complaints (store_id, employee_id, message, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.store_id, req.user.id, message.trim(), 'pending']
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all complaints for their store
app.get('/api/complaints', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await pool.query(`
      SELECT c.id, c.message, c.status, c.created_at,
             u.name as "employeeName", u.email as "employeeEmail", u.role as "employeeRole"
      FROM complaints c
      JOIN users u ON c.employee_id = u.id
      WHERE c.store_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get pending complaint count (for badge)
app.get('/api/complaints/count', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.json({ count: 0 });
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM complaints WHERE store_id = $1 AND status = 'pending'",
      [req.user.store_id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Resolve a complaint
app.patch('/api/complaints/:id/resolve', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await pool.query(
      "UPDATE complaints SET status = 'resolved' WHERE id = $1 AND store_id = $2 RETURNING id",
      [req.params.id, req.user.store_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reports
app.get('/api/reports/summary', authenticateToken, async (req: any, res) => {
  try {
    const summaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(grandtotal), 0) as "total_revenue",
        COUNT(*) as "total_orders",
        COALESCE(AVG(grandtotal), 0) as "average_order_value",
        COALESCE(SUM(gsttotal), 0) as "gst_collected"
      FROM sales 
      WHERE store_id = $1
    `, [req.user.store_id]);

    const profitRes = await pool.query(`
      SELECT 
        COALESCE(SUM(si.quantity * (si.unitprice - p.costprice)), 0) AS total_profit
      FROM sale_items si
      JOIN products p ON si.productid = p.id
      WHERE p.store_id = $1
    `, [req.user.store_id]);

    res.json({
      ...summaryRes.rows[0],
      total_profit: profitRes.rows[0].total_profit
    });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/yearly-revenue', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        to_char(month, 'Mon') as month, 
        COALESCE(SUM(s.grandtotal), 0) as revenue
      FROM generate_series(date_trunc('year', CURRENT_DATE), date_trunc('year', CURRENT_DATE) + interval '11 months', interval '1 month') AS month
      LEFT JOIN sales s ON date_trunc('month', s.date) = month AND s.store_id = $1
      GROUP BY month
      ORDER BY month
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/category-distribution', authenticateToken, async (req: any, res) => {
  try {
    const distribution = await pool.query(`
      SELECT 
        c.name, 
        SUM(si.quantity * si.unitprice) AS revenue
      FROM sale_items si
      JOIN products p ON si.productid = p.id
      JOIN categories c ON p.categoryid = c.id
      WHERE p.store_id = $1
      GROUP BY c.name
      ORDER BY revenue DESC
    `, [req.user.store_id]);
    res.json(distribution.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/top-products', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.name, 
        SUM(si.quantity) AS total_sold
      FROM sale_items si
      JOIN products p ON si.productid = p.id
      WHERE p.store_id = $1
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employees
app.get('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  try {
    const employees = await pool.query("SELECT id, email, role, name, status, salary, join_date as \"joinDate\", phone, created_at FROM users WHERE role IN ('employee', 'manager', 'sales', 'helper') AND store_id = $1 ORDER BY status ASC, created_at DESC", [req.user.store_id]);
    res.json(employees.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  const { name, email, phone, salary, role, status, joinDate } = req.body;
  try {
    // Build update dynamically to support partial updates (e.g. just status)
    const current = await pool.query('SELECT name, email, phone, salary, role, status, join_date FROM users WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (current.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    const c = current.rows[0];

    const finalName = name ?? c.name;
    const finalEmail = email ?? c.email;
    const finalPhone = phone ?? c.phone;
    const finalSalary = salary ?? c.salary;
    const finalRole = role ?? c.role;
    const finalStatus = status ?? c.status;
    const finalJoinDate = joinDate ?? c.join_date;

    await pool.query(`
      UPDATE users SET name=$1, email=$2, phone=$3, salary=$4, role=$5, status=$6, join_date=$7
      WHERE id=$8 AND store_id=$9
    `, [finalName, finalEmail, finalPhone, finalSalary, finalRole, finalStatus, finalJoinDate, req.params.id, req.user.store_id]);
    res.json({ success: true });
  } catch(err: any) {
    console.error('Employee Update Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  const { email, password, name, role = 'employee', salary, joinDate } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  
  try {
    let finalSalary = salary;
    if (!finalSalary) {
      // Get defaults from settings
      const settingsRes = await pool.query('SELECT default_sales_salary, default_manager_salary, default_helper_salary FROM store_settings WHERE store_id = $1', [req.user.store_id]);
      const settings = settingsRes.rows[0];
      if (settings) {
        if (role === 'sales') finalSalary = settings.default_sales_salary;
        else if (role === 'manager') finalSalary = settings.default_manager_salary;
        else finalSalary = settings.default_helper_salary;
      }
    }

    await pool.query(
      'INSERT INTO users (email, password, role, name, status, store_id, salary, join_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
      [email, hash, role, name, 'active', req.user.store_id, finalSalary || 0, joinDate || new Date()]
    );
    res.json({ success: true });
  } catch (e: any) {
    console.error('Create Employee Error:', e);
    res.status(400).json({ message: 'Email already exists or invalid data' });
  }
});

// Settings - Store Profile
app.put('/api/store/update', authenticateToken, upload.single('logo'), async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { storeName, ownerName, phone, email, address, gstNumber, logoUrl: providedLogoUrl } = req.body;
  
  let finalLogoUrl = providedLogoUrl;
  if (req.file) {
    // Construct local URL for the uploaded file
    finalLogoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;
  }

  try {
    await pool.query(`
      UPDATE stores SET 
        store_name = $1, owner_name = $2, phone = $3, email = $4, 
        address = $5, gst_number = $6, logo_url = $7
      WHERE id = $8
    `, [storeName, ownerName, phone, email, address, gstNumber, finalLogoUrl, req.user.store_id]);
    res.json({ success: true, logoUrl: finalLogoUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings - Billing & Inventory
app.get('/api/settings/:section', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM store_settings WHERE store_id = $1', [req.user.store_id]);
    
    if (result.rows.length === 0) {
      // Auto-initialize if missing
      const initResult = await pool.query(
        `INSERT INTO store_settings 
         (store_id, currency, default_gst, invoice_prefix, invoice_footer, low_stock_threshold, critical_stock_threshold) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [req.user.store_id, 'INR', 18, 'INV', 'Thank you for shopping!', 5, 2]
      );
      return res.json(initResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/billing', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { currency, defaultGst, invoicePrefix, invoiceFooter } = req.body;
  try {
    await pool.query(`
      UPDATE store_settings SET 
        currency = $1, default_gst = $2, invoice_prefix = $3, invoice_footer = $4
      WHERE store_id = $5
    `, [currency, defaultGst, invoicePrefix, invoiceFooter, req.user.store_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/inventory', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { lowStockThreshold, criticalStockThreshold, enableNotifications } = req.body;
  try {
    await pool.query(`
      UPDATE store_settings SET 
        low_stock_threshold = $1, critical_stock_threshold = $2, enable_stock_notifications = $3
      WHERE store_id = $4
    `, [lowStockThreshold, criticalStockThreshold, enableNotifications, req.user.store_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/employee-salary', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT default_sales_salary as "defaultSalesSalary", default_manager_salary as "defaultManagerSalary", default_helper_salary as "defaultHelperSalary" FROM store_settings WHERE store_id = $1', [req.user.store_id]);
    res.json(result.rows[0] || { defaultSalesSalary: 0, defaultManagerSalary: 0, defaultHelperSalary: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/employee-salary', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  const { defaultSalesSalary, defaultManagerSalary, defaultHelperSalary } = req.body;
  try {
    await pool.query(`
      UPDATE store_settings SET 
        default_sales_salary = $1, default_manager_salary = $2, default_helper_salary = $3
      WHERE store_id = $4
    `, [defaultSalesSalary, defaultManagerSalary, defaultHelperSalary, req.user.store_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Security - Password Change
app.put('/api/users/change-password', authenticateToken, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    
    if (bcrypt.compareSync(currentPassword, user.password)) {
      const hash = bcrypt.hashSync(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ message: 'Current password incorrect' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset Database API (Admin Only) ──────────────────────────────────────────
app.post('/api/admin/reset-db', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  
  // For extra safety, verify the admin email matches the system default admin email
  if (req.user.email !== 'admin@corebiz.com') {
    return res.status(403).json({ message: 'Only the system super-admin can perform a full reset' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Truncate all core tables
    await client.query(`
      TRUNCATE TABLE 
        sale_items, sales, customers, variants, brands, 
        products, categories, complaints, users, 
        store_settings, stores 
      RESTART IDENTITY CASCADE
    `);

    // Re-seed default store
    const storeRes = await client.query(
      "INSERT INTO stores (store_name, owner_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id",
      ['CoreBiz Demo Store', 'System Administrator', 'admin@corebiz.com', '0000000000']
    );
    const storeId = storeRes.rows[0].id;

    // Re-seed default admin
    const adminHash = bcrypt.hashSync('admin123', 10);
    await client.query(
      "INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
      ['Admin', 'admin@corebiz.com', adminHash, 'admin', storeId, 'active']
    );

    // Re-seed default employee
    const employeeHash = bcrypt.hashSync('employee123', 10);
    await client.query(
      "INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
      ['Employee', 'employee@corebiz.com', employeeHash, 'employee', storeId, 'active']
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Database reset and seeded successfully' });
  } catch (err: any) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// ─── Employee Complaints ──────────────────────────────────────────────────
app.post('/api/complaints', authenticateToken, async (req: any, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    await pool.query(
      'INSERT INTO complaints (store_id, employee_id, message) VALUES ($1, $2, $3)',
      [req.user.store_id, req.user.id, message]
    );
    res.json({ success: true, message: 'Complaint submitted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/complaints', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    const result = await pool.query(`
      SELECT c.id, c.message, c.status, c.created_at as "createdAt",
             u.name as "employeeName", u.role as "employeeRole"
      FROM complaints c
      JOIN users u ON c.employee_id = u.id
      WHERE c.store_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.store_id]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/complaints/:id/resolve', authenticateToken, async (req: any, res) => {
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  try {
    await pool.query(
      "UPDATE complaints SET status = 'resolved' WHERE id = $1 AND store_id = $2",
      [req.params.id, req.user.store_id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



// --- Server Initialization ---

/** Run schema migrations every startup to keep the DB in sync */
const runMigrations = async () => {
  try {
    // 1. Add phone column to users if it does not exist yet
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);

    // 2. Add salary column if missing
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2) DEFAULT 0`);

    // 3. Add join_date column if missing
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE`);

    // 4. Widen the role check constraint so helper / sales / manager are allowed
    //    (Previous migration locked it to 'admin', 'employee', 'owner' only)
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'employee', 'manager', 'sales', 'helper', 'owner'))
    `);

    // 5. Ensure sale_items has variant_id column (added in hierarchy upgrade)
    await pool.query(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS variant_id INT`);

    // 6. Ensure stores.email column exists (needed for registration)
    await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);

    // 6.5 Fix legacy unique phone constraint to be store-scoped
    try {
      await pool.query(`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_mobile_key`);
      await pool.query(`DROP INDEX IF EXISTS customers_mobile_key`);
      await pool.query(`ALTER TABLE customers ADD CONSTRAINT customers_phone_store_id_key UNIQUE (phone, store_id)`);
    } catch (e: any) {
      if (!e.message.includes('already exists')) throw e;
    }

    // 7. Create complaints table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        store_id INT NOT NULL,
        employee_id INT NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Add loyalty_points column to customers if not exists
    await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0`);

    // 9. Add points tracking columns to sales if not exists
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0`);
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS points_redeemed INT DEFAULT 0`);

    console.log('DB migrations applied successfully');
  } catch (err: any) {
    console.warn('Migration warning (non-fatal):', err.message);
  }
};

const initializeDefaultUsers = async () => {
  try {
    // 1. Ensure Default Store exists (for seeding)
    const storeRes = await pool.query('SELECT id FROM stores LIMIT 1');
    let storeId = storeRes.rows[0]?.id;
    
    if (!storeId) {
      const newStore = await pool.query(
        "INSERT INTO stores (store_name, owner_name, phone) VALUES ($1, $2, $3) RETURNING id",
        ['CoreBiz Demo Store', 'System Administrator', '0000000000']
      );
      storeId = newStore.rows[0].id;
      console.log('Created default demo store');
    }

    // 2. Create Default Admin
    const adminEmail = 'admin@corebiz.com';
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['System Admin', adminEmail, hash, 'admin', storeId, 'active']
      );
      console.log('Default Admin created: admin@corebiz.com / admin123');
    }

    // 3. Create Default Employee
    const empEmail = 'employee@corebiz.com';
    const empCheck = await pool.query('SELECT id FROM users WHERE email = $1', [empEmail]);
    if (empCheck.rows.length === 0) {
      const hash = bcrypt.hashSync('employee123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, store_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Demo Employee', empEmail, hash, 'employee', storeId, 'active']
      );
      console.log('Default Employee created: employee@corebiz.com / employee123');
    }

  } catch (err) {
    console.error('CoreBiz Startup Init Failed:', err);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`CoreBiz Backend running on port ${PORT}`);
  await runMigrations();
  await initializeDefaultUsers();
});

