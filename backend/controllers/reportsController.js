import { inMemoryDb } from '../db/inMemoryDb.js';

export async function getUserReports(req, res, next) {
  try {
    // 1. Applications by Status & Result
    const appReport = inMemoryDb.tables.Application.map(a => {
      const c = inMemoryDb.tables.Candidate.find(cand => cand.APP_ID === a.APP_ID) || {};
      const jd = inMemoryDb.tables.Job_Details.find(j => j.APP_ID === a.APP_ID) || {};
      return {
        app_id: a.APP_ID,
        candidate_name: `${c.FNAME || 'Unknown'} ${c.LNAME || ''}`,
        job_title: jd.JOB_TITLE || 'Software Engineer',
        app_status: a.APP_STATUS,
        final_result: a.FINAL_RESULT
      };
    });

    // 2. Skill Demand vs Supply
    const skillReport = inMemoryDb.tables.Skill.map(s => {
      const requiredInJobs = inMemoryDb.tables.Requires.filter(r => r.SKILL_ID === s.SKILL_ID).length;
      const candidatePossessing = inMemoryDb.tables.Has.filter(h => h.SKILL_ID === s.SKILL_ID).length;
      return {
        skill_id: s.SKILL_ID,
        skill_name: s.SKILL_NAME,
        jobDemandCount: requiredInJobs,
        candidateSupplyCount: candidatePossessing,
        gap: requiredInJobs - candidatePossessing
      };
    });

    // 3. Compensation by Job Title
    const salaryReport = inMemoryDb.tables.Job.map(j => {
      const jd = inMemoryDb.tables.Job_Details.find(d => d.JOB_KEY === j.JOB_KEY) || {};
      return {
        job_id: j.JOB_ID,
        job_title: jd.JOB_TITLE || 'Position',
        job_status: j.JOB_STATUS,
        salary: j.SALARY
      };
    });

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
    const userRoleCounts = {};
    inMemoryDb.tables.APP_USERS.forEach(u => {
      userRoleCounts[u.ROLE] = (userRoleCounts[u.ROLE] || 0) + 1;
    });

    const auditActionCounts = {};
    inMemoryDb.tables.APP_AUDIT_LOG.forEach(l => {
      auditActionCounts[l.ACTION] = (auditActionCounts[l.ACTION] || 0) + 1;
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
