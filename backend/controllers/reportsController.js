import { executeQuery } from '../db/oracle.js';
import { inMemoryDb } from '../db/inMemoryDb.js';

export async function getUserReports(req, res, next) {
  try {
    // 1. Applications by Status & Result
    const appRes = await executeQuery(`
      SELECT a.app_id, a.app_status, a.final_result,
             c.fname || ' ' || c.lname AS candidate_name,
             jd.job_title
      FROM Application a
      LEFT JOIN Candidate c ON c.app_id = a.app_id
      LEFT JOIN Job_Details jd ON jd.app_id = a.app_id
      ORDER BY a.app_id ASC
    `);
    const appReport = appRes.rows.map(a => ({
      app_id: a.APP_ID ?? a.app_id,
      candidate_name: (a.CANDIDATE_NAME ?? a.candidate_name ?? 'Unknown Candidate').trim(),
      job_title: a.JOB_TITLE ?? a.job_title ?? 'General Role',
      app_status: a.APP_STATUS ?? a.app_status,
      final_result: a.FINAL_RESULT ?? a.final_result
    }));

    // 2. Skill Demand vs Supply
    const skillRes = await executeQuery(`
      SELECT s.skill_id, s.skill_name,
             (SELECT COUNT(*) FROM Requires WHERE skill_id = s.skill_id) AS demand_count,
             (SELECT COUNT(*) FROM Has WHERE skill_id = s.skill_id) AS candidate_count
      FROM Skill s
      LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name
      ORDER BY s.skill_id ASC
    `);
    const skillReport = skillRes.rows.map(s => {
      const requiredInJobs = Number(s.DEMAND_COUNT ?? s.demand_count ?? 0);
      const candidatePossessing = Number(s.CANDIDATE_COUNT ?? s.candidate_count ?? 0);
      return {
        skill_id: s.SKILL_ID ?? s.skill_id,
        skill_name: s.SKILL_NAME ?? s.skill_name,
        jobDemandCount: requiredInJobs,
        candidateSupplyCount: candidatePossessing,
        gap: requiredInJobs - candidatePossessing
      };
    });

    // 3. Compensation by Job Title
    const jobRes = await executeQuery(`
      SELECT j.job_key, j.job_id, j.job_status, j.salary, jd.job_title
      FROM Job j
      LEFT JOIN Job_Details jd ON jd.job_key = j.job_key
      ORDER BY j.job_key ASC
    `);
    const salaryReport = jobRes.rows.map(j => ({
      job_id: j.JOB_ID ?? j.job_id,
      job_title: j.JOB_TITLE ?? j.job_title ?? 'Position',
      job_status: j.JOB_STATUS ?? j.job_status,
      salary: j.SALARY ?? j.salary
    }));

    res.json({
      success: true,
      data: {
        appReport,
        skillReport,
        salaryReport
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDesignerReports(req, res, next) {
  try {
    const tableReport = Object.keys(inMemoryDb.tables).map(tName => {
      const upper = tName.toUpperCase();
      const cols = inMemoryDb.schemaMetadata.USER_TAB_COLUMNS.filter(c => c.TABLE_NAME === upper);
      const pk = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.find(c => c.TABLE_NAME === upper && c.CONSTRAINT_TYPE === 'P');
      const fks = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.filter(c => c.TABLE_NAME === upper && c.CONSTRAINT_TYPE === 'R');
      const checks = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.filter(c => c.TABLE_NAME === upper && c.CONSTRAINT_TYPE === 'C');

      return {
        tableName: upper,
        columnCount: cols.length,
        primaryKey: pk ? pk.CONSTRAINT_NAME : 'NONE',
        foreignKeyCount: fks.length,
        checkConstraintCount: checks.length,
        rowCount: inMemoryDb.tables[tName].length
      };
    });

    res.json({ success: true, data: { tableReport } });
  } catch (error) {
    next(error);
  }
}

export async function getDbaReports(req, res, next) {
  try {
    const usersRes = await executeQuery(`SELECT role FROM APP_USERS`);
    const userRoleCounts = {};
    usersRes.rows.forEach(u => {
      const role = u.ROLE ?? u.role;
      userRoleCounts[role] = (userRoleCounts[role] || 0) + 1;
    });

    const auditRes = await executeQuery(`SELECT action FROM APP_AUDIT_LOG`);
    const auditActionCounts = {};
    auditRes.rows.forEach(l => {
      const action = l.ACTION ?? l.action;
      auditActionCounts[action] = (auditActionCounts[action] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        userRoleCounts,
        auditActionCounts
      }
    });
  } catch (error) {
    next(error);
  }
}
