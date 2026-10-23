import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getInterviews(req, res, next) {
  try {
    const { search, mode } = req.query;

    const cypher = `
      MATCH (i:Interview)
      OPTIONAL MATCH (c:Candidate)-[:HAS_INTERVIEW]->(i)
      WITH i, c
      WHERE ($mode IS NULL OR $mode = 'ALL' OR toLower(i.int_mode) = toLower($mode))
        AND (
          $search IS NULL OR $search = '' OR
          toLower(i.int_id) CONTAINS toLower($search) OR
          toLower(coalesce(c.fname, '') + ' ' + coalesce(c.lname, '')) CONTAINS toLower($search) OR
          toLower(coalesce(i.location, '')) CONTAINS toLower($search) OR
          toLower(coalesce(i.feedback, '')) CONTAINS toLower($search)
        )
      RETURN i {
        .*,
        candidate: CASE WHEN c IS NOT NULL THEN { cand_id: c.cand_id, name: c.fname + ' ' + c.lname } ELSE null END
      } AS interview
      ORDER BY i.int_id ASC
    `;

    const records = await runQuery(cypher, {
      mode: mode && mode !== 'ALL' ? mode : null,
      search: search ? search.trim() : null
    });

    const interviews = records.map(r => {
      const i = r.interview;
      return {
        int_id: i.int_id,
        int_date: i.int_date,
        int_time: i.int_time,
        int_mode: i.int_mode,
        location: i.location,
        int_status: i.int_status,
        score: i.score,
        feedback: i.feedback,
        candidate: i.candidate
      };
    });

    res.json({ success: true, total: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
}

export async function createInterview(req, res, next) {
  try {
    const { int_date, int_time, int_mode, location, int_status, score, feedback, cand_id } = req.body;

    const nextNum = await getNextSequence('interview', 26);
    const nextId = `INT${String(nextNum).padStart(3, '0')}`;

    const candIdNum = cand_id !== undefined && cand_id !== null && cand_id !== ''
      ? parseInt(cand_id, 10)
      : null;

    const numScore = score !== undefined && score !== '' && score !== null
      ? parseFloat(score)
      : null;

    const cypher = `
      CREATE (i:Interview {
        int_id: $nextId,
        int_date: $int_date,
        int_time: $int_time,
        int_mode: $int_mode,
        location: $location,
        int_status: $int_status,
        score: $score,
        feedback: $feedback
      })
      WITH i
      OPTIONAL MATCH (c:Candidate {cand_id: $candId})
      FOREACH (_ IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
        MERGE (c)-[:HAS_INTERVIEW]->(i)
        SET c.int_id = $nextId
      )
      RETURN i
    `;

    await runQuery(cypher, {
      nextId,
      int_date: int_date || '2026-09-15',
      int_time: int_time || '10:00',
      int_mode: int_mode || 'Online',
      location: location || 'Virtual',
      int_status: int_status || 'Scheduled',
      score: numScore,
      feedback: feedback || 'Technical interview scheduled',
      candId: candIdNum
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'SCHEDULE_INTERVIEW',
      details: `Scheduled Interview #${nextId} in Neo4j Graph Database`
    });

    res.status(201).json({ success: true, message: 'Interview scheduled in Neo4j.', data: { int_id: nextId } });
  } catch (error) {
    next(error);
  }
}

export async function updateInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { int_date, int_time, int_mode, location, int_status, score, feedback, cand_id } = req.body;

    const candIdNum = cand_id !== undefined && cand_id !== null && cand_id !== ''
      ? parseInt(cand_id, 10)
      : null;

    const numScore = score !== undefined && score !== '' && score !== null
      ? parseFloat(score)
      : null;

    const cypher = `
      MATCH (i:Interview {int_id: $id})
      SET i.int_date = coalesce($int_date, i.int_date),
          i.int_time = coalesce($int_time, i.int_time),
          i.int_mode = coalesce($int_mode, i.int_mode),
          i.location = coalesce($location, i.location),
          i.int_status = coalesce($int_status, i.int_status),
          i.score = $score,
          i.feedback = coalesce($feedback, i.feedback)
      WITH i
      OPTIONAL MATCH (oldC:Candidate)-[r:HAS_INTERVIEW]->(i)
      WHERE $candId IS NOT NULL AND oldC.cand_id <> $candId
      DELETE r
      SET oldC.int_id = NULL
      WITH i
      OPTIONAL MATCH (newC:Candidate {cand_id: $candId})
      FOREACH (_ IN CASE WHEN newC IS NOT NULL THEN [1] ELSE [] END |
        MERGE (newC)-[:HAS_INTERVIEW]->(i)
        SET newC.int_id = $id
      )
      RETURN i
    `;

    await runQuery(cypher, {
      id,
      int_date: int_date ?? null,
      int_time: int_time ?? null,
      int_mode: int_mode ?? null,
      location: location ?? null,
      int_status: int_status ?? null,
      score: numScore,
      feedback: feedback ?? null,
      candId: candIdNum
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_INTERVIEW',
      details: `Updated Interview #${id} in Neo4j Graph Database`
    });

    res.json({ success: true, message: `Interview #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteInterview(req, res, next) {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (i:Interview {int_id: $id})
      OPTIONAL MATCH (c:Candidate)-[:HAS_INTERVIEW]->(i)
      SET c.int_id = NULL
      DETACH DELETE i
      RETURN count(i) AS deletedCount
    `;

    await runQuery(cypher, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_INTERVIEW',
      details: `Deleted Interview #${id} from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Interview #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
