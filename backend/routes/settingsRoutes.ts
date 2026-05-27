import { Router } from 'express';
import { 
  getSettings, 
  updateBillingSettings, 
  updateInventorySettings, 
  getEmployeeSalarySettings, 
  updateEmployeeSalarySettings,
  resetDatabase
} from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// General config endpoints
router.get('/:section', authenticateToken, getSettings);
router.put('/billing', authenticateToken, updateBillingSettings);
router.put('/inventory', authenticateToken, updateInventorySettings);

// Salary endpoints
router.get('/employee-salary', authenticateToken, getEmployeeSalarySettings);
router.put('/employee-salary', authenticateToken, updateEmployeeSalarySettings);

// Super admin full reset endpoint
router.post('/admin/reset-db', authenticateToken, resetDatabase);

export default router;
