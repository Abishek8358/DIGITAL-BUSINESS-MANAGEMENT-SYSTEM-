# CoreBiz - Smart Shop Management System

CoreBiz is a production-grade, multi-purpose shop management system designed for small businesses. It features inventory tracking, billing/POS, customer management, and sales analytics.

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS V4, Recharts, Lucide React
- **Backend**: Node.js, Express.js, JWT, bcryptjs, pg (PostgreSQL)
- **Database**: Supabase PostgreSQL

## Project Structure
The project is built on a clean three-tier architecture:
- `/frontend`: React application (Vite)
- `/backend`: Node.js Express API server
- `/database`: Database schema files

## Features
- **Hierarchy-Based Stock Control**: Category → Product → Brand → Variant level tracking with separate pricing.
- **SMS Billing**: Integrated Fast2SMS for automated customer purchase receipts.
- **Complaint System**: Internal employee-to-admin feedback system with status tracking.
- **POS / Billing**: Fast checkout with automated invoice generation, PDF download, and SMS confirmation.
- **Analytics**: Revenue trends, category distribution, and top product charts.
- **Dark Mode**: Full system-wide glassmorphism aesthetic support.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Postgres/Supabase instance

### Installation
1. Start the backend server:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in `/backend` using this template:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@host.supabase.co:5432/postgres
   JWT_SECRET=your_secret_key
   ```
   Start the backend: `npm run dev`

2. Start the frontend application:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Default Credentials
- **Admin**: `admin@corebiz.com` / `admin123`

## Database Reset & Seeding
You can reset the entire database (transactional data) and re-initialize with default demo users using:
```bash
cd backend
npm run reset:db
```

## Role Permissions
- **Admin**: Full access to Dashboard, Products (Add/Edit/Delete/Stock), Categories, Customers, Employees, Complaints (Resolve), Reports, and Settings.
- **Employee**: Access limited to Billing/POS, View Products, and Raise Complaint (Support). Restricted from modifying stock or seeing cost prices.
