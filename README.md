# CoreBiz — Digital Business Management System

<div align="center">

  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />

  <br /><br />

  ### 🚀 [Live Demo → abishek8358.github.io/DIGITAL-BUSINESS-MANAGEMENT-SYSTEM-](https://abishek8358.github.io/DIGITAL-BUSINESS-MANAGEMENT-SYSTEM-/)

  <br />

  > A production-grade, full-stack shop management system for small businesses.  
  > Inventory tracking · Billing / POS · Sales Analytics · Employee Management · Dark Mode

</div>

---

## 🔐 Demo Login

> Click **"Use Demo Login"** on the login page to auto-fill credentials instantly.

| Role     | Email                     | Password      |
|----------|---------------------------|---------------|
| Admin    | `admin@corebiz.com`       | `admin123`    |
| Employee | `employee@corebiz.com`    | `employee123` |

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📦 **Inventory** | Category → Product → Brand → Variant hierarchy with separate pricing |
| 🧾 **Billing / POS** | Fast checkout, automated invoice generation, PDF download |
| 📊 **Analytics** | Revenue trends, category distribution, top product charts |
| 👥 **Customer Management** | Track purchase history, loyalty, contact info |
| 👷 **Employee Management** | Role-based access, salary tracking, status control |
| 🛠️ **Complaint System** | Internal employee-to-admin feedback with status tracking |
| ⚙️ **Settings** | GST config, invoice prefix, low-stock thresholds |
| 🌙 **Dark Mode** | Full system-wide dark/light mode support |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, TypeScript, JWT, bcryptjs |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Deployment** | GitHub Pages (frontend) · Render (backend) |

---

## 🗂️ Project Structure

```
corebiz/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── pages/     # LoginPage, Dashboard, Billing, etc.
│   │   ├── components/
│   │   ├── context/   # AuthContext
│   │   └── services/  # API axios client
│   └── .env.production
│
├── server/            # Express + MongoDB API server
│   ├── controllers/   # authController, productController, etc.
│   ├── models/        # Mongoose schemas (User, Product, Sale, ...)
│   ├── routes/        # API route definitions
│   ├── middleware/    # JWT auth middleware
│   ├── config/        # MongoDB connection (db.ts)
│   └── server.ts      # Entry point
│
└── vercel.json        # Vercel deployment config
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone & setup the backend

```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/corebiz
JWT_SECRET=your_secret_key_here
ENABLE_DEMO_LOGIN=true
```

Start the backend:
```bash
npm run dev
```

### 2. Setup the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **[http://localhost:5173/DIGITAL-BUSINESS-MANAGEMENT-SYSTEM-/](http://localhost:5173/DIGITAL-BUSINESS-MANAGEMENT-SYSTEM-/)**

---

## 🌱 Database Seeding

On first startup, if the database is empty, the server **automatically seeds**:
- Default store: `CoreBiz Demo Store`
- Admin account: `admin@corebiz.com` / `admin123`
- Employee account: `employee@corebiz.com` / `employee123`

To fully reset and reseed the database:
```bash
cd server
npm run reset:db
```

---

## 🔑 Role Permissions

| Feature | Admin | Employee |
|---------|:-----:|:--------:|
| Dashboard & Analytics | ✅ | ❌ |
| Products (Add/Edit/Delete) | ✅ | 👁️ View only |
| Stock Management | ✅ | ❌ |
| Categories | ✅ | ❌ |
| Billing / POS | ✅ | ✅ |
| Customer Management | ✅ | ✅ |
| Employee Management | ✅ | ❌ |
| Complaints (Resolve) | ✅ | 📝 Raise only |
| Settings | ✅ | ❌ |
| Reports | ✅ | ❌ |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_URI` | MongoDB Atlas connection string | **Yes** |
| `JWT_SECRET` | Secret key for JWT signing | **Yes** |
| `ENABLE_DEMO_LOGIN` | Show demo credentials on login page (`true`/`false`) | No |

### Frontend (`frontend/.env.production`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `https://corebiz-backend.onrender.com`) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server + DB health check |
| `GET` | `/api/auth/demo-info` | Demo credentials (if enabled) |
| `POST` | `/api/auth/login` | Login and get JWT |
| `POST` | `/api/auth/register` | Register new store + admin |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/categories` | List all categories |
| `GET` | `/api/sales` | List all sales |
| `GET` | `/api/analytics/stats` | Revenue & analytics data |

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/Abishek8358">Abishek</a>
</div>
