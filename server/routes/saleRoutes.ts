import { Router } from 'express';
import { createSale, getSaleDetails } from '../controllers/saleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createSale);
router.get('/:id', authenticateToken, getSaleDetails);

export default router;
