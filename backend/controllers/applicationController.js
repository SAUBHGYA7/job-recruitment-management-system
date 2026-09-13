import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getApplications(req, res, next) {
  try {
    const sql = `
      SELECT a.app_id, a.app_status, a.final_result,
             TO_CHAR(ai.app_date, 'YYYY-MM-DD') AS app_date,
             ad.offer_letter,
             c.cand_id, c.fname || ' ' || c.lname AS candidate_name,
             jd.job_title, j.job_id
      FROM Application a
      LEFT JOIN Application_Info ai ON ai.app_id = a.app_id
      LEFT JOIN Application_Date ad ON ad.app_date = ai.app_date AND ad.final_result = a.final_result
      LEFT JOIN Candidate c ON c.app_id = a.app_id
      LEFT JOIN Job_Details jd ON jd.app_id = a.app_id
      LEFT JOIN Job j ON j.job_key = jd.job_key
      ORDER BY a.app_id ASC
    `;

    const result = await executeQuery(sql);

    const applications = result.rows.map(r => ({
      app_id: r.APP_ID ?? r.app_id,
      app_status: r.APP_STATUS ?? r.app_status,
      final_result: r.FINAL_RESULT ?? r.final_result,
      app_date: r.APP_DATE ?? r.app_date,
      offer_letter: r.OFFER_LETTER ?? r.offer_letter,
      candidate: r.CAND_ID ? { cand_id: r.CAND_ID, name: r.CANDIDATE_NAME } : null,
      job: r.JOB_ID ? { job_id: r.JOB_ID, job_title: r.JOB_TITLE } : null
    }));

    res.json({ success: true, total: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { app_status, final_result } = req.body;

    await executeQuery(`
      UPDATE Application
      SET app_status = :app_status, final_result = :final_result
      WHERE app_id = :id
    `, { app_status, final_result, id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_APPLICATION_STATUS',
      details: `Updated Application #${id} status to ${app_status} (${final_result}) in Oracle`
    });

    res.json({ success: true, message: `Application #${id} status updated successfully.` });
  } catch (error) {
    next(error);
  }
}
