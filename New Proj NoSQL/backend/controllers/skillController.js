import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getSkills(req, res, next) {
  try {
    const cypher = `
      MATCH (s:Skill)
      OPTIONAL MATCH (j:Job)-[:REQUIRES]->(s)
      WITH s, count(DISTINCT j) AS demand_count
      OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s)
      WITH s, demand_count, count(DISTINCT c) AS candidate_count
      RETURN s.skill_id AS skill_id,
             s.skill_name AS skill_name,
             coalesce(s.skill_category, 'General') AS skill_category,
             coalesce(s.description, '') AS description,
             demand_count AS demandCount,
             candidate_count AS candidatesWithSkill
      ORDER BY s.skill_id ASC
    `;

    const records = await runQuery(cypher);

    const skills = records.map(r => ({
      skill_id: r.skill_id,
      skill_name: r.skill_name,
      skill_category: r.skill_category,
      description: r.description,
      demandCount: Number(r.demandCount || 0),
      candidatesWithSkill: Number(r.candidatesWithSkill || 0)
    }));

    res.json({ success: true, total: skills.length, data: skills });
  } catch (error) {
    next(error);
  }
}

export async function createSkill(req, res, next) {
  try {
    const { skill_name, skill_category, description } = req.body;

    if (!skill_name) {
      return res.status(400).json({ success: false, message: 'Skill name is required.' });
    }

    const nextNum = await getNextSequence('skill', 16);
    const nextId = `S${String(nextNum).padStart(3, '0')}`;

    const cypher = `
      CREATE (s:Skill {
        skill_id: $nextId,
        skill_name: $skill_name,
        skill_category: $skill_category,
        description: $description
      })
      RETURN s
    `;

    await runQuery(cypher, {
      nextId,
      skill_name: skill_name.trim(),
      skill_category: skill_category || 'General',
      description: description || 'Technical skill definition'
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_SKILL',
      details: `Created Skill #${nextId} (${skill_name}) in Neo4j Graph Database`
    });

    res.status(201).json({ success: true, message: 'Skill created in Neo4j.', data: { skill_id: nextId, skill_name } });
  } catch (error) {
    next(error);
  }
}

export async function updateSkill(req, res, next) {
  try {
    const { id } = req.params;
    const { skill_name, skill_category, description } = req.body;

    if (!skill_name) {
      return res.status(400).json({ success: false, message: 'Skill name is required.' });
    }

    const cypher = `
      MATCH (s:Skill {skill_id: $id})
      SET s.skill_name = $skill_name,
          s.skill_category = coalesce($skill_category, s.skill_category),
          s.description = coalesce($description, s.description)
      RETURN s
    `;

    await runQuery(cypher, {
      id,
      skill_name: skill_name.trim(),
      skill_category: skill_category || null,
      description: description || null
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_SKILL',
      details: `Updated Skill #${id} (${skill_name}) in Neo4j Graph Database`
    });

    res.json({ success: true, message: `Skill #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteSkill(req, res, next) {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (s:Skill {skill_id: $id})
      WITH s, s.skill_name AS skillName
      DETACH DELETE s
      RETURN skillName
    `;

    const records = await runQuery(cypher, { id });
    const skillName = records[0]?.skillName || id;

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_SKILL',
      details: `Deleted Skill #${id} (${skillName}) from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Skill #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
