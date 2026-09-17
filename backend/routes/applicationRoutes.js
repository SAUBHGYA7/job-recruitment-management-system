import express from 'express';
import { getApplications, createApplication, updateApplicationStatus, deleteApplication } from '../controllers/applicationController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getApplications);
router.post('/', requireRole('USER', 'DBA'), createApplication);
router.put('/:id/status', requireRole('USER', 'DBA'), updateApplicationStatus);
router.delete('/:id', requireRole('USER', 'DBA'), deleteApplication);

export default router;
