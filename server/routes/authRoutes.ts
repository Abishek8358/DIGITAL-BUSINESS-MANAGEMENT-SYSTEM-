import { Router } from 'express';
import { register, login, changePassword, getDemoInfo } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/demo-info', getDemoInfo);
router.post('/register', register);
router.post('/login', login);
router.put('/profile/password', authenticateToken, changePassword);

export default router;
