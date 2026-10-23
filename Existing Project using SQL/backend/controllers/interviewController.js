import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getInterviews(req, res, next) {
  try {
    const { search, mode } = req.query;

    let sql = `
      SELECT i.int_id, 
             TO_CHAR(i.int_date, 'YYYY-MM-DD') AS int_date, 
             i.int_time,
             id.int_mode, id.location, id.int_status, id.score, id.feedback,
             c.cand_id, c.fname || ' ' || c.lname AS candidate_name
      FROM Interview i
      LEFT JOIN Interview_Details id ON id.int_id = i.int_id
      LEFT JOIN Candidate c ON c.int_id = i.int_id
      WHERE 1=1
    `;

    const binds = {};
    if (mode && mode !== 'ALL') {
      sql += ` AND LOWER(id.int_mode) = LOWER(:mode)`;
      binds.mode = mode;
    }
    if (search) {
      sql += ` AND (
        LOWER(i.int_id) LIKE '%' || LOWER(:search) || '%' OR
        LOWER(c.fname || ' ' || c.lname) LIKE '%' || LOWER(:search) || '%' OR
        LOWER(id.location) LIKE '%' || LOWER(:search) || '%' OR
        LOWER(id.feedback) LIKE '%' || LOWER(:search) || '%'
      )`;
      binds.search = search;
    }

    sql += ` ORDER BY i.int_id ASC`;

    const result = await executeQuery(sql, binds);

    const interviews = result.rows.map(r => ({
      int_id: r.INT_ID ?? r.int_id,
      int_date: r.INT_DATE ?? r.int_date,
      int_time: r.INT_TIME ?? r.int_time,
      int_mode: r.INT_MODE ?? r.int_mode,
      location: r.LOCATION ?? r.location,
      int_status: r.INT_STATUS ?? r.int_status,
      score: r.SCORE ?? r.score,
      feedback: r.FEEDBACK ?? r.feedback,
      candidate: r.CAND_ID ? { cand_id: r.CAND_ID, name: r.CANDIDATE_NAME } : null
    }));

    res.json({ success: true, total: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
}

export async function createInterview(req, res, next) {
  try {
    const { int_date, int_time, int_mode, location, int_status, score, feedback, cand_id } = req.body;

    const maxIdResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(int_id, 4))), 0) + 1 AS next_num FROM Interview');
    const nextNum = maxIdResult.rows[0]?.NEXT_NUM ?? maxIdResult.rows[0]?.next_num ?? 6;
    const nextId = `INT${String(nextNum).padStart(3, '0')}`;

    await executeQuery(`
      INSERT INTO Interview (int_id, int_date, int_time)
      VALUES (:nextId, TO_DATE(:int_date, 'YYYY-MM-DD'), :int_time)
    `, { nextId, int_date: int_date || '2026-09-15', int_time: int_time || '10:00' });

    await executeQuery(`
      INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback)
      VALUES (:nextId, :int_mode, :location, :int_status, :score, :feedback)
    `, {
      nextId,
      int_mode: int_mode || 'Online',
      location: location || 'Virtual',
      int_status: int_status || 'Scheduled',
      score: score !== undefined && score !== '' && score !== null ? parseFloat(score) : null,
      feedback: feedback || 'Technical interview scheduled'
    });

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET int_id = :nextId WHERE cand_id = :candId`, {
        nextId,
        candId: parseInt(cand_id, 10)
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'SCHEDULE_INTERVIEW',
      details: `Scheduled Interview #${nextId} in Oracle Database`
    });

    res.status(201).json({ success: true, message: 'Interview scheduled in Oracle.', data: { int_id: nextId } });
  } catch (error) {
    next(error);
  }
}

export async function updateInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { int_date, int_time, int_mode, location, int_status, score, feedback, cand_id } = req.body;

    if (int_date || int_time) {
      await executeQuery(`
        UPDATE Interview
        SET int_date = TO_DATE(:int_date, 'YYYY-MM-DD'), int_time = :int_time
        WHERE int_id = :id
      `, { int_date: int_date || '2026-09-15', int_time: int_time || '10:00', id });
    }

    await executeQuery(`
      UPDATE Interview_Details
      SET int_mode = :int_mode, location = :location, int_status = :int_status, score = :score, feedback = :feedback
      WHERE int_id = :id
    `, {
      int_mode: int_mode || 'Online',
      location: location || 'Virtual',
      int_status: int_status || 'Scheduled',
      score: score !== undefined && score !== '' && score !== null ? parseFloat(score) : null,
      feedback: feedback ?? '',
      id
    });

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET int_id = :id WHERE cand_id = :candId`, {
        id,
        candId: parseInt(cand_id, 10)
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_INTERVIEW',
      details: `Updated Interview #${id} in Oracle Database`
    });

    res.json({ success: true, message: `Interview #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteInterview(req, res, next) {
  try {
    const { id } = req.params;

    await executeQuery(`UPDATE Candidate SET int_id = NULL WHERE int_id = :id`, { id });
    await executeQuery(`DELETE FROM Interview_Details WHERE int_id = :id`, { id });
    await executeQuery(`DELETE FROM Interview WHERE int_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_INTERVIEW',
      details: `Deleted Interview #${id} from Oracle Database`
    });

    res.json({ success: true, message: `Interview #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
