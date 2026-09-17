import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getSkills(req, res, next) {
  try {
    const sql = `
      SELECT s.skill_id, s.skill_name,
             sd.skill_category, sd.description,
             (SELECT COUNT(*) FROM Requires WHERE skill_id = s.skill_id) AS demand_count,
             (SELECT COUNT(*) FROM Has WHERE skill_id = s.skill_id) AS candidate_count
      FROM Skill s
      LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name
      ORDER BY s.skill_id ASC
    `;

    const result = await executeQuery(sql);

    const skills = result.rows.map(r => ({
      skill_id: r.SKILL_ID ?? r.skill_id,
      skill_name: r.SKILL_NAME ?? r.skill_name,
      skill_category: r.SKILL_CATEGORY ?? r.skill_category ?? 'General',
      description: r.DESCRIPTION ?? r.description ?? '',
      demandCount: r.DEMAND_COUNT ?? r.demand_count ?? 0,
      candidatesWithSkill: r.CANDIDATE_COUNT ?? r.candidate_count ?? 0
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

    const maxIdResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(skill_id, 2))), 0) + 1 AS next_num FROM Skill');
    const nextNum = maxIdResult.rows[0]?.NEXT_NUM ?? maxIdResult.rows[0]?.next_num ?? 6;
    const nextId = `S00${nextNum}`;

    await executeQuery(`
      INSERT INTO Skill (skill_id, skill_name)
      VALUES (:nextId, :skill_name)
    `, { nextId, skill_name });

    const detailCheck = await executeQuery(`SELECT skill_name FROM Skill_Details WHERE skill_name = :skill_name`, { skill_name });
    if (detailCheck.rows.length === 0) {
      await executeQuery(`
        INSERT INTO Skill_Details (skill_name, skill_category, description)
        VALUES (:skill_name, :skill_category, :description)
      `, {
        skill_name,
        skill_category: skill_category || 'General',
        description: description || 'Technical skill definition'
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_SKILL',
      details: `Created Skill #${nextId} (${skill_name}) in Oracle Database`
    });

    res.status(201).json({ success: true, message: 'Skill created in Oracle.', data: { skill_id: nextId, skill_name } });
  } catch (error) {
    next(error);
  }
}

export async function deleteSkill(req, res, next) {
  try {
    const { id } = req.params;

    // Get skill name first
    const skillRes = await executeQuery(`SELECT skill_name FROM Skill WHERE skill_id = :id OR skill_name = :id`, { id });
    const skillName = skillRes.rows[0]?.SKILL_NAME || skillRes.rows[0]?.skill_name || id;

    await executeQuery(`DELETE FROM Has WHERE skill_id = :id`, { id });
    await executeQuery(`DELETE FROM Requires WHERE skill_id = :id`, { id });
    await executeQuery(`DELETE FROM Skill_Details WHERE skill_name = :skillName`, { skillName });
    await executeQuery(`DELETE FROM Skill WHERE skill_id = :id OR skill_name = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_SKILL',
      details: `Deleted Skill #${id} (${skillName}) from Oracle Database`
    });

    res.json({ success: true, message: `Skill #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
