import express from 'express';
import { login, quickLogin, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/quick-login', quickLogin);
router.get('/me', authenticateUser, getCurrentUser);
router.post('/logout', authenticateUser, logout);

export default router;
