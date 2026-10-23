import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { runQuery } from '../db/neo4j.js';

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

    // Query active user from Neo4j
    const cypher = `
      MATCH (u:AppUser)
      WHERE u.user_id = $userId OR toLower(u.username) = toLower($username)
      RETURN u.user_id AS userId,
             u.username AS username,
             u.full_name AS fullName,
             u.email AS email,
             u.role AS role,
             u.is_active AS isActive
      LIMIT 1
    `;

    const result = await runQuery(cypher, {
      userId: decoded.userId || 0,
      username: decoded.username || ''
    });

    if (!result || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with token not found.'
      });
    }

    const row = result.rows[0];
    const user = {
      userId: row.userId,
      username: row.username,
      fullName: row.fullName,
      email: row.email,
      role: row.role,
      isActive: row.isActive === 1 || row.isActive === true
    };

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by the DBA. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'Neo4jError' || error.code === 'ServiceUnavailable' || error.message?.includes('connect') || error.message?.includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Request could not be authenticated.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal error during authentication.'
    });
  }
}
