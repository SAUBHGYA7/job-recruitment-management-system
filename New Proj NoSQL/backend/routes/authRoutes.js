import express from 'express';
import { login, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateUser, getCurrentUser);
router.post('/logout', authenticateUser, logout);

export default router;
