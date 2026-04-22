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

import EmployeeDashboard from './pages/EmployeeDashboard';
import InventoryAlerts from './pages/InventoryAlerts';
import RaiseComplaintPage from './pages/RaiseComplaintPage';
import ComplaintsPage from './pages/ComplaintsPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  // Decide if authorized
  // If no specific role required, everyone is authorized
  // If admin role is required, only admin or owner can pass
  const isAuthorized = !role || ['admin', 'owner'].includes(user.role);
  
  if (!isAuthorized) {
    // If not authorized (not an admin but trying to access admin pages), send to billing
    return <Navigate to="/billing" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'owner'].includes(user?.role || '');

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup" element={<ProtectedRoute role="admin"><SetupWizard /></ProtectedRoute>} />
      
      {/* Shared Dashboard Routes */}
      <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={isAdmin ? <AdminDashboard /> : <EmployeeDashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="inventory" element={<InventoryAlerts />} />
        <Route path="raise-complaint" element={<RaiseComplaintPage />} />
        
        {/* Admin-Only Routes */}
        <Route path="complaints" element={<ProtectedRoute role="admin"><ComplaintsPage /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute role="admin"><CategoryManagement /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute role="admin"><EmployeeManagement /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute role="admin"><ReportsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute role="admin"><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/billing" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<BillingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
