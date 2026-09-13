import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { inMemoryDb } from '../db/inMemoryDb.js';
import { executeQuery } from '../db/oracle.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_job_recruitment_system_2026';

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.'
      });
    }

    // Find user in DB or in-memory
    let user = null;
    try {
      const sql = `SELECT user_id, username, full_name, email, role, is_active FROM APP_USERS WHERE user_id = :userId`;
      const result = await executeQuery(sql, { userId: decoded.userId });
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        user = {
          userId: row.USER_ID || row.user_id,
          username: row.USERNAME || row.username,
          fullName: row.FULL_NAME || row.full_name,
          email: row.EMAIL || row.email,
          role: row.ROLE || row.role,
          isActive: (row.IS_ACTIVE !== undefined ? row.IS_ACTIVE : row.is_active) === 1
        };
      }
    } catch {}

    if (!user) {
      const found = inMemoryDb.tables.APP_USERS.find(u => u.USER_ID === decoded.userId || u.USERNAME === decoded.username);
      if (found) {
        user = {
          userId: found.USER_ID,
          username: found.USERNAME,
          fullName: found.FULL_NAME,
          email: found.EMAIL,
          role: found.ROLE,
          isActive: found.IS_ACTIVE === 1
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with token not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by the DBA. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal error during authentication: ' + error.message
    });
  }
}
