import { Router } from 'express';
import { getEmployees, createEmployee, updateEmployee } from '../controllers/employeeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getEmployees);
router.post('/', authenticateToken, createEmployee);
router.put('/:id', authenticateToken, updateEmployee);

export default router;
