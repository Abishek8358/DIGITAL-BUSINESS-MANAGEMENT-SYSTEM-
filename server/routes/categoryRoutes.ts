import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, createCategory);
router.delete('/:id', authenticateToken, deleteCategory);

export default router;
