import express from 'express';
import {
  getDesignerDashboard,
  getTables,
  getTableDetails,
  getColumns,
  getPrimaryKeys,
  getForeignKeys,
  getConstraints,
  getRelationships,
  getNormalizationOverview
} from '../controllers/designerController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);
// Accessible by DATABASE_DESIGNER and DBA
router.use(requireRole('DATABASE_DESIGNER', 'DBA'));

router.get('/dashboard', getDesignerDashboard);
router.get('/tables', getTables);
router.get('/tables/:tableName', getTableDetails);
router.get('/columns', getColumns);
router.get('/primary-keys', getPrimaryKeys);
router.get('/foreign-keys', getForeignKeys);
router.get('/constraints', getConstraints);
router.get('/relationships', getRelationships);
router.get('/normalization', getNormalizationOverview);

export default router;
