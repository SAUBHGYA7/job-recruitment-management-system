import { runQuery, getDbStatus } from '../db/neo4j.js';

export async function getUserDashboard(req, res, next) {
  try {
    // 1. Live KPI Counts from Neo4j Graph Database
    const kpiCypher = `
      CALL { MATCH (c:Candidate) RETURN count(c) AS totalCandidates }
      CALL { MATCH (j:Job) RETURN count(j) AS totalJobs, count(CASE WHEN j.job_status = 'Open' THEN 1 END) AS openJobs }
      CALL { MATCH (a:Application) RETURN count(a) AS totalApplications }
      CALL { MATCH (i:Interview) RETURN count(i) AS totalInterviews }
      CALL { MATCH (e:Employer) RETURN count(e) AS totalEmployers }
      RETURN totalCandidates, totalJobs, openJobs, totalApplications, totalInterviews, totalEmployers
    `;
    const kpiRecords = await runQuery(kpiCypher);
    const kpis = {
      totalCandidates: Number(kpiRecords[0]?.totalCandidates || 0),
      totalJobs: Number(kpiRecords[0]?.totalJobs || 0),
      openJobs: Number(kpiRecords[0]?.openJobs || 0),
      totalApplications: Number(kpiRecords[0]?.totalApplications || 0),
      totalInterviews: Number(kpiRecords[0]?.totalInterviews || 0),
      totalEmployers: Number(kpiRecords[0]?.totalEmployers || 0)
    };

    // 2. Applications by Status
    const appStatusCypher = `
      MATCH (a:Application)
      RETURN coalesce(a.app_status, 'Unknown') AS status, count(a) AS count
      ORDER BY count DESC
    `;
    const appStatusRecords = await runQuery(appStatusCypher);
    const applicationsByStatus = appStatusRecords.map(r => ({
      status: r.status,
      count: Number(r.count || 0)
    }));

    // 3. Jobs by Status
    const jobStatusCypher = `
      MATCH (j:Job)
      RETURN coalesce(j.job_status, 'Unknown') AS status, count(j) AS count
      ORDER BY count DESC
    `;
    const jobStatusRecords = await runQuery(jobStatusCypher);
    const jobsByStatus = jobStatusRecords.map(r => ({
      status: r.status,
      count: Number(r.count || 0)
    }));

    // 4. Interviews by Status
    const intStatusCypher = `
      MATCH (i:Interview)
      RETURN coalesce(i.int_status, 'Unknown') AS status, count(i) AS count
      ORDER BY count DESC
    `;
    const intStatusRecords = await runQuery(intStatusCypher);
    const interviewsByStatus = intStatusRecords.map(r => ({
      status: r.status,
      count: Number(r.count || 0)
    }));

    // 5. Most Demanded Skills
    const skillDemandCypher = `
      MATCH (j:Job)-[:REQUIRES]->(s:Skill)
      RETURN s.skill_name AS skill, count(j) AS demand
      ORDER BY demand DESC
    `;
    const skillDemandRecords = await runQuery(skillDemandCypher);
    const demandedSkills = skillDemandRecords.map(r => ({
      skill: r.skill,
      demand: Number(r.demand || 0)
    }));

    // 6. Recent Candidate Applications (multi-hop graph traversal)
    const recentAppsCypher = `
      MATCH (c:Candidate)-[:SUBMITTED_APPLICATION]->(a:Application)-[:FOR_JOB]->(j:Job)
      RETURN c.cand_id AS cand_id,
             c.fname + ' ' + c.lname AS candidate_name,
             j.job_id AS job_id,
             j.job_title AS job_title,
             a.app_status AS app_status,
             a.final_result AS final_result
      ORDER BY c.cand_id ASC
      LIMIT 5
    `;
    const recentAppsRecords = await runQuery(recentAppsCypher);
    const recentApplications = recentAppsRecords.map(r => ({
      cand_id: r.cand_id,
      candidate_name: r.candidate_name,
      job_id: r.job_id,
      job_title: r.job_title,
      app_status: r.app_status,
      final_result: r.final_result
    }));

    res.json({
      success: true,
      data: {
        kpis,
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
