import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

// ─── CANDIDATE SKILLS (Relations #23 & #31: HAS) ──────────────────────────────────────
export async function getCandidateSkills(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT h.cand_id, h.skill_id, h.pgd_level, h.years_of_exp,
             c.fname, c.lname,
             s.skill_name, sd.skill_category
      FROM Has h
      LEFT JOIN Candidate c ON c.cand_id = h.cand_id
      LEFT JOIN Skill s ON s.skill_id = h.skill_id
      LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name
      ORDER BY h.cand_id ASC, h.skill_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      skill_id: r.SKILL_ID ?? r.skill_id,
      pgd_level: r.PGD_LEVEL ?? r.pgd_level ?? 'Intermediate',
      years_of_exp: r.YEARS_OF_EXP !== null && r.YEARS_OF_EXP !== undefined ? Number(r.YEARS_OF_EXP ?? r.years_of_exp) : 2,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      skill_name: r.SKILL_NAME ?? r.skill_name ?? (r.SKILL_ID ?? r.skill_id),
      skill_category: r.SKILL_CATEGORY ?? r.skill_category ?? 'General'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.skill_name || '').toLowerCase().includes(q) ||
        (r.pgd_level || '').toLowerCase().includes(q) ||
        (r.skill_category || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createCandidateSkill(req, res, next) {
  try {
    const { cand_id, skill_id, pgd_level, years_of_exp } = req.body;
    if (!cand_id || !skill_id) {
      return res.status(400).json({ success: false, message: 'Candidate and Skill are required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanLevel = pgd_level || 'Intermediate';
    const cleanExp = years_of_exp ? parseFloat(years_of_exp) : 2;

    await executeQuery(`
      INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp)
      VALUES (:cleanCandId, :skill_id, :cleanLevel, :cleanExp)
    `, { cleanCandId, skill_id, cleanLevel, cleanExp });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_CANDIDATE_SKILL',
      details: `Associated Candidate #${cleanCandId} with Skill #${skill_id} (${cleanLevel})`
    });

    res.json({ success: true, message: 'Candidate skill added successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateCandidateSkill(req, res, next) {
  try {
    const { cand_id, skill_id } = req.params;
    const { pgd_level, years_of_exp } = req.body;
    const cleanCandId = parseInt(cand_id, 10);

    await executeQuery(`
      UPDATE Has
      SET pgd_level = :pgd_level, years_of_exp = :years_of_exp
      WHERE cand_id = :cleanCandId AND skill_id = :skill_id
    `, {
      pgd_level: pgd_level || 'Advanced',
      years_of_exp: years_of_exp ? parseFloat(years_of_exp) : 3,
      cleanCandId,
      skill_id
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_CANDIDATE_SKILL',
      details: `Updated Candidate #${cleanCandId} Skill #${skill_id}`
    });

    res.json({ success: true, message: 'Candidate skill updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidateSkill(req, res, next) {
  try {
    const { cand_id, skill_id } = req.params;
    const cleanCandId = parseInt(cand_id, 10);

    await executeQuery(`
      DELETE FROM Has
      WHERE cand_id = :cleanCandId AND skill_id = :skill_id
    `, { cleanCandId, skill_id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_CANDIDATE_SKILL',
      details: `Removed Candidate #${cleanCandId} Skill #${skill_id}`
    });

    res.json({ success: true, message: 'Candidate skill removed successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── JOB SKILL REQUIREMENTS (Relation #24: REQUIRES) ──────────────────────────────────
export async function getJobSkills(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT r.job_key, r.skill_id, r.is_mandatory, r.min_years,
             j.job_id, jd.job_title,
             s.skill_name, sd.skill_category
      FROM Requires r
      LEFT JOIN Job j ON j.job_key = r.job_key
      LEFT JOIN Job_Details jd ON jd.job_key = r.job_key
      LEFT JOIN Skill s ON s.skill_id = r.skill_id
      LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name
      ORDER BY r.job_key ASC, r.skill_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      job_key: r.JOB_KEY ?? r.job_key,
      skill_id: r.SKILL_ID ?? r.skill_id,
      is_mandatory: r.IS_MANDATORY ?? r.is_mandatory ?? 'Y',
      min_years: r.MIN_YEARS !== null && r.MIN_YEARS !== undefined ? Number(r.MIN_YEARS ?? r.min_years) : 1,
      job_id: r.JOB_ID ?? r.job_id ?? 'J001',
      job_title: r.JOB_TITLE ?? r.job_title ?? `Job #${r.JOB_KEY ?? r.job_key}`,
      skill_name: r.SKILL_NAME ?? r.skill_name ?? (r.SKILL_ID ?? r.skill_id),
      skill_category: r.SKILL_CATEGORY ?? r.skill_category ?? 'Engineering'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.job_title || '').toLowerCase().includes(q) ||
        (r.skill_name || '').toLowerCase().includes(q) ||
        (r.job_id || '').toLowerCase().includes(q) ||
        (r.skill_category || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createJobSkill(req, res, next) {
  try {
    const { job_key, skill_id, is_mandatory, min_years } = req.body;
    if (!job_key || !skill_id) {
      return res.status(400).json({ success: false, message: 'Job and Skill are required.' });
    }

    const cleanJobKey = parseInt(job_key, 10);
    const cleanMandatory = is_mandatory || 'Y';
    const cleanYears = min_years ? parseFloat(min_years) : 2;

    await executeQuery(`
      INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years)
      VALUES (:cleanJobKey, :skill_id, :cleanMandatory, :cleanYears)
    `, { cleanJobKey, skill_id, cleanMandatory, cleanYears });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_JOB_SKILL',
      details: `Added Skill Requirement #${skill_id} to Job #${cleanJobKey}`
    });

    res.json({ success: true, message: 'Job skill requirement added successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateJobSkill(req, res, next) {
  try {
    const { job_key, skill_id } = req.params;
    const { is_mandatory, min_years } = req.body;
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      UPDATE Requires
      SET is_mandatory = :is_mandatory, min_years = :min_years
      WHERE job_key = :cleanJobKey AND skill_id = :skill_id
    `, {
      is_mandatory: is_mandatory || 'Y',
      min_years: min_years ? parseFloat(min_years) : 2,
      cleanJobKey,
      skill_id
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_JOB_SKILL',
      details: `Updated Job #${cleanJobKey} Skill #${skill_id}`
    });

    res.json({ success: true, message: 'Job skill requirement updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteJobSkill(req, res, next) {
  try {
    const { job_key, skill_id } = req.params;
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      DELETE FROM Requires
      WHERE job_key = :cleanJobKey AND skill_id = :skill_id
    `, { cleanJobKey, skill_id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_JOB_SKILL',
      details: `Removed Job #${cleanJobKey} Skill #${skill_id}`
    });

    res.json({ success: true, message: 'Job skill requirement removed successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── SKILL ASSESSMENTS (Relation #25: ASSESSED_FOR) ───────────────────────────────────
export async function getAssessments(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT af.cand_id, af.job_key, af.skill_id, af.match_per, af.ass_date, af.ass_score,
             c.fname, c.lname,
             jd.job_title, j.job_id,
             s.skill_name
      FROM Assessed_For af
      LEFT JOIN Candidate c ON c.cand_id = af.cand_id
      LEFT JOIN Job j ON j.job_key = af.job_key
      LEFT JOIN Job_Details jd ON jd.job_key = af.job_key
      LEFT JOIN Skill s ON s.skill_id = af.skill_id
      ORDER BY af.cand_id ASC, af.job_key ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      job_key: r.JOB_KEY ?? r.job_key,
      skill_id: r.SKILL_ID ?? r.skill_id,
      match_pct: r.MATCH_PER !== null && r.MATCH_PER !== undefined ? Number(r.MATCH_PER ?? r.match_per) : 85,
      assessment_score: r.ASS_SCORE !== null && r.ASS_SCORE !== undefined ? Number(r.ASS_SCORE ?? r.ass_score) : 80,
      assessment_date: (r.ASS_DATE ?? r.ass_date ?? '2026-08-20').toString().split('T')[0],
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      job_title: r.JOB_TITLE ?? r.job_title ?? `Job #${r.JOB_KEY ?? r.job_key}`,
      skill_name: r.SKILL_NAME ?? r.skill_name ?? (r.SKILL_ID ?? r.skill_id)
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.job_title || '').toLowerCase().includes(q) ||
        (r.skill_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createAssessment(req, res, next) {
  try {
    const { cand_id, job_key, skill_id, match_pct, assessment_score, assessment_date } = req.body;
    if (!cand_id || !job_key || !skill_id) {
      return res.status(400).json({ success: false, message: 'Candidate, Job, and Skill are required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);
    const cleanMatch = match_pct ? parseFloat(match_pct) : 85;
    const cleanScore = assessment_score ? parseFloat(assessment_score) : 80;
    const cleanDate = assessment_date || '2026-08-25';

    await executeQuery(`
      INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
      VALUES (:cleanCandId, :cleanJobKey, :skill_id, :cleanMatch, TO_DATE(:cleanDate, 'YYYY-MM-DD'), :cleanScore)
    `, { cleanCandId, cleanJobKey, skill_id, cleanMatch, cleanDate, cleanScore });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_ASSESSMENT',
      details: `Created Assessment for Candidate #${cleanCandId} Job #${cleanJobKey} Skill #${skill_id} (Score: ${cleanScore})`
    });

    res.json({ success: true, message: 'Skill assessment recorded successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateAssessment(req, res, next) {
  try {
    const { cand_id, job_key, skill_id } = req.params;
    const { match_pct, assessment_score, assessment_date } = req.body;

    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      UPDATE Assessed_For
      SET match_per = :match_pct, ass_score = :assessment_score, ass_date = TO_DATE(:assessment_date, 'YYYY-MM-DD')
      WHERE cand_id = :cleanCandId AND job_key = :cleanJobKey AND skill_id = :skill_id
    `, {
      match_pct: match_pct ? parseFloat(match_pct) : 85,
      assessment_score: assessment_score ? parseFloat(assessment_score) : 80,
      assessment_date: assessment_date || '2026-08-25',
      cleanCandId,
      cleanJobKey,
      skill_id
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_ASSESSMENT',
      details: `Updated Assessment for Candidate #${cleanCandId} Job #${cleanJobKey}`
    });

    res.json({ success: true, message: 'Skill assessment updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssessment(req, res, next) {
  try {
    const { cand_id, job_key, skill_id } = req.params;
    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      DELETE FROM Assessed_For
      WHERE cand_id = :cleanCandId AND job_key = :cleanJobKey AND skill_id = :skill_id
    `, { cleanCandId, cleanJobKey, skill_id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_ASSESSMENT',
      details: `Deleted Assessment for Candidate #${cleanCandId} Job #${cleanJobKey}`
    });

    res.json({ success: true, message: 'Skill assessment removed successfully.' });
  } catch (error) {
    next(error);
  }
}

// ─── CANDIDATE–JOB MATCHES (Relation #26: MATCHED_TO) ─────────────────────────────────
export async function getMatches(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT m.match_id, m.cand_id, m.job_key, m.match_date,
             c.fname, c.lname,
             jd.job_title, j.job_id, j.salary
      FROM Matched_To m
      LEFT JOIN Candidate c ON c.cand_id = m.cand_id
      LEFT JOIN Job j ON j.job_key = m.job_key
      LEFT JOIN Job_Details jd ON jd.job_key = m.job_key
      ORDER BY m.match_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      match_id: r.MATCH_ID ?? r.match_id,
      cand_id: r.CAND_ID ?? r.cand_id,
      job_key: r.JOB_KEY ?? r.job_key,
      match_date: (r.MATCH_DATE ?? r.match_date ?? '2026-08-15').toString().split('T')[0],
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      job_title: r.JOB_TITLE ?? r.job_title ?? `Job #${r.JOB_KEY ?? r.job_key}`,
      salary: r.SALARY ?? r.salary ?? 75000
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.match_id || '').toLowerCase().includes(q) ||
        (r.candidate_name || '').toLowerCase().includes(q) ||
        (r.job_title || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createMatch(req, res, next) {
  try {
    const { cand_id, job_key, match_date } = req.body;
    if (!cand_id || !job_key) {
      return res.status(400).json({ success: false, message: 'Candidate and Job are required.' });
    }

    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(match_id, 2))), 0) + 1 AS next_num FROM Matched_To');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 21;
    const nextMatchId = `M${String(nextNum).padStart(3, '0')}`;

    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);
    const cleanDate = match_date || '2026-08-25';

    await executeQuery(`
      INSERT INTO Matched_To (match_id, cand_id, job_key, match_date)
      VALUES (:nextMatchId, :cleanCandId, :cleanJobKey, TO_DATE(:cleanDate, 'YYYY-MM-DD'))
    `, { nextMatchId, cleanCandId, cleanJobKey, cleanDate });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_MATCH',
      details: `Created Match #${nextMatchId} (Candidate #${cleanCandId} matched to Job #${cleanJobKey})`
    });

    res.json({ success: true, message: `Match ${nextMatchId} generated successfully.`, data: { match_id: nextMatchId } });
  } catch (error) {
    next(error);
  }
}

export async function updateMatch(req, res, next) {
  try {
    const { id } = req.params;
    const { cand_id, job_key, match_date } = req.body;

    const cleanCandId = parseInt(cand_id, 10);
    const cleanJobKey = parseInt(job_key, 10);

    await executeQuery(`
      UPDATE Matched_To
      SET cand_id = :cleanCandId, job_key = :cleanJobKey, match_date = TO_DATE(:match_date, 'YYYY-MM-DD')
      WHERE match_id = :id
    `, {
      cleanCandId,
      cleanJobKey,
      match_date: match_date || '2026-08-25',
      id
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_MATCH',
      details: `Updated Match #${id}`
    });

    res.json({ success: true, message: `Match #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteMatch(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM Matched_To WHERE match_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_MATCH',
      details: `Deleted Match #${id}`
    });

    res.json({ success: true, message: `Match #${id} removed successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── LOCATION PREFERENCES (Relation #30: PREFERS) ─────────────────────────────────────
export async function getPreferences(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT p.cand_id, p.pincode,
             c.fname, c.lname,
             l.state, l.country, sc.city
      FROM Prefers p
      LEFT JOIN Candidate c ON c.cand_id = p.cand_id
      LEFT JOIN Location l ON l.pincode = p.pincode
      LEFT JOIN State_City sc ON sc.state = l.state
      ORDER BY p.cand_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      pincode: r.PINCODE ?? r.pincode,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`,
      city: r.CITY ?? r.city ?? 'Bengaluru',
      state: r.STATE ?? r.state ?? 'Karnataka',
      country: r.COUNTRY ?? r.country ?? 'India'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(q) ||
        String(r.pincode).includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createPreference(req, res, next) {
  try {
    const { cand_id, pincode } = req.body;
    if (!cand_id || !pincode) {
      return res.status(400).json({ success: false, message: 'Candidate and Pincode are required.' });
    }

    const cleanCandId = parseInt(cand_id, 10);
    const cleanPin = parseInt(pincode, 10);

    await executeQuery(`
      INSERT INTO Prefers (cand_id, pincode)
      VALUES (:cleanCandId, :cleanPin)
    `, { cleanCandId, cleanPin });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'ADD_LOCATION_PREFERENCE',
      details: `Saved location preference Pincode #${cleanPin} for Candidate #${cleanCandId}`
    });

    res.json({ success: true, message: 'Location preference saved successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deletePreference(req, res, next) {
  try {
    const { cand_id, pincode } = req.params;
    const cleanCandId = parseInt(cand_id, 10);
    const cleanPin = parseInt(pincode, 10);

    await executeQuery(`
      DELETE FROM Prefers
      WHERE cand_id = :cleanCandId AND pincode = :cleanPin
    `, { cleanCandId, cleanPin });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_LOCATION_PREFERENCE',
      details: `Removed location preference Pincode #${cleanPin} for Candidate #${cleanCandId}`
    });

    res.json({ success: true, message: 'Location preference removed successfully.' });
  } catch (error) {
    next(error);
  }
}
