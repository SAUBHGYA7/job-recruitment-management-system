import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getJobs(req, res, next) {
  try {
    const { status, title } = req.query;

    let sql = `
      SELECT j.job_key, j.job_id, j.job_status, j.salary,
             jd.job_title, jd.descriptive, jd.app_id,
             TO_CHAR(jp.closing_date, 'YYYY-MM-DD') AS closing_date,
             TO_CHAR(jp.posted_date, 'YYYY-MM-DD') AS posted_date,
             (SELECT COUNT(*) FROM Applies WHERE job_key = j.job_key) AS applicant_count
      FROM Job j
      LEFT JOIN Job_Details jd ON jd.job_key = j.job_key
      LEFT JOIN Job_Posting jp ON jp.job_title = jd.job_title
      WHERE 1=1
    `;

    const binds = {};

    if (status && status !== 'ALL') {
      sql += ` AND LOWER(j.job_status) = LOWER(:status)`;
      binds.status = status;
    }

    if (title) {
      sql += ` AND (LOWER(jd.job_title) LIKE '%' || LOWER(:title) || '%' OR LOWER(j.job_id) LIKE '%' || LOWER(:title) || '%')`;
      binds.title = title;
    }

    sql += ` ORDER BY j.job_key ASC`;

    const result = await executeQuery(sql, binds);

    const jobs = await Promise.all(result.rows.map(async (r) => {
      const jobKey = r.JOB_KEY ?? r.job_key;
      const skillsRes = await executeQuery(`
        SELECT s.skill_id, s.skill_name, req.is_mandatory, req.min_years
        FROM Requires req
        JOIN Skill s ON s.skill_id = req.skill_id
        WHERE req.job_key = :jobKey
      `, { jobKey });

      return {
        job_key: jobKey,
        job_id: r.JOB_ID ?? r.job_id,
        job_status: r.JOB_STATUS ?? r.job_status,
        salary: r.SALARY ?? r.salary,
        job_title: r.JOB_TITLE ?? r.job_title,
        descriptive: r.DESCRIPTIVE ?? r.descriptive,
        app_id: r.APP_ID ?? r.app_id,
        closing_date: r.CLOSING_DATE ?? r.closing_date,
        posted_date: r.POSTED_DATE ?? r.posted_date,
        applicant_count: r.APPLICANT_COUNT ?? r.applicant_count ?? 0,
        required_skills: skillsRes.rows.map(sk => ({
          skill_id: sk.SKILL_ID || sk.skill_id,
          skill_name: sk.SKILL_NAME || sk.skill_name,
          is_mandatory: sk.IS_MANDATORY || sk.is_mandatory,
          min_years: sk.MIN_YEARS || sk.min_years
        }))
      };
    }));

    res.json({ success: true, total: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);

    const jobRes = await executeQuery(`
      SELECT j.job_key, j.job_id, j.job_status, j.salary,
             jd.job_title, jd.descriptive, jd.app_id,
             TO_CHAR(jp.closing_date, 'YYYY-MM-DD') AS closing_date,
             TO_CHAR(jp.posted_date, 'YYYY-MM-DD') AS posted_date
      FROM Job j
      LEFT JOIN Job_Details jd ON jd.job_key = j.job_key
      LEFT JOIN Job_Posting jp ON jp.job_title = jd.job_title
      WHERE j.job_key = :jobKey
    `, { jobKey });

    if (jobRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const j = jobRes.rows[0];
    const skillsRes = await executeQuery(`
      SELECT s.skill_id, s.skill_name, req.is_mandatory, req.min_years
      FROM Requires req
      JOIN Skill s ON s.skill_id = req.skill_id
      WHERE req.job_key = :jobKey
    `, { jobKey });

    res.json({
      success: true,
      data: {
        ...j,
        required_skills: skillsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const { job_title, job_status, salary, descriptive, closing_date, app_id } = req.body;

    if (!job_title) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    const maxKeyResult = await executeQuery('SELECT NVL(MAX(job_key), 0) + 1 AS next_key FROM Job');
    const nextKey = maxKeyResult.rows[0]?.NEXT_KEY ?? maxKeyResult.rows[0]?.next_key ?? 6;
    const nextId = `J00${nextKey}`;

    await executeQuery(`
      INSERT INTO Job (job_key, job_id, job_status, salary)
      VALUES (:nextKey, :nextId, :job_status, :salary)
    `, {
      nextKey,
      nextId,
      job_status: job_status || 'Open',
      salary: salary ? parseFloat(salary) : 60000
    });

    await executeQuery(`
      INSERT INTO Job_Details (job_key, job_title, descriptive, app_id)
      VALUES (:nextKey, :job_title, :descriptive, :app_id)
    `, {
      nextKey,
      job_title,
      descriptive: descriptive || 'Standard recruitment role',
      app_id: app_id || 'APP001'
    });

    const postingCheck = await executeQuery(`SELECT job_title FROM Job_Posting WHERE job_title = :job_title`, { job_title });
    if (postingCheck.rows.length === 0) {
      await executeQuery(`
        INSERT INTO Job_Posting (job_title, closing_date, posted_date)
        VALUES (:job_title, TO_DATE(:closing_date, 'YYYY-MM-DD'), SYSDATE)
      `, {
        job_title,
        closing_date: closing_date || '2026-10-31'
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_JOB',
      details: `Created Job #${nextId} (${job_title}) in Oracle Database`
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created in Oracle Database.',
      data: { job_key: nextKey, job_id: nextId, job_title }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);
    const { job_status, salary, descriptive } = req.body;

    await executeQuery(`
      UPDATE Job SET job_status = :job_status, salary = :salary WHERE job_key = :jobKey
    `, { job_status, salary: parseFloat(salary), jobKey });

    if (descriptive) {
      await executeQuery(`
        UPDATE Job_Details SET descriptive = :descriptive WHERE job_key = :jobKey
      `, { descriptive, jobKey });
    }

    res.json({ success: true, message: `Job #${jobKey} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);

    await executeQuery(`DELETE FROM Job WHERE job_key = :jobKey`, { jobKey });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_JOB',
      details: `Deleted Job #${jobKey} from Oracle Database`
    });

    res.json({ success: true, message: `Job #${jobKey} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
