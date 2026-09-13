import express from 'express';
import { getEmployers, createEmployer } from '../controllers/employerController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getEmployers);
router.post('/', requireRole('USER', 'DBA'), createEmployer);

export default router;
