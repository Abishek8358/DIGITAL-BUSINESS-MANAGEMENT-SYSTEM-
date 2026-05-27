import { Router } from 'express';
import { 
  getFlatVariants,
  createVariant,
  updateVariant,
  deleteVariant
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Match endpoints used by the frontend
router.get('/flat', authenticateToken, getFlatVariants);
router.post('/', authenticateToken, createVariant);
router.put('/:id', authenticateToken, updateVariant);
router.delete('/:id', authenticateToken, deleteVariant);

export default router;
