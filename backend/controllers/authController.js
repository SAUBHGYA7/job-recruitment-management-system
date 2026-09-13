import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { inMemoryDb } from '../db/inMemoryDb.js';
import { executeQuery } from '../db/oracle.js';
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

    let user = null;

    // 1. Try Oracle DB
    try {
      const sql = `
        SELECT user_id, username, password_hash, full_name, email, role, is_active
        FROM APP_USERS
        WHERE LOWER(username) = LOWER(:username)
      `;
      const result = await executeQuery(sql, { username });
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        user = {
          userId: row.USER_ID || row.user_id,
          username: row.USERNAME || row.username,
          passwordHash: row.PASSWORD_HASH || row.password_hash,
          fullName: row.FULL_NAME || row.full_name,
          email: row.EMAIL || row.email,
          role: row.ROLE || row.role,
          isActive: (row.IS_ACTIVE !== undefined ? row.IS_ACTIVE : row.is_active) === 1
        };
      }
    } catch (dbErr) {
      // Will fallback to in-memory below
    }

    // 2. Fallback to in-memory DB if not found in Oracle
    if (!user) {
      const found = inMemoryDb.tables.APP_USERS.find(
        u => u.USERNAME.toLowerCase() === username.toLowerCase()
      );
      if (found) {
        user = {
          userId: found.USER_ID,
          username: found.USERNAME,
          passwordHash: found.PASSWORD_HASH,
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
        message: 'Invalid username or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your DBA.'
      });
    }

    // Check password (supports bcrypt hash or default standard passwords for demo)
    const validPasswords = {
      recruiter: 'User@123',
      designer: 'Designer@123',
      dba_admin: 'Dba@123'
    };

    let isMatch = false;
    if (validPasswords[user.username] && password === validPasswords[user.username]) {
      isMatch = true;
    } else if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Generate JWT token with role claim
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

    // Audit log
    await logAuditEvent({
      username: user.username,
      role: user.role,
      action: 'USER_LOGIN',
      details: `Successful login as ${user.role} (${user.fullName})`,
      ipAddress: req.ip || '127.0.0.1'
    });

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
    next(error);
  }
}

export async function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

export async function logout(req, res) {
  if (req.user) {
    await logAuditEvent({
      username: req.user.username,
      role: req.user.role,
      action: 'USER_LOGOUT',
      details: `User logged out`,
      ipAddress: req.ip || '127.0.0.1'
    });
  }
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}
