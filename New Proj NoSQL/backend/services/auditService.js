import { runQuery, getNextSequence } from '../db/neo4j.js';

export async function logAuditEvent({ username, role, action, details, ipAddress = '127.0.0.1' }) {
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nextLogId = await getNextSequence('audit_log', 3);

    const cypher = `
      CREATE (al:AuditLog {
        log_id: $logId,
        username: $username,
        role: $role,
        action: $action,
        details: $details,
        ip_address: $ipAddress,
        created_at: $timestamp
      })
      RETURN al.log_id AS log_id
    `;

    await runQuery(cypher, {
      logId: nextLogId,
      username: username || 'ANONYMOUS',
      role: role || 'UNKNOWN',
      action: action || 'ACTION',
      details: details || '',
      ipAddress: ipAddress || '127.0.0.1',
      timestamp
    });
  } catch (err) {
    console.error('[Audit Log Error] Failed to persist audit event:', err.message);
  }
}

export async function getAuditLogs(limit = 50) {
  try {
    const cypher = `
      MATCH (al:AuditLog)
      RETURN al.log_id AS log_id,
             al.log_id AS LOG_ID,
             al.username AS username,
             al.username AS USERNAME,
             al.role AS role,
             al.role AS ROLE,
             al.action AS action,
             al.action AS ACTION,
             al.details AS details,
             al.details AS DETAILS,
             al.ip_address AS ip_address,
             al.ip_address AS IP_ADDRESS,
             al.created_at AS created_at,
             al.created_at AS CREATED_AT
      ORDER BY al.log_id DESC
      LIMIT $limit
    `;
    const result = await runQuery(cypher, { limit: parseInt(limit, 10) });
    return result.rows;
  } catch (err) {
    console.error('[Audit Log Error] Failed to retrieve audit logs:', err.message);
    return [];
  }
}
