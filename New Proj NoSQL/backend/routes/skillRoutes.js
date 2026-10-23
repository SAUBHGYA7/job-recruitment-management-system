import express from 'express';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getSkills);
router.post('/', requireRole('USER', 'DBA'), createSkill);
router.put('/:id', requireRole('USER', 'DBA'), updateSkill);
router.delete('/:id', requireRole('USER', 'DBA'), deleteSkill);

export default router;
