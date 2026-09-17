import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getApplications(req, res, next) {
  try {
    const sql = `
      SELECT a.app_id, a.app_status, a.final_result,
             TO_CHAR(ai.app_date, 'YYYY-MM-DD') AS app_date,
             ad.offer_letter,
             c.cand_id, c.fname || ' ' || c.lname AS candidate_name,
             jd.job_title, j.job_id, j.job_key
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
      app_date: r.APP_DATE ?? r.app_date ?? '2026-09-01',
      offer_letter: r.OFFER_LETTER ?? r.offer_letter,
      candidate: r.CAND_ID ? { id: r.CAND_ID, cand_id: r.CAND_ID, name: r.CANDIDATE_NAME } : null,
      job: r.JOB_ID || r.JOB_TITLE ? { job_key: r.JOB_KEY ?? 1, job_id: r.JOB_ID ?? 'J001', job_title: r.JOB_TITLE ?? 'General Role' } : null
    }));

    res.json({ success: true, total: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req, res, next) {
  try {
    const { app_status, final_result, app_date, cand_id, job_key, offer_letter } = req.body;

    const maxIdResult = await executeQuery("SELECT NVL(MAX(TO_NUMBER(SUBSTR(app_id, 4))), 0) + 1 AS next_num FROM Application");
    const nextNum = maxIdResult.rows[0]?.NEXT_NUM ?? maxIdResult.rows[0]?.next_num ?? 26;
    const nextId = `APP00${nextNum}`;
    const dateVal = app_date || new Date().toISOString().split('T')[0];
    const statusVal = app_status || 'In Review';
    const resultVal = final_result || 'Pending';

    await executeQuery(`
      INSERT INTO Application (app_id, app_status, final_result)
      VALUES (:nextId, :statusVal, :resultVal)
    `, { nextId, statusVal, resultVal });

    await executeQuery(`
      INSERT INTO Application_Info (app_id, app_date)
      VALUES (:nextId, TO_DATE(:dateVal, 'YYYY-MM-DD'))
    `, { nextId, dateVal });

    const dateCheck = await executeQuery(`
      SELECT app_date FROM Application_Date WHERE app_date = TO_DATE(:dateVal, 'YYYY-MM-DD') AND final_result = :resultVal
    `, { dateVal, resultVal });

    if (dateCheck.rows.length === 0) {
      await executeQuery(`
        INSERT INTO Application_Date (app_date, offer_letter, final_result)
        VALUES (TO_DATE(:dateVal, 'YYYY-MM-DD'), :offer_letter, :resultVal)
      `, { dateVal, offer_letter: offer_letter || 'Standard Application', resultVal });
    }

    if (cand_id) {
      await executeQuery(`
        UPDATE Candidate SET app_id = :nextId WHERE cand_id = :candId
      `, { nextId, candId: parseInt(cand_id, 10) });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_APPLICATION',
      details: `Created Application #${nextId} (${statusVal}) in Oracle Database`
    });

    res.status(201).json({
      success: true,
      message: `Application #${nextId} created successfully.`,
      data: { app_id: nextId, app_status: statusVal, final_result: resultVal }
    });
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

export async function deleteApplication(req, res, next) {
  try {
    const { id } = req.params;

    await executeQuery(`UPDATE Candidate SET app_id = NULL WHERE app_id = :id`, { id });
    await executeQuery(`UPDATE Job_Details SET app_id = NULL WHERE app_id = :id`, { id });
    await executeQuery(`DELETE FROM Application_Info WHERE app_id = :id`, { id });
    await executeQuery(`DELETE FROM Application WHERE app_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_APPLICATION',
      details: `Deleted Application #${id} from Oracle Database`
    });

    res.json({ success: true, message: `Application #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
