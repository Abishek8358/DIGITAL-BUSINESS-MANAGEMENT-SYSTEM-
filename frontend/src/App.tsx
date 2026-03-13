import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SetupWizard from './pages/SetupWizard';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import BillingPage from './pages/BillingPage';

import CategoryManagement from './pages/CategoryManagement';
import CustomerManagement from './pages/CustomerManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import ReportsPage from './pages/ReportsPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  // 'admin' role now covers store owners
  const isAuthorized = !role || user.role === role;
  
  if (!isAuthorized) return <Navigate to={user.role === 'employee' ? '/billing' : '/admin/dashboard'} />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup" element={<ProtectedRoute role="admin"><SetupWizard /></ProtectedRoute>} />
      
      <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/billing" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<BillingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
