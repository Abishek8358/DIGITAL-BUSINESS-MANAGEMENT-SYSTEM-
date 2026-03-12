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
- **Dynamic Setup**: Configure categories specific to your business (Grocery, Electronics, etc.)
- **Role-Based Access**: Separate dashboards for Admins and Employees.
- **Inventory Management**: Real-time stock tracking with low-stock alerts.
- **POS / Billing**: Fast checkout with automated invoice generation and PDF download.
- **Analytics**: Revenue trends and category distribution charts.
- **Dark Mode**: Full system-wide theme support.

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

## Database Seeding
The application automatically seeds initial products, categories, and customers on the first run if the database is empty.

## Role Permissions
- **Admin**: Full access to Dashboard, Products, Categories, Customers, Employees, Reports, and Settings.
- **Employee**: Access limited to Billing/POS and Invoice viewing.
