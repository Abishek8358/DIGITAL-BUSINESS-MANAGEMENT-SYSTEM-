-- CoreBiz Database Schema (Multi-Tenant)

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  gst_number VARCHAR(50),
  logo_url TEXT,
  is_setup_complete INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  store_id INT,
  status VARCHAR(50) DEFAULT 'active',
  salary DECIMAL(12,2) DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  store_id INT NOT NULL,
  UNIQUE(name, store_id),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  categoryId INT,
  brand VARCHAR(255),
  costPrice DECIMAL(12,2) DEFAULT 0,
  sellingPrice DECIMAL(12,2) DEFAULT 0,
  gstPercent DECIMAL(5,2) DEFAULT 0,
  stock INT DEFAULT 0,
  minimumStock INT DEFAULT 5,
  reorderQuantity INT DEFAULT 10,
  imageUrl TEXT,
  description TEXT,
  store_id INT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  store_id INT NOT NULL,
  loyalty_points INT DEFAULT 0,
  UNIQUE(phone, store_id),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  invoiceId VARCHAR(100) NOT NULL,
  customerId INT,
  subtotal DECIMAL(12,2) NOT NULL,
  gstTotal DECIMAL(12,2) NOT NULL,
  grandTotal DECIMAL(12,2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy INT,
  store_id INT NOT NULL,
  points_earned INT DEFAULT 0,
  points_redeemed INT DEFAULT 0,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  saleId INT NOT NULL,
  productId INT,
  variant_id INT,
  quantity INT NOT NULL,
  unitPrice DECIMAL(12,2) NOT NULL,
  gstAmount DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  store_id INT NOT NULL UNIQUE,
  currency VARCHAR(10) DEFAULT 'INR',
  default_gst DECIMAL(5,2) DEFAULT 18,
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  invoice_footer TEXT,
  low_stock_threshold INT DEFAULT 5,
  critical_stock_threshold INT DEFAULT 2,
  enable_stock_notifications BOOLEAN DEFAULT TRUE,
  default_sales_salary DECIMAL(12,2) DEFAULT 0,
  default_manager_salary DECIMAL(12,2) DEFAULT 0,
  default_helper_salary DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  store_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  UNIQUE(product_id, name),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE variants (
  id SERIAL PRIMARY KEY,
  brand_id INT NOT NULL,
  store_id INT NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  selling_price DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  gst_percent DECIMAL(5,2) DEFAULT 0,
  stock INT DEFAULT 0,
  minimum_stock INT DEFAULT 5,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  store_id INT NOT NULL,
  employee_id INT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);
