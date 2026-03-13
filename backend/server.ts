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

// Seed Admin directly through pool (async IIFE)
(async () => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (res.rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password, role, name, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin@corebiz.com', hash, 'admin', 'System Admin', 'active']
      );
    }

    // Seed Employee
    const empRes = await pool.query("SELECT * FROM users WHERE role = 'employee' LIMIT 1");
    if (empRes.rows.length > 0) {
      const existingEmployee = empRes.rows[0];
      console.log(`Employee login detected: ${existingEmployee.email}`);
    } else {
      const empHash = bcrypt.hashSync('employee123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['Default Employee', 'employee@corebiz.com', empHash, 'employee', 'active']
      );
      console.log(`Default employee created\nEmail: employee@corebiz.com\nPassword: employee123`);
    }

  } catch (err) {
    console.error('Failed to seed users:', err);
  }
})();

// --- API Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, storeName, phone } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Store
    const storeResult = await client.query(
      'INSERT INTO stores (store_name, owner_name, phone) VALUES ($1, $2, $3) RETURNING id',
      [storeName, name, phone]
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
  const { email, password, role } = req.body;
  try {
    const result = await pool.query('SELECT id, email, password, role, name, status, store_id FROM users WHERE email = $1 AND role = $2', [email, role]);
    const user = result.rows[0];
    
    if (user && user.status === 'active' && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, store_id: user.store_id }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, store_id: user.store_id } });
    } else {
      res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Store
app.get('/api/store', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT store_name as "storeName", owner_name as "ownerName", phone, email, address, gst_number as "gstNumber", logo_url as "logoUrl", created_at FROM stores WHERE id = $1', [req.user.store_id]);
    res.json(result.rows[0] || {});
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store/setup', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { storeName, ownerName, phone, address, gstNumber, categories } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE stores SET 
        store_name = $1,
        owner_name = $2,
        phone = $3,
        address = $4,
        gst_number = $5,
        is_setup_complete = 1
      WHERE id = $6
    `, [storeName, ownerName, phone, address, gstNumber, req.user.store_id]);
    
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
    const result = await pool.query('SELECT * FROM categories WHERE store_id = $1', [req.user.store_id]);
    res.json(result.rows);
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
  if (req.user.role === 'employee') return res.sendStatus(403);
  let { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  
  try {
    // 1. Sanitize numeric fields
    const sanitizedCost = parseFloat(costPrice) || 0;
    const sanitizedSell = parseFloat(sellingPrice) || 0;
    const sanitizedGst = parseFloat(gstPercent) || 0;
    const sanitizedStock = parseInt(stock) || 0;
    const sanitizedMinStock = parseInt(minimumStock) || 5;
    const sanitizedReorder = parseInt(reorderQuantity) || 10;

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
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
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
  if (req.user.role === 'employee') return res.sendStatus(403);
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Product not found or access denied' });
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT id, name, mobile, totalpurchases as "totalPurchases", lastpurchasedate as "lastPurchaseDate" FROM customers WHERE store_id = $1', [req.user.store_id]);
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req: any, res) => {
  const { name, mobile } = req.body;
  try {
    const result = await pool.query('INSERT INTO customers (name, mobile, store_id) VALUES ($1, $2, $3) RETURNING id', [name, mobile, req.user.store_id]);
    res.json({ id: result.rows[0].id });
  } catch (e: any) {
    try {
      const existing = await pool.query('SELECT id, name, mobile, totalpurchases as "totalPurchases", lastpurchasedate as "lastPurchaseDate" FROM customers WHERE mobile = $1 AND store_id = $2', [mobile, req.user.store_id]);
      res.json(existing.rows[0]);
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Sales & Billing
app.post('/api/sales', authenticateToken, async (req: any, res) => {
  const { customerId, items, subtotal, gstTotal, grandTotal } = req.body;
  const invoiceId = 'INV-' + Date.now();
  const date = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saleResult = await client.query(`
      INSERT INTO sales (invoiceid, customerid, subtotal, gsttotal, grandtotal, date, createdby, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [invoiceId, customerId, subtotal, gstTotal, grandTotal, date, req.user.id, req.user.store_id]);

    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items (saleid, productid, quantity, unitprice, gstamount, total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [saleId, item.id, item.quantity, item.sellingPrice, (item.sellingPrice * item.gstPercent / 100) * item.quantity, item.total]);

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND store_id = $3', [item.quantity, item.id, req.user.store_id]);
    }

    if (customerId) {
      await client.query('UPDATE customers SET totalpurchases = totalpurchases + $1, lastpurchasedate = $2 WHERE id = $3 AND store_id = $4', [grandTotal, date, customerId, req.user.store_id]);
    }

    await client.query('COMMIT');
    res.json({ id: saleId, invoiceId });
  } catch (e: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.get('/api/sales/:id', authenticateToken, async (req: any, res) => {
  try {
    const saleResult = await pool.query(`
      SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
             c.name as "customerName", c.mobile as "customerMobile"
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
    const [productsRes, salesRes, customersRes, revenueRes, lowStockRes, recentSalesRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM products WHERE store_id = $1', [req.user.store_id]),
      pool.query('SELECT COUNT(*) as count FROM sales WHERE store_id = $1', [req.user.store_id]),
      pool.query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1', [req.user.store_id]),
      pool.query("SELECT SUM(grandtotal) as total FROM sales WHERE date >= date_trunc('month', CURRENT_DATE) AND store_id = $1", [req.user.store_id]),
      pool.query('SELECT id, name, categoryid as "categoryId", brand, costprice as "costPrice", sellingprice as "sellingPrice", gstpercent as "gstPercent", stock, minimumstock as "minimumStock", reorderquantity as "reorderQuantity", imageurl as "imageUrl", description FROM products WHERE stock < 5 AND store_id = $1', [req.user.store_id]),
      pool.query(`
        SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
               c.name as "customerName" 
        FROM sales s 
        LEFT JOIN customers c ON s.customerid = c.id 
        WHERE s.store_id = $1
        ORDER BY s.date DESC LIMIT 5
      `, [req.user.store_id])
    ]);

    res.json({
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      totalSales: parseInt(salesRes.rows[0].count, 10),
      totalCustomers: parseInt(customersRes.rows[0].count, 10),
      monthlyRevenue: parseFloat(revenueRes.rows[0].total) || 0,
      lowStock: lowStockRes.rows,
      recentSales: recentSalesRes.rows
    });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reports
app.get('/api/reports/sales-trend', authenticateToken, async (req: any, res) => {
  try {
    const trend = await pool.query(`
      SELECT to_char(date, 'YYYY-MM-DD') as day, SUM(grandtotal) as revenue
      FROM sales
      WHERE store_id = $1
      GROUP BY to_char(date, 'YYYY-MM-DD')
      ORDER BY day ASC
      LIMIT 30
    `, [req.user.store_id]);
    res.json(trend.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employees
app.get('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  try {
    const employees = await pool.query("SELECT id, email, role, name, status, created_at FROM users WHERE role = 'employee' AND store_id = $1", [req.user.store_id]);
    res.json(employees.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role === 'employee') return res.sendStatus(403);
  const { email, password, name } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    await pool.query('INSERT INTO users (email, password, role, name, status, store_id) VALUES ($1, $2, $3, $4, $5, $6)', [email, hash, 'employee', name, 'active', req.user.store_id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

// Settings - Store Profile
app.put('/api/store/update', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { storeName, ownerName, phone, email, address, gstNumber, logoUrl } = req.body;
  try {
    await pool.query(`
      UPDATE stores SET 
        store_name = $1, owner_name = $2, phone = $3, email = $4, 
        address = $5, gst_number = $6, logo_url = $7
      WHERE id = $8
    `, [storeName, ownerName, phone, email, address, gstNumber, logoUrl, req.user.store_id]);
    res.json({ success: true });
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
  if (req.user.role !== 'admin') return res.sendStatus(403);
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
  if (req.user.role !== 'admin') return res.sendStatus(403);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CoreBiz Backend running on port ${PORT}`);
});
