CREATE TABLE store (
  id SERIAL PRIMARY KEY CHECK (id = 1),
  storeName VARCHAR(255) NOT NULL,
  ownerName VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  gstNumber VARCHAR(50),
  isSetupComplete INT DEFAULT 0
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK(role IN ('admin', 'employee')) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  categoryId INT,
  brand VARCHAR(255),
  costPrice DECIMAL(10,2) NOT NULL,
  sellingPrice DECIMAL(10,2) NOT NULL,
  gstPercent DECIMAL(5,2) DEFAULT 0,
  stock INT DEFAULT 0,
  minimumStock INT DEFAULT 5,
  reorderQuantity INT DEFAULT 10,
  imageUrl TEXT,
  description TEXT,
  FOREIGN KEY(categoryId) REFERENCES categories(id)
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) UNIQUE NOT NULL,
  totalPurchases DECIMAL(12,2) DEFAULT 0,
  lastPurchaseDate TIMESTAMP
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  invoiceId VARCHAR(100) UNIQUE NOT NULL,
  customerId INT,
  subtotal DECIMAL(12,2) NOT NULL,
  gstTotal DECIMAL(12,2) NOT NULL,
  grandTotal DECIMAL(12,2) NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdBy INT,
  FOREIGN KEY(customerId) REFERENCES customers(id),
  FOREIGN KEY(createdBy) REFERENCES users(id)
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  saleId INT,
  productId INT,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  gstAmount DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY(saleId) REFERENCES sales(id),
  FOREIGN KEY(productId) REFERENCES products(id)
);
