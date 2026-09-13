import { inMemoryDb } from '../db/inMemoryDb.js';
import { executeQuery } from '../db/oracle.js';

export async function logAuditEvent({ username, role, action, details, ipAddress = '127.0.0.1' }) {
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    // Try Oracle insert if live
    try {
      const sql = `
        INSERT INTO APP_AUDIT_LOG (username, role, action, details, ip_address, created_at)
        VALUES (:username, :role, :action, :details, :ipAddress, SYSDATE)
      `;
      await executeQuery(sql, { username, role, action, details, ipAddress });
    } catch {
      // Fallback in-memory
      const newLog = {
        LOG_ID: inMemoryDb.tables.APP_AUDIT_LOG.length + 1,
        USERNAME: username || 'ANONYMOUS',
        ROLE: role || 'UNKNOWN',
        ACTION: action,
        DETAILS: details,
        IP_ADDRESS: ipAddress,
        CREATED_AT: timestamp
      };
      inMemoryDb.tables.APP_AUDIT_LOG.unshift(newLog);
    }
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
}

export async function getAuditLogs(limit = 50) {
  try {
    const sql = `SELECT * FROM APP_AUDIT_LOG ORDER BY log_id DESC FETCH FIRST :limit ROWS ONLY`;
    const result = await executeQuery(sql, { limit });
    if (result.rows && result.rows.length > 0) return result.rows;
  } catch {}

  return inMemoryDb.tables.APP_AUDIT_LOG.slice(0, limit);
}
