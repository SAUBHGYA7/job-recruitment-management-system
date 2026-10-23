import express from 'express';
import { getUserReports, getDesignerReports, getDbaReports } from '../controllers/reportsController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/user', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getUserReports);
router.get('/designer', requireRole('DATABASE_DESIGNER', 'DBA'), getDesignerReports);
router.get('/dba', requireRole('DBA'), getDbaReports);

export default router;
