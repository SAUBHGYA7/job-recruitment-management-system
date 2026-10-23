import express from 'express';
import { getInterviews, createInterview, updateInterview, deleteInterview } from '../controllers/interviewController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getInterviews);
router.post('/', requireRole('USER', 'DBA'), createInterview);
router.put('/:id', requireRole('USER', 'DBA'), updateInterview);
router.delete('/:id', requireRole('USER', 'DBA'), deleteInterview);

export default router;
