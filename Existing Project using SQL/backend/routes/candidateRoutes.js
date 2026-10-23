import express from 'express';
import { getCandidates, getCandidateById, createCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// USER and DATABASE_DESIGNER and DBA can read
router.get('/', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getCandidates);
router.get('/:id', requireRole('USER', 'DATABASE_DESIGNER', 'DBA'), getCandidateById);

// USER and DBA can modify candidates
router.post('/', requireRole('USER', 'DBA'), createCandidate);
router.put('/:id', requireRole('USER', 'DBA'), updateCandidate);
router.delete('/:id', requireRole('USER', 'DBA'), deleteCandidate);

export default router;
