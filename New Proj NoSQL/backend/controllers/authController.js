import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { runQuery } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_job_recruitment_system_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const trimmedUsername = String(username).trim();

    const cypher = `
      MATCH (u:AppUser)
      WHERE toLower(u.username) = toLower($trimmedUsername)
      RETURN u.user_id AS userId,
             u.username AS username,
             u.password_hash AS passwordHash,
             u.full_name AS fullName,
             u.email AS email,
             u.role AS role,
             u.is_active AS isActive
      LIMIT 1
    `;

    const result = await runQuery(cypher, { trimmedUsername });

    if (!result || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = result.rows[0];

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your DBA.'
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Strict Bcrypt password verification against stored database hash (no fallbacks or hardcoded bypasses)
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Generate JWT token with claims
    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Audit log successful login
    try {
      await logAuditEvent({
        username: user.username,
        role: user.role,
        action: 'USER_LOGIN',
        details: `Successful login as ${user.role} (${user.fullName})`,
        ipAddress: req.ip || req.socket?.remoteAddress || '127.0.0.1'
      });
    } catch (auditErr) {
      console.warn('[Auth Warning] Audit log entry non-fatal error:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (
      error.name === 'Neo4jError' ||
      error.code === 'ServiceUnavailable' ||
      error.code === 'SessionExpired' ||
      error.message?.includes('connect') ||
      error.message?.includes('connection') ||
      error.message?.includes('closed') ||
      error.message?.includes('unavailable')
    ) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Authentication could not be completed.'
      });
    }
    next(error);
  }
}

export async function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await logAuditEvent({
        username: req.user.username,
        role: req.user.role,
        action: 'USER_LOGOUT',
        details: `User logged out`,
        ipAddress: req.ip || req.socket?.remoteAddress || '127.0.0.1'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
}
