import express from 'express';
import { getSkills, createSkill } from '../controllers/skillController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getSkills);
router.post('/', requireRole('USER', 'DBA'), createSkill);

export default router;
