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
    // Return unique customers per store based on phone
    const result = await pool.query(`
      SELECT DISTINCT ON (phone) id, name, phone as "mobile", total_spent as "totalPurchases", last_visit as "lastPurchaseDate" 
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

// Sales & Billing
app.post('/api/sales', authenticateToken, async (req: any, res) => {
  const { customerId: providedId, customerName, customerPhone, items, subtotal, gstTotal, grandTotal } = req.body;
  const invoiceId = 'INV-' + Date.now();
  const date = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalCustomerId = providedId;

    // Task 1: Customer Upsert Logic
    if (customerPhone) {
      const existingCust = await client.query('SELECT id FROM customers WHERE phone = $1 AND store_id = $2', [customerPhone, req.user.store_id]);
      if (existingCust.rows.length > 0) {
        finalCustomerId = existingCust.rows[0].id;
        await client.query(
          'UPDATE customers SET total_spent = total_spent + $1, last_visit = CURRENT_TIMESTAMP, name = $2 WHERE id = $3 AND store_id = $4', 
          [grandTotal, customerName, finalCustomerId, req.user.store_id]
        );
      } else {
        const newCust = await client.query(
          'INSERT INTO customers (name, phone, total_spent, last_visit, store_id) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING id',
          [customerName || 'Walking Customer', customerPhone, grandTotal, req.user.store_id]
        );
        finalCustomerId = newCust.rows[0].id;
      }
    }

    const saleResult = await client.query(`
      INSERT INTO sales (invoiceid, customerid, subtotal, gsttotal, grandtotal, date, createdby, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [invoiceId, finalCustomerId, subtotal, gstTotal, grandTotal, date, req.user.id, req.user.store_id]);

    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items (saleid, productid, quantity, unitprice, gstamount, total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [saleId, item.id, item.quantity, item.sellingPrice, (item.sellingPrice * item.gstPercent / 100) * item.quantity, item.total]);

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND store_id = $3', [item.quantity, item.id, req.user.store_id]);
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
        SELECT p.id, p.name, p.categoryid as "categoryId", p.brand, p.costprice as "costPrice", p.sellingprice as "sellingPrice", p.gstpercent as "gstPercent", p.stock, p.minimumstock as "minimumStock", p.reorderquantity as "reorderQuantity", p.imageurl as "imageUrl", p.description 
        FROM products p
        JOIN store_settings s ON p.store_id = s.store_id
        WHERE p.stock < s.low_stock_threshold AND p.store_id = $1
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
        SELECT COALESCE(SUM(si.quantity * (si.unitprice - p.costprice)), 0) AS "totalProfit"
        FROM sale_items si
        JOIN products p ON si.productid = p.id
        WHERE p.store_id = $1
      `, [req.user.store_id])
    ]);

    res.json({
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      totalSales: parseInt(salesRes.rows[0].count, 10),
      totalCustomers: parseInt(customersRes.rows[0].count, 10),
      monthlyRevenue: parseFloat(revenueRes.rows[0].total) || 0,
      lowStock: lowStockRes.rows,
      recentSales: recentSalesRes.rows,
      revenueHistory: revenueRes.rows,
      totalProfit: parseFloat(profitRes.rows[0].totalProfit) || 0
    });
  } catch(err: any) {
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
    const employees = await pool.query("SELECT id, email, role, name, status, salary, join_date as \"joinDate\", created_at FROM users WHERE role = 'employee' AND store_id = $1", [req.user.store_id]);
    res.json(employees.rows);
  } catch(err: any) {
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

app.get('/api/settings/employee-salary', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT default_sales_salary as "defaultSalesSalary", default_manager_salary as "defaultManagerSalary", default_helper_salary as "defaultHelperSalary" FROM store_settings WHERE store_id = $1', [req.user.store_id]);
    res.json(result.rows[0] || { defaultSalesSalary: 0, defaultManagerSalary: 0, defaultHelperSalary: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/employee-salary', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CoreBiz Backend running on port ${PORT}`);
});
