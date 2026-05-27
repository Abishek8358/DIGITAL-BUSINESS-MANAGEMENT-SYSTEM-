import { Router } from 'express';
import { getStoreProfile, setupStore, updateStore } from '../controllers/storeController';
import { authenticateToken } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', authenticateToken, getStoreProfile);
router.get('/profile', authenticateToken, getStoreProfile);
router.post('/setup', authenticateToken, setupStore);
router.put('/update', authenticateToken, upload.single('logo'), updateStore);

export default router;
