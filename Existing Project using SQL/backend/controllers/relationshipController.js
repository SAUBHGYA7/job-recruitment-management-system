import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

// ─── APPLIES (Relation #27: APPLIES) ──────────────────────────────────────────────────
export async function getApplies(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT a.cand_id, a.job_key,
             c.fname, c.lname,
             jd.job_title, j.job_id, j.salary
      FROM Applies a
      LEFT JOIN Candidate c ON c.cand_id = a.cand_id
      LEFT JOIN Job j ON j.job_key = a.job_key
      LEFT JOIN Job_Details jd ON jd.job_key = a.job_key
      ORDER BY a.cand_id ASC, a.job_key ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      job_key: r.JOB_KEY ?? r.job_key,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      job_title: r.JOB_TITLE ?? r.job_title ?? `Job #${r.JOB_KEY ?? r.job_key}`,
      salary: r.SALARY ?? r.salary ?? 65000
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.job_title || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createApplies(req, res, next) {
  try {
    const { cand_id, job_key } = req.body;
    if (!cand_id || !job_key) {
      return res.status(400).json({ success: false, message: 'Candidate and Job are required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      INSERT INTO Applies (cand_id, job_key)
      VALUES (:cleanCandId, :cleanJobKey)
    `, { cleanCandId, cleanJobKey });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_APPLIES_RELATION',
      details: `Candidate #${cleanCandId} applied to Job #${cleanJobKey}`
    });

    res.json({ success: true, message: 'Application relationship recorded successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteApplies(req, res, next) {
  try {
    const { cand_id, job_key } = req.params;
    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      DELETE FROM Applies
      WHERE cand_id = :cleanCandId AND job_key = :cleanJobKey
    `, { cleanCandId, cleanJobKey });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_APPLIES_RELATION',
      details: `Removed Application relation Candidate #${cleanCandId} - Job #${cleanJobKey}`
    });

    res.json({ success: true, message: 'Application relationship deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── FOLLOWS (Relation #28: FOLLOWS) ──────────────────────────────────────────────────
export async function getFollows(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT f.cand_id, f.emp_id, f.follow_date,
             c.fname, c.lname,
             e.company_name
      FROM Follows f
      LEFT JOIN Candidate c ON c.cand_id = f.cand_id
      LEFT JOIN Employer e ON e.emp_id = f.emp_id
      ORDER BY f.cand_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      emp_id: r.EMP_ID ?? r.emp_id,
      follow_date: (r.FOLLOW_DATE ?? r.follow_date ?? '2026-08-01').toString().split('T')[0],
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      company_name: r.COMPANY_NAME ?? r.company_name ?? (r.EMP_ID ?? r.emp_id)
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.company_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createFollows(req, res, next) {
  try {
    const { cand_id, emp_id, follow_date } = req.body;
    if (!cand_id || !emp_id) {
      return res.status(400).json({ success: false, message: 'Candidate and Employer are required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanDate = follow_date || '2026-08-20';

    await executeQuery(`
      INSERT INTO Follows (cand_id, emp_id, follow_date)
      VALUES (:cleanCandId, :emp_id, :cleanDate)
    `, { cleanCandId, emp_id, cleanDate });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_FOLLOWS_RELATION',
      details: `Candidate #${cleanCandId} started following Employer #${emp_id}`
    });

    res.json({ success: true, message: 'Follows relationship added successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteFollows(req, res, next) {
  try {
    const { cand_id, emp_id } = req.params;
    const cleanCandId = parseInt(cand_id, 10);

    await executeQuery(`
      DELETE FROM Follows
      WHERE cand_id = :cleanCandId AND emp_id = :emp_id
    `, { cleanCandId, emp_id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_FOLLOWS_RELATION',
      details: `Candidate #${cleanCandId} unfollowed Employer #${emp_id}`
    });

    res.json({ success: true, message: 'Follow relationship deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── REFERRALS (Relation #29: REFERS) ─────────────────────────────────────────────────
export async function getReferrals(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT r.cand_id, r.referral_date, r.referral_status,
             c.fname, c.lname
      FROM Refers r
      LEFT JOIN Candidate c ON c.cand_id = r.cand_id
      ORDER BY r.cand_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      referral_date: (r.REFERRAL_DATE ?? r.referral_date ?? '2025-08-01').toString().split('T')[0],
      referral_status: r.REFERRAL_STATUS ?? r.referral_status ?? 'Accepted',
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.referral_status || '').toLowerCase().includes(q) ||
        (r.referral_date || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createReferral(req, res, next) {
  try {
    const { cand_id, referral_date, referral_status } = req.body;
    if (!cand_id) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanDate = referral_date || '2026-08-20';
    const cleanStatus = referral_status || 'Pending';

    await executeQuery(`
      INSERT INTO Refers (cand_id, referral_date, referral_status)
      VALUES (:cleanCandId, TO_DATE(:cleanDate, 'YYYY-MM-DD'), :cleanStatus)
    `, { cleanCandId, cleanDate, cleanStatus });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_REFERRAL',
      details: `Referral recorded for Candidate #${cleanCandId} (${cleanStatus})`
    });

    res.json({ success: true, message: 'Referral created successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateReferral(req, res, next) {
  try {
    const { cand_id, date } = req.params;
    const { referral_status } = req.body;
    const cleanCandId = parseInt(cand_id, 10);

    await executeQuery(`
      UPDATE Refers
      SET referral_status = :referral_status
      WHERE cand_id = :cleanCandId AND referral_date = TO_DATE(:date, 'YYYY-MM-DD')
    `, {
      referral_status: referral_status || 'Accepted',
      cleanCandId,
      date
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_REFERRAL',
      details: `Updated Referral for Candidate #${cleanCandId} to ${referral_status}`
    });

    res.json({ success: true, message: 'Referral updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteReferral(req, res, next) {
  try {
    const { cand_id, date } = req.params;
    const cleanCandId = parseInt(cand_id, 10);

    await executeQuery(`
      DELETE FROM Refers
      WHERE cand_id = :cleanCandId AND referral_date = TO_DATE(:date, 'YYYY-MM-DD')
    `, { cleanCandId, date });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_REFERRAL',
      details: `Deleted Referral for Candidate #${cleanCandId}`
    });

    res.json({ success: true, message: 'Referral deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
