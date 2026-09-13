import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getDbaDashboard,
  getDbaTables,
  getDbaTableData,
  executeSqlConsole,
  getDatabaseObjects,
  getUsers,
  createUser,
  updateUserRole,
  toggleUserStatus,
  getIndexes,
  getConstraintsHealth,
  getDatabaseStatistics,
  getActivityAuditLog,
  runMaintenance
} from '../controllers/dbaController.js';

const router = express.Router();

// Strict RBAC: All endpoints in this file require DBA role
router.use(authenticateUser);
router.use(requireRole('DBA'));

// Dashboard Overview
router.get('/dashboard', getDbaDashboard);

// DBA SQL Query Console (Read-Only)
router.post('/execute-sql', executeSqlConsole);

// DBA Tables Explorer & Data Inspector
router.get('/tables', getDbaTables);
router.get('/tables/:tableName/data', getDbaTableData);

// Database Objects
router.get('/objects', getDatabaseObjects);

// User Security Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);

// Indexes
router.get('/indexes', getIndexes);

// Integrity & Constraints
router.get('/constraints-health', getConstraintsHealth);

// Statistics
router.get('/statistics', getDatabaseStatistics);

// Audit Log
router.get('/audit-log', getActivityAuditLog);

// Maintenance
router.post('/maintenance', runMaintenance);

export default router;
