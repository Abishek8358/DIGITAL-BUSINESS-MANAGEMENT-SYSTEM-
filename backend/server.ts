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
    req.user = user;
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

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const result = await pool.query('SELECT id, email, password, role, name, status FROM users WHERE email = $1 AND role = $2', [email, role]);
    const user = result.rows[0];
    
    if (user && user.status === 'active' && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } else {
      res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Store
app.get('/api/store', async (req, res) => {
  try {
    const result = await pool.query('SELECT storename as "storeName", ownername as "ownerName", phone, address, gstnumber as "gstNumber", issetupcomplete as "isSetupComplete" FROM store WHERE id = 1');
    res.json(result.rows[0] || { isSetupComplete: 0 });
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
      INSERT INTO store (id, storename, ownername, phone, address, gstnumber, issetupcomplete) 
      VALUES (1, $1, $2, $3, $4, $5, 1)
      ON CONFLICT (id) DO UPDATE SET 
        storename = EXCLUDED.storename,
        ownername = EXCLUDED.ownername,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        gstnumber = EXCLUDED.gstnumber,
        issetupcomplete = 1
    `, [storeName, ownerName, phone, address, gstNumber]);
    
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cat]);
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.id, p.name, p.categoryid as "categoryId", p.brand, p.costprice as "costPrice", p.sellingprice as "sellingPrice", 
             p.gstpercent as "gstPercent", p.stock, p.minimumstock as "minimumStock", p.reorderquantity as "reorderQuantity", 
             p.imageurl as "imageUrl", p.description, 
             c.name as "categoryName"
      FROM products p 
      LEFT JOIN categories c ON p.categoryid = c.id
    `);
    res.json(products.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO products (name, categoryid, brand, costprice, sellingprice, gstpercent, stock, minimumstock, reorderquantity, description, imageurl)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `, [name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl]);
    res.json({ id: result.rows[0].id });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  try {
    await pool.query(`
      UPDATE products SET name=$1, categoryid=$2, brand=$3, costprice=$4, sellingprice=$5, gstpercent=$6, stock=$7, minimumstock=$8, reorderquantity=$9, description=$10, imageurl=$11
      WHERE id=$12
    `, [name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl, req.params.id]);
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, mobile, totalpurchases as "totalPurchases", lastpurchasedate as "lastPurchaseDate" FROM customers');
    res.json(result.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, mobile } = req.body;
  try {
    const result = await pool.query('INSERT INTO customers (name, mobile) VALUES ($1, $2) RETURNING id', [name, mobile]);
    res.json({ id: result.rows[0].id });
  } catch (e: any) {
    try {
      const existing = await pool.query('SELECT id, name, mobile, totalpurchases as "totalPurchases", lastpurchasedate as "lastPurchaseDate" FROM customers WHERE mobile = $1', [mobile]);
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
      INSERT INTO sales (invoiceid, customerid, subtotal, gsttotal, grandtotal, date, createdby)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [invoiceId, customerId, subtotal, gstTotal, grandTotal, date, req.user.id]);

    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items (saleid, productid, quantity, unitprice, gstamount, total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [saleId, item.id, item.quantity, item.sellingPrice, (item.sellingPrice * item.gstPercent / 100) * item.quantity, item.total]);

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
    }

    if (customerId) {
      await client.query('UPDATE customers SET totalpurchases = totalpurchases + $1, lastpurchasedate = $2 WHERE id = $3', [grandTotal, date, customerId]);
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

app.get('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    const saleResult = await pool.query(`
      SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
             c.name as "customerName", c.mobile as "customerMobile"
      FROM sales s
      LEFT JOIN customers c ON s.customerid = c.id
      WHERE s.id = $1
    `, [req.params.id]);

    const sale = saleResult.rows[0];
    if (!sale) return res.sendStatus(404);

    const itemsResult = await pool.query(`
      SELECT si.id, si.saleid as "saleId", si.productid as "productId", si.quantity, si.unitprice as "unitPrice", si.gstamount as "gstAmount", si.total, 
             p.name as "productName"
      FROM sale_items si
      JOIN products p ON si.productid = p.id
      WHERE si.saleid = $1
    `, [req.params.id]);

    res.json({ ...sale, items: itemsResult.rows });
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [productsRes, salesRes, customersRes, revenueRes, lowStockRes, recentSalesRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM products'),
      pool.query('SELECT COUNT(*) as count FROM sales'),
      pool.query('SELECT COUNT(*) as count FROM customers'),
      pool.query("SELECT SUM(grandtotal) as total FROM sales WHERE date >= date_trunc('month', CURRENT_DATE)"),
      pool.query('SELECT id, name, categoryid as "categoryId", brand, costprice as "costPrice", sellingprice as "sellingPrice", gstpercent as "gstPercent", stock, minimumstock as "minimumStock", reorderquantity as "reorderQuantity", imageurl as "imageUrl", description FROM products WHERE stock < 5'),
      pool.query(`
        SELECT s.id, s.invoiceid as "invoiceId", s.customerid as "customerId", s.subtotal, s.gsttotal as "gstTotal", s.grandtotal as "grandTotal", s.date, s.createdby as "createdBy", 
               c.name as "customerName" 
        FROM sales s 
        LEFT JOIN customers c ON s.customerid = c.id 
        ORDER BY s.date DESC LIMIT 5
      `)
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
app.get('/api/reports/sales-trend', authenticateToken, async (req, res) => {
  try {
    const trend = await pool.query(`
      SELECT to_char(date, 'YYYY-MM-DD') as day, SUM(grandtotal) as revenue
      FROM sales
      GROUP BY to_char(date, 'YYYY-MM-DD')
      ORDER BY day ASC
      LIMIT 30
    `);
    res.json(trend.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employees
app.get('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    const employees = await pool.query("SELECT id, email, role, name, status, created_at FROM users WHERE role = 'employee'");
    res.json(employees.rows);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { email, password, name } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    await pool.query('INSERT INTO users (email, password, role, name, status) VALUES ($1, $2, $3, $4, $5)', [email, hash, 'employee', name, 'active']);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CoreBiz Backend running on port ${PORT}`);
});
