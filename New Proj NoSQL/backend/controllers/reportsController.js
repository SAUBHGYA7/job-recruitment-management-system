import { runQuery } from '../db/neo4j.js';
import { inMemoryDb } from '../db/inMemoryDb.js';

export async function getUserReports(req, res, next) {
  try {
    // 1. Applications by Status & Result (Fully Reconciled Graph Traversal)
    const appCypher = `
      MATCH (c:Candidate)-[:SUBMITTED_APPLICATION]->(a:Application)-[:FOR_JOB]->(j:Job)
      RETURN a.app_id AS app_id,
             c.fname + ' ' + c.lname AS candidate_name,
             coalesce(j.job_title, 'General Role') AS job_title,
             a.app_status AS app_status,
             a.final_result AS final_result
      ORDER BY a.app_id ASC
    `;
    const appRes = await runQuery(appCypher);
    const appReport = appRes.map(a => ({
      app_id: a.app_id,
      candidate_name: (a.candidate_name || 'Unknown Candidate').trim(),
      job_title: a.job_title || 'General Role',
      app_status: a.app_status,
      final_result: a.final_result
    }));

    // 2. Skill Demand vs Supply
    const skillCypher = `
      MATCH (s:Skill)
      OPTIONAL MATCH (j:Job)-[:REQUIRES]->(s)
      WITH s, count(DISTINCT j) AS demand_count
      OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s)
      WITH s, demand_count, count(DISTINCT c) AS candidate_count
      RETURN s.skill_id AS skill_id,
             s.skill_name AS skill_name,
             demand_count AS jobDemandCount,
             candidate_count AS candidateSupplyCount,
             (demand_count - candidate_count) AS gap
      ORDER BY s.skill_id ASC
    `;
    const skillRes = await runQuery(skillCypher);
    const skillReport = skillRes.map(s => {
      const requiredInJobs = Number(s.jobDemandCount || 0);
      const candidatePossessing = Number(s.candidateSupplyCount || 0);
      return {
        skill_id: s.skill_id,
        skill_name: s.skill_name,
        jobDemandCount: requiredInJobs,
        candidateSupplyCount: candidatePossessing,
        gap: requiredInJobs - candidatePossessing
      };
    });

    // 3. Compensation by Job Title
    const jobCypher = `
      MATCH (j:Job)
      RETURN j.job_id AS job_id,
             coalesce(j.job_title, 'Position') AS job_title,
             coalesce(j.job_status, 'Open') AS job_status,
             j.salary AS salary
      ORDER BY j.job_key ASC
    `;
    const jobRes = await runQuery(jobCypher);
    const salaryReport = jobRes.map(j => ({
      job_id: j.job_id,
      job_title: j.job_title || 'Position',
      job_status: j.job_status,
      salary: j.salary
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
    const usersRes = await runQuery(`MATCH (u:AppUser) RETURN u.role AS role`);
    const userRoleCounts = {};
    usersRes.forEach(u => {
      const role = u.role || 'USER';
      userRoleCounts[role] = (userRoleCounts[role] || 0) + 1;
    });

    const auditRes = await runQuery(`MATCH (l:AuditLog) RETURN l.action AS action`);
    const auditActionCounts = {};
    auditRes.forEach(l => {
      const action = l.action || 'UNKNOWN';
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
