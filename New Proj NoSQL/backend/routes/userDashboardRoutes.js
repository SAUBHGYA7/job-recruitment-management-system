import express from 'express';
import { getUserDashboard } from '../controllers/userDashboardController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

const allowedRoles = requireRole('USER', 'DATABASE_DESIGNER', 'DBA');

router.get('/', allowedRoles, getUserDashboard);
router.get('/dashboard', allowedRoles, getUserDashboard);
router.get('/user', allowedRoles, getUserDashboard);

export default router;
