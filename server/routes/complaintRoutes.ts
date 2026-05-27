import { Router } from 'express';
import { 
  createComplaint, getComplaints, getPendingComplaintsCount, resolveComplaint 
} from '../controllers/complaintController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createComplaint);
router.get('/', authenticateToken, getComplaints);
router.get('/count', authenticateToken, getPendingComplaintsCount);
router.put('/:id/resolve', authenticateToken, resolveComplaint);
router.patch('/:id/resolve', authenticateToken, resolveComplaint);

export default router;
