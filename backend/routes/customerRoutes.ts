import { Router } from 'express';
import { 
  getCustomers, createCustomer, lookupCustomerByPhone, getCustomerHistory 
} from '../controllers/customerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCustomers);
router.post('/', authenticateToken, createCustomer);
router.get('/lookup/:phone', authenticateToken, lookupCustomerByPhone);
router.get('/:id/history', authenticateToken, getCustomerHistory);

export default router;
