import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getApplications(req, res, next) {
  try {
    const cypher = `
      MATCH (a:Application)
      OPTIONAL MATCH (c:Candidate)-[:SUBMITTED_APPLICATION]->(a)
      OPTIONAL MATCH (a)-[:FOR_JOB]->(j:Job)
      RETURN a, c, j
      ORDER BY a.app_id ASC
    `;

    const result = await runQuery(cypher);

    const applications = result.rows.map(r => {
      const a = r.a || {};
      const c = r.c || null;
      const j = r.j || null;

      const candidateName = c ? `${c.fname || ''} ${c.lname || ''}`.trim() : null;

      return {
        app_id: a.app_id,
        app_status: a.app_status || 'In Review',
        final_result: a.final_result || 'Pending',
        app_date: a.app_date || '2026-09-01',
        offer_letter: a.offer_letter || null,
        candidate: c ? {
          id: c.cand_id,
          cand_id: c.cand_id,
          name: candidateName
        } : null,
        job: j ? {
          job_key: j.job_key,
          job_id: j.job_id || `J${String(j.job_key).padStart(3, '0')}`,
          job_title: j.job_title || 'General Position'
        } : null
      };
    });

    res.json({ success: true, total: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req, res, next) {
  try {
    const { app_status, final_result, app_date, cand_id, job_key, offer_letter } = req.body;

    // Atomic sequence increment prevents ID collisions
    const nextNum = await getNextSequence('application', 26);
    const nextId = `APP${String(nextNum).padStart(3, '0')}`;
    const dateVal = app_date || new Date().toISOString().split('T')[0];
    const statusVal = app_status || 'In Review';
    const resultVal = final_result || 'Pending';
    const cId = cand_id ? parseInt(cand_id, 10) : null;
    const jKey = job_key ? parseInt(job_key, 10) : null;

    const cypher = `
      CREATE (a:Application {
        app_id: $nextId,
        app_status: $statusVal,
        final_result: $resultVal,
        app_date: $dateVal,
        offer_letter: $offerLetter
      })
      WITH a
      OPTIONAL MATCH (c:Candidate {cand_id: $cId})
      FOREACH (_ IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:SUBMITTED_APPLICATION]->(a))
      WITH a, c
      OPTIONAL MATCH (j:Job {job_key: $jKey})
      FOREACH (_ IN CASE WHEN j IS NOT NULL THEN [1] ELSE [] END | MERGE (a)-[:FOR_JOB]->(j))
      FOREACH (_ IN CASE WHEN c IS NOT NULL AND j IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:APPLIED_FOR]->(j))
      RETURN a.app_id AS app_id
    `;

    await runQuery(cypher, {
      nextId,
      statusVal,
      resultVal,
      dateVal,
      offerLetter: offer_letter || 'Standard Application',
      cId,
      jKey
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_APPLICATION',
      details: `Created Application #${nextId} (${statusVal}) in Neo4j Graph Database`
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
    const { app_status, final_result, app_date, offer_letter, cand_id, job_key } = req.body;

    const cId = cand_id ? parseInt(cand_id, 10) : null;
    const jKey = job_key ? parseInt(job_key, 10) : null;

    const cypher = `
      MATCH (a:Application {app_id: $id})
      SET a.app_status = coalesce($appStatus, a.app_status),
          a.final_result = coalesce($finalResult, a.final_result),
          a.app_date = coalesce($appDate, a.app_date),
          a.offer_letter = CASE WHEN $offerLetter IS NOT NULL THEN $offerLetter ELSE a.offer_letter END
      WITH a
      OPTIONAL MATCH (c:Candidate {cand_id: $cId})
      FOREACH (_ IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
        MERGE (c)-[:SUBMITTED_APPLICATION]->(a)
      )
      WITH a
      OPTIONAL MATCH (j:Job {job_key: $jKey})
      FOREACH (_ IN CASE WHEN j IS NOT NULL THEN [1] ELSE [] END |
        MERGE (a)-[:FOR_JOB]->(j)
      )
      RETURN a.app_id AS app_id
    `;

    const result = await runQuery(cypher, {
      id,
      appStatus: app_status || null,
      finalResult: final_result || null,
      appDate: app_date || null,
      offerLetter: offer_letter !== undefined ? offer_letter : null,
      cId,
      jKey
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Application #${id} not found.` });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_APPLICATION_STATUS',
      details: `Updated Application #${id} status to ${app_status} (${final_result}) in Neo4j`
    });

    res.json({ success: true, message: `Application #${id} status updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteApplication(req, res, next) {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (a:Application {app_id: $id})
      DETACH DELETE a
      RETURN count(a) AS deletedCount
    `;

    const result = await runQuery(cypher, { id });
    const count = result.rows[0]?.deletedCount || 0;

    if (count === 0) {
      return res.status(404).json({ success: false, message: `Application #${id} not found.` });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_APPLICATION',
      details: `Deleted Application #${id} from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Application #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
