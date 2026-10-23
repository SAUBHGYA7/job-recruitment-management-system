import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getJobs(req, res, next) {
  try {
    const { status, title } = req.query;

    const cypher = `
      MATCH (j:Job)
      WHERE ($status IS NULL OR $status = 'ALL' OR toLower(j.job_status) = toLower($status))
        AND ($title IS NULL OR $title = '' OR
             toLower(coalesce(j.job_title, '')) CONTAINS toLower($title) OR
             toLower(j.job_id) CONTAINS toLower($title))
      OPTIONAL MATCH (j)-[req:REQUIRES]->(s:Skill)
      OPTIONAL MATCH (c:Candidate)-[:APPLIED_FOR]->(j)
      WITH j, count(DISTINCT c) AS applicant_count,
           collect(DISTINCT CASE WHEN s IS NOT NULL THEN {
             skill_id: s.skill_id,
             skill_name: s.skill_name,
             is_mandatory: req.is_mandatory,
             min_years: req.min_years
           } ELSE null END) AS rawSkills
      RETURN j, applicant_count, [sk IN rawSkills WHERE sk IS NOT NULL] AS required_skills
      ORDER BY j.job_key ASC
    `;

    const result = await runQuery(cypher, {
      status: status || null,
      title: title || null
    });

    const jobs = result.rows.map(r => {
      const j = r.j || {};
      return {
        job_key: j.job_key,
        job_id: j.job_id,
        job_status: j.job_status || 'Open',
        salary: j.salary !== undefined ? j.salary : null,
        job_title: j.job_title || 'General Position',
        descriptive: j.descriptive || '',
        app_id: j.app_id || null,
        closing_date: j.closing_date || null,
        posted_date: j.posted_date || null,
        applicant_count: r.applicant_count || 0,
        required_skills: r.required_skills || []
      };
    });

    res.json({ success: true, total: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);

    const cypher = `
      MATCH (j:Job {job_key: $jobKey})
      OPTIONAL MATCH (j)-[req:REQUIRES]->(s:Skill)
      OPTIONAL MATCH (c:Candidate)-[:APPLIED_FOR]->(j)
      WITH j, count(DISTINCT c) AS applicant_count,
           collect(DISTINCT CASE WHEN s IS NOT NULL THEN {
             skill_id: s.skill_id,
             skill_name: s.skill_name,
             is_mandatory: req.is_mandatory,
             min_years: req.min_years
           } ELSE null END) AS rawSkills
      RETURN j, applicant_count, [sk IN rawSkills WHERE sk IS NOT NULL] AS required_skills
    `;

    const result = await runQuery(cypher, { jobKey });

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const row = result.rows[0];
    const j = row.j || {};

    res.json({
      success: true,
      data: {
        job_key: j.job_key,
        job_id: j.job_id,
        job_status: j.job_status,
        salary: j.salary,
        job_title: j.job_title,
        descriptive: j.descriptive,
        app_id: j.app_id || null,
        closing_date: j.closing_date,
        posted_date: j.posted_date,
        applicant_count: row.applicant_count || 0,
        required_skills: row.required_skills || []
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const { job_title, job_status, salary, descriptive, closing_date, app_id, skills } = req.body;

    if (!job_title) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    const nextKey = await getNextSequence('job', 21);
    const jobId = `J${String(nextKey).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const closing = closing_date || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const cypher = `
      CREATE (j:Job {
        job_key: $nextKey,
        job_id: $jobId,
        job_status: $jobStatus,
        salary: $salary,
        job_title: $jobTitle,
        descriptive: $descriptive,
        app_id: $appId,
        posted_date: $today,
        closing_date: $closing
      })
      RETURN j.job_key AS job_key, j.job_id AS job_id
    `;

    await runQuery(cypher, {
      nextKey,
      jobId,
      jobStatus: job_status || 'Open',
      salary: salary ? parseFloat(salary) : 60000,
      jobTitle: job_title,
      descriptive: descriptive || `${job_title} role in software engineering.`,
      appId: app_id || null,
      today,
      closing
    });

    // If required skills are specified
    if (Array.isArray(skills) && skills.length > 0) {
      for (const sk of skills) {
        if (sk.skill_id) {
          await runQuery(`
            MATCH (j:Job {job_key: $nextKey}), (s:Skill {skill_id: $skillId})
            MERGE (j)-[r:REQUIRES]->(s)
            SET r.is_mandatory = $isMandatory, r.min_years = $minYears
          `, {
            nextKey,
            skillId: sk.skill_id,
            isMandatory: sk.is_mandatory === true || sk.is_mandatory === 'Y' || sk.is_mandatory === 1,
            minYears: sk.min_years ? parseFloat(sk.min_years) : 2.0
          });
        }
      }
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_JOB',
      details: `Created Job #${nextKey} (${jobId}: ${job_title}) in Neo4j Graph Database`
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully.',
      data: { job_key: nextKey, job_id: jobId, job_title }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);
    const { job_title, job_status, salary, descriptive, closing_date, app_id } = req.body;

    const cypher = `
      MATCH (j:Job {job_key: $jobKey})
      SET j.job_title = coalesce($jobTitle, j.job_title),
          j.job_status = coalesce($jobStatus, j.job_status),
          j.salary = CASE WHEN $salary IS NOT NULL THEN $salary ELSE j.salary END,
          j.descriptive = coalesce($descriptive, j.descriptive),
          j.closing_date = coalesce($closingDate, j.closing_date),
          j.app_id = CASE WHEN $appId IS NOT NULL THEN $appId ELSE j.app_id END
      RETURN j.job_key AS job_key
    `;

    const result = await runQuery(cypher, {
      jobKey,
      jobTitle: job_title || null,
      jobStatus: job_status || null,
      salary: salary !== undefined ? parseFloat(salary) : null,
      descriptive: descriptive || null,
      closingDate: closing_date || null,
      appId: app_id !== undefined ? app_id : null
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_JOB',
      details: `Updated Job #${jobKey} in Neo4j Graph Database`
    });

    res.json({ success: true, message: `Job #${jobKey} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const { id } = req.params;
    const jobKey = parseInt(id, 10);

    const cypher = `
      MATCH (j:Job {job_key: $jobKey})
      OPTIONAL MATCH (ass:Assessment)-[:ASSESSED_FOR_JOB]->(j)
      WITH j, collect(DISTINCT ass) AS assessments
      FOREACH (a IN assessments | DETACH DELETE a)
      DETACH DELETE j
      RETURN count(j) AS deletedCount
    `;

    const result = await runQuery(cypher, { jobKey });
    const count = result.rows[0]?.deletedCount || 0;

    if (count === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_JOB',
      details: `Deleted Job #${jobKey} from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Job #${jobKey} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
