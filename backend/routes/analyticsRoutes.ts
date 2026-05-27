import { Router } from 'express';
import { 
  getDashboardStats, 
  getEmployeeDashboardStats, 
  getLowStockAlerts, 
  addStockToVariant, 
  getReportsSummary, 
  getReportsYearlyRevenue, 
  getCategoryDistribution, 
  getTopProducts, 
  getDetailedAnalytics 
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Stats
router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/employee/dashboard', authenticateToken, getEmployeeDashboardStats);
router.get('/inventory/low-stock', authenticateToken, getLowStockAlerts);
router.put('/variants/add-stock/:id', authenticateToken, addStockToVariant);

// Detailed Analytics Dashboard (with query filters)
router.get('/analytics/dashboard', authenticateToken, getDetailedAnalytics);

// Reports Summary & Trends
router.get('/reports/summary', authenticateToken, getReportsSummary);
router.get('/reports/yearly-revenue', authenticateToken, getReportsYearlyRevenue);
router.get('/reports/category-distribution', authenticateToken, getCategoryDistribution);
router.get('/reports/top-products', authenticateToken, getTopProducts);

export default router;
