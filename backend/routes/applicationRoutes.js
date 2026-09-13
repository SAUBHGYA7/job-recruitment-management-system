import express from 'express';
import { getApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getApplications);
router.put('/:id/status', requireRole('USER', 'DBA'), updateApplicationStatus);

export default router;
