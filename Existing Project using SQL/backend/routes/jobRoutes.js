import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getJobs);
router.get('/:id', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getJobById);
router.post('/', requireRole('USER', 'DBA'), createJob);
router.put('/:id', requireRole('USER', 'DBA'), updateJob);
router.delete('/:id', requireRole('USER', 'DBA'), deleteJob);

export default router;
