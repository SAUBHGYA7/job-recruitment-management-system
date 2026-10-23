import { executeQuery, getDbStatus } from '../db/oracle.js';

export async function getUserDashboard(req, res, next) {
  try {
    // 1. Live KPI Counts from Oracle Database
    const candResult = await executeQuery('SELECT COUNT(*) AS count FROM Candidate');
    const jobResult = await executeQuery('SELECT COUNT(*) AS count FROM Job');
    const openJobResult = await executeQuery("SELECT COUNT(*) AS count FROM Job WHERE job_status = 'Open'");
    const appResult = await executeQuery('SELECT COUNT(*) AS count FROM Application');
    const intResult = await executeQuery('SELECT COUNT(*) AS count FROM Interview');
    const empResult = await executeQuery('SELECT COUNT(*) AS count FROM Employer');

    const totalCandidates = candResult.rows[0]?.COUNT ?? candResult.rows[0]?.count ?? 0;
    const totalJobs = jobResult.rows[0]?.COUNT ?? jobResult.rows[0]?.count ?? 0;
    const openJobs = openJobResult.rows[0]?.COUNT ?? openJobResult.rows[0]?.count ?? 0;
    const totalApplications = appResult.rows[0]?.COUNT ?? appResult.rows[0]?.count ?? 0;
    const totalInterviews = intResult.rows[0]?.COUNT ?? intResult.rows[0]?.count ?? 0;
    const totalEmployers = empResult.rows[0]?.COUNT ?? empResult.rows[0]?.count ?? 0;

    // 2. Applications by Status from Oracle
    const appStatusResult = await executeQuery(`
      SELECT app_status AS status, COUNT(*) AS count
      FROM Application
      GROUP BY app_status
      ORDER BY count DESC
    `);
    const applicationsByStatus = appStatusResult.rows.map(r => ({
      status: r.STATUS || r.status || 'Unknown',
      count: r.COUNT || r.count || 0
    }));

    // 3. Jobs by Status from Oracle
    const jobStatusResult = await executeQuery(`
      SELECT job_status AS status, COUNT(*) AS count
      FROM Job
      GROUP BY job_status
      ORDER BY count DESC
    `);
    const jobsByStatus = jobStatusResult.rows.map(r => ({
      status: r.STATUS || r.status || 'Unknown',
      count: r.COUNT || r.count || 0
    }));

    // 4. Interviews by Status from Oracle
    const intStatusResult = await executeQuery(`
      SELECT int_status AS status, COUNT(*) AS count
      FROM Interview_Details
      GROUP BY int_status
      ORDER BY count DESC
    `);
    const interviewsByStatus = intStatusResult.rows.map(r => ({
      status: r.STATUS || r.status || 'Unknown',
      count: r.COUNT || r.count || 0
    }));

    // 5. Most Demanded Skills from Oracle (Requires JOIN Skill)
    const skillDemandResult = await executeQuery(`
      SELECT s.skill_name AS skill, COUNT(*) AS demand
      FROM Requires r
      JOIN Skill s ON s.skill_id = r.skill_id
      GROUP BY s.skill_name
      ORDER BY demand DESC
    `);
    const demandedSkills = skillDemandResult.rows.map(r => ({
      skill: r.SKILL || r.skill,
      demand: r.DEMAND || r.demand
    }));

    // 6. Recent Candidate Applications with multi-table join
    const recentAppsResult = await executeQuery(`
      SELECT c.cand_id,
             c.fname || ' ' || c.lname AS candidate_name,
             j.job_id,
             jd.job_title,
             a.app_status,
             a.final_result
      FROM Candidate c
      JOIN Application a ON a.app_id = c.app_id
      JOIN Applies ap ON ap.cand_id = c.cand_id
      JOIN Job j ON j.job_key = ap.job_key
      JOIN Job_Details jd ON jd.job_key = j.job_key
      ORDER BY c.cand_id ASC
      FETCH FIRST 5 ROWS ONLY
    `);
    const recentApplications = recentAppsResult.rows.map(r => ({
      cand_id: r.CAND_ID || r.cand_id,
      candidate_name: r.CANDIDATE_NAME || r.candidate_name,
      job_id: r.JOB_ID || r.job_id,
      job_title: r.JOB_TITLE || r.job_title,
      app_status: r.APP_STATUS || r.app_status,
      final_result: r.FINAL_RESULT || r.final_result
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalCandidates,
          totalJobs,
          openJobs,
          totalApplications,
          totalInterviews,
          totalEmployers
        },
        charts: {
          applicationsByStatus,
          jobsByStatus,
          interviewsByStatus,
          demandedSkills
        },
        recentApplications,
        dbStatus: getDbStatus()
      }
    });
  } catch (error) {
    next(error);
  }
}
