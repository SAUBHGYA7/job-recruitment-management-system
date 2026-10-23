import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getCandidates(req, res, next) {
  try {
    const { search, gender } = req.query;

    const trimmedSearch = typeof search === 'string' ? search.trim() : null;

    const cypher = `
      MATCH (c:Candidate)
      WHERE ($gender IS NULL OR $gender = 'ALL' OR toLower(c.gender) = toLower($gender))
      OPTIONAL MATCH (c)-[:HAS_EDUCATION]->(e:Education)
      OPTIONAL MATCH (c)-[:SUBMITTED_APPLICATION]->(a:Application)
      OPTIONAL MATCH (c)-[:HAS_SKILL]->(sk:Skill)
      WITH c, e, a, collect(DISTINCT toLower(sk.skill_name)) AS skills
      WHERE ($search IS NULL OR $search = '' OR
             toLower(c.fname) CONTAINS toLower($search) OR
             toLower(c.lname) CONTAINS toLower($search) OR
             toLower(coalesce(c.mname, '')) CONTAINS toLower($search) OR
             toLower(c.fname + ' ' + coalesce(c.mname + ' ', '') + c.lname) CONTAINS toLower($search) OR
             toLower(c.fname + ' ' + c.lname) CONTAINS toLower($search) OR
             toLower(coalesce(c.city, '')) CONTAINS toLower($search) OR
             toLower(coalesce(c.street, '')) CONTAINS toLower($search) OR
             toString(c.cand_id) CONTAINS $search OR
             toLower(coalesce(e.specialization, '')) CONTAINS toLower($search) OR
             toLower(coalesce(e.degree, '')) CONTAINS toLower($search) OR
             toLower(coalesce(c.candidate_type, '')) CONTAINS toLower($search) OR
             any(s IN skills WHERE s CONTAINS toLower($search)))
      RETURN c, e, a
      ORDER BY c.cand_id ASC
    `;

    const result = await runQuery(cypher, {
      gender: gender || null,
      search: trimmedSearch || null
    });

    const candidates = result.rows.map(r => {
      const c = r.c || {};
      const e = r.e || {};
      const a = r.a || {};

      const emails = Array.isArray(c.emails) ? c.emails : (c.emails ? [c.emails] : []);
      const phones = Array.isArray(c.phones) ? c.phones : (c.phones ? [c.phones] : []);

      return {
        cand_id: c.cand_id,
        fname: c.fname,
        mname: c.mname || '',
        lname: c.lname,
        fullName: `${c.fname || ''} ${c.mname ? c.mname + ' ' : ''}${c.lname || ''}`.trim(),
        dob: c.dob || null,
        gender: c.gender || 'Unknown',
        reg_date: c.reg_date || null,
        edu_id: e.edu_id || c.edu_id || null,
        app_id: a.app_id || c.app_id || null,
        dep_id: c.dep_id || null,
        int_id: c.int_id || null,
        candidate_type: c.candidate_type || (c.current_company ? 'Experienced' : 'Fresher'),
        address: {
          house_no: c.house_no ? String(c.house_no) : '',
          city: c.city || '',
          street: c.street || ''
        },
        emails,
        phones,
        education: {
          cgpa: e.cgpa !== undefined ? e.cgpa : null,
          specialization: e.specialization || ''
        },
        application: {
          app_status: a.app_status || '',
          final_result: a.final_result || ''
        }
      };
    });

    res.json({
      success: true,
      total: candidates.length,
      data: candidates
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateById(req, res, next) {
  try {
    const { id } = req.params;
    const candId = parseInt(id, 10);

    const cypher = `
      MATCH (c:Candidate {cand_id: $candId})
      OPTIONAL MATCH (c)-[:HAS_EDUCATION]->(ed:Education)
      OPTIONAL MATCH (c)-[:SUBMITTED_APPLICATION]->(app:Application)
      OPTIONAL MATCH (c)-[:HAS_DEPENDENT]->(dep:Dependent)
      OPTIONAL MATCH (c)-[:HAS_INTERVIEW]->(intw:Interview)
      OPTIONAL MATCH (c)-[h:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (c)-[:HAS_EXPERIENCE]->(exp:Experience)
      OPTIONAL MATCH (c)-[:APPLIED_FOR]->(j:Job)
      RETURN c, ed, app, dep, intw,
             collect(DISTINCT {
               skill_id: s.skill_id,
               skill_name: s.skill_name,
               pgd_level: h.pgd_level,
               years_of_exp: h.years_of_exp,
               skill_category: s.skill_category,
               description: s.description
             }) AS skills,
             collect(DISTINCT {
               exp_id: exp.exp_id,
               comp_name: exp.comp_name,
               start_date: exp.start_date,
               end_date: exp.end_date,
               job_title: exp.job_title
             }) AS experience,
             collect(DISTINCT {
               job_key: j.job_key,
               job_id: j.job_id,
               job_title: j.job_title,
               job_status: j.job_status,
               salary: j.salary
             }) AS appliedJobs
    `;

    const result = await runQuery(cypher, { candId });

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Candidate with ID ${id} not found.` });
    }

    const row = result.rows[0];
    const c = row.c || {};
    const ed = row.ed || {};
    const app = row.app || {};
    const dep = row.dep || {};
    const intw = row.intw || {};

    const emails = Array.isArray(c.emails) ? c.emails : (c.emails ? [c.emails] : []);
    const phones = Array.isArray(c.phones) ? c.phones : (c.phones ? [c.phones] : []);

    const skills = (row.skills || []).filter(s => s && s.skill_id);
    const experience = (row.experience || []).filter(e => e && e.exp_id);
    const appliedJobs = (row.appliedJobs || []).filter(j => j && j.job_key);

    res.json({
      success: true,
      data: {
        cand_id: c.cand_id,
        fname: c.fname,
        mname: c.mname || '',
        lname: c.lname,
        fullName: `${c.fname || ''} ${c.mname ? c.mname + ' ' : ''}${c.lname || ''}`.trim(),
        dob: c.dob || null,
        gender: c.gender || 'Unknown',
        reg_date: c.reg_date || null,
        candidate_type: c.candidate_type || (c.current_company ? 'Experienced' : 'Fresher'),
        current_company: c.current_company || '',
        total_exp: c.total_exp || null,
        address: {
          house_no: c.house_no ? String(c.house_no) : '',
          city: c.city || '',
          street: c.street || ''
        },
        emails,
        phones,
        education: {
          edu_id: ed.edu_id || c.edu_id || null,
          cgpa: ed.cgpa !== undefined ? ed.cgpa : null,
          specialization: ed.specialization || ''
        },
        application: {
          app_id: app.app_id || c.app_id || null,
          app_status: app.app_status || '',
          final_result: app.final_result || ''
        },
        dependent: {
          dep_id: dep.dep_id || c.dep_id || null,
          dob: dep.dob || null,
          relationship: dep.relationship || ''
        },
        interview: {
          int_id: intw.int_id || c.int_id || null,
          int_date: intw.int_date || null,
          int_time: intw.int_time || null,
          int_mode: intw.int_mode || '',
          location: intw.location || '',
          int_status: intw.int_status || '',
          score: intw.score !== undefined ? intw.score : null,
          feedback: intw.feedback || ''
        },
        skills,
        experience,
        appliedJobs
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createCandidate(req, res, next) {
  try {
    const {
      fname, mname, lname, dob, gender, house_no, city, street, email, phone,
      edu_id, app_id, dep_id, int_id,
      candidate_type, current_company, total_exp, years_experience
    } = req.body;

    if (!fname || !lname) {
      return res.status(400).json({ success: false, message: 'First name and Last name are required.' });
    }

    // Atomic sequence increment prevents race conditions in concurrent execution
    const nextId = await getNextSequence('candidate', 126);
    const today = new Date().toISOString().split('T')[0];

    const emails = Array.isArray(email) ? email : (email ? String(email).split(',').map(e => e.trim()).filter(Boolean) : []);
    const phones = Array.isArray(phone) ? phone : (phone ? String(phone).split(',').map(p => p.trim()).filter(Boolean) : []);

    const typeVal = candidate_type || (current_company ? 'Experienced' : 'Fresher');
    const expYears = total_exp !== undefined ? total_exp : (years_experience !== undefined ? years_experience : null);

    const cypher = `
      CREATE (c:Candidate {
        cand_id: $nextId,
        fname: $fname,
        mname: $mname,
        lname: $lname,
        dob: $dob,
        gender: $gender,
        reg_date: $today,
        house_no: $houseNo,
        city: $city,
        street: $street,
        emails: $emails,
        phones: $phones,
        edu_id: $eduId,
        app_id: $appId,
        dep_id: $depId,
        int_id: $intId,
        candidate_type: $typeVal,
        current_company: $currentCompany,
        total_exp: $expYears
      })
      WITH c
      FOREACH (_ IN CASE WHEN $typeVal = 'Experienced' THEN [1] ELSE [] END | SET c:Experienced)
      FOREACH (_ IN CASE WHEN $typeVal = 'Fresher' THEN [1] ELSE [] END | SET c:Fresher)
      FOREACH (_ IN CASE WHEN $typeVal = 'Freelancer' THEN [1] ELSE [] END | SET c:Freelancer)
      WITH c
      OPTIONAL MATCH (ed:Education {edu_id: $eduId})
      FOREACH (_ IN CASE WHEN ed IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_EDUCATION]->(ed))
      WITH c
      OPTIONAL MATCH (app:Application {app_id: $appId})
      FOREACH (_ IN CASE WHEN app IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:SUBMITTED_APPLICATION]->(app))
      WITH c
      OPTIONAL MATCH (dep:Dependent {dep_id: $depId})
      FOREACH (_ IN CASE WHEN dep IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_DEPENDENT]->(dep))
      WITH c
      OPTIONAL MATCH (intw:Interview {int_id: $intId})
      FOREACH (_ IN CASE WHEN intw IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_INTERVIEW]->(intw))
      RETURN c.cand_id AS cand_id
    `;

    await runQuery(cypher, {
      nextId,
      fname,
      mname: mname || '',
      lname,
      dob: dob || '2001-01-01',
      gender: gender || 'Male',
      today,
      houseNo: house_no ? String(house_no) : '',
      city: city || '',
      street: street || '',
      emails,
      phones,
      eduId: edu_id || 'ED001',
      appId: app_id || 'APP001',
      depId: dep_id || 'D001',
      intId: int_id || 'INT001',
      typeVal,
      currentCompany: current_company || null,
      expYears: expYears !== null ? parseInt(expYears, 10) : null
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_CANDIDATE',
      details: `Created Candidate #${nextId} (${fname} ${lname}) in Neo4j Graph Database`
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created in Neo4j Graph Database.',
      data: { cand_id: nextId, fname, lname }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCandidate(req, res, next) {
  try {
    const { id } = req.params;
    const candId = parseInt(id, 10);
    const { fname, mname, lname, dob, gender, house_no, city, street, email, phone, edu_id, app_id, dep_id, int_id } = req.body;

    const cypher = `
      MATCH (c:Candidate {cand_id: $candId})
      SET c.fname = coalesce($fname, c.fname),
          c.mname = CASE WHEN $mname IS NOT NULL THEN $mname ELSE c.mname END,
          c.lname = coalesce($lname, c.lname),
          c.dob = coalesce($dob, c.dob),
          c.gender = coalesce($gender, c.gender),
          c.house_no = CASE WHEN $houseNo IS NOT NULL THEN $houseNo ELSE c.house_no END,
          c.city = CASE WHEN $city IS NOT NULL THEN $city ELSE c.city END,
          c.street = CASE WHEN $street IS NOT NULL THEN $street ELSE c.street END,
          c.emails = CASE WHEN $emails IS NOT NULL THEN $emails ELSE c.emails END,
          c.phones = CASE WHEN $phones IS NOT NULL THEN $phones ELSE c.phones END,
          c.edu_id = coalesce($eduId, c.edu_id),
          c.app_id = coalesce($appId, c.app_id),
          c.dep_id = coalesce($depId, c.dep_id),
          c.int_id = coalesce($intId, c.int_id)
      WITH c
      OPTIONAL MATCH (c)-[r_ed:HAS_EDUCATION]->()
      DELETE r_ed
      WITH c
      OPTIONAL MATCH (new_ed:Education {edu_id: c.edu_id})
      FOREACH (_ IN CASE WHEN new_ed IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_EDUCATION]->(new_ed))
      WITH c
      OPTIONAL MATCH (c)-[r_app:SUBMITTED_APPLICATION]->()
      DELETE r_app
      WITH c
      OPTIONAL MATCH (new_app:Application {app_id: c.app_id})
      FOREACH (_ IN CASE WHEN new_app IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:SUBMITTED_APPLICATION]->(new_app))
      WITH c
      OPTIONAL MATCH (c)-[r_dep:HAS_DEPENDENT]->()
      DELETE r_dep
      WITH c
      OPTIONAL MATCH (new_dep:Dependent {dep_id: c.dep_id})
      FOREACH (_ IN CASE WHEN new_dep IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_DEPENDENT]->(new_dep))
      WITH c
      OPTIONAL MATCH (c)-[r_int:HAS_INTERVIEW]->()
      DELETE r_int
      WITH c
      OPTIONAL MATCH (new_int:Interview {int_id: c.int_id})
      FOREACH (_ IN CASE WHEN new_int IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:HAS_INTERVIEW]->(new_int))
      RETURN c.cand_id AS cand_id
    `;

    const emails = email !== undefined
      ? (Array.isArray(email) ? email : String(email).split(',').map(e => e.trim()).filter(Boolean))
      : null;
    const phones = phone !== undefined
      ? (Array.isArray(phone) ? phone : String(phone).split(',').map(p => p.trim()).filter(Boolean))
      : null;

    const result = await runQuery(cypher, {
      candId,
      fname: fname || null,
      mname: mname !== undefined ? mname : null,
      lname: lname || null,
      dob: dob || null,
      gender: gender || null,
      houseNo: house_no !== undefined ? String(house_no) : null,
      city: city !== undefined ? city : null,
      street: street !== undefined ? street : null,
      emails,
      phones,
      eduId: edu_id || null,
      appId: app_id || null,
      depId: dep_id || null,
      intId: int_id || null
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Candidate with ID ${id} not found.` });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_CANDIDATE',
      details: `Updated Candidate #${candId} in Neo4j Graph Database`
    });

    res.json({ success: true, message: 'Candidate updated successfully in Neo4j.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidate(req, res, next) {
  try {
    const { id } = req.params;
    const candId = parseInt(id, 10);

    // Destructive Deletion Safeguard:
    // Delete reified child Assessment and Referral entities belonging exclusively to this candidate,
    // then detach and delete the candidate node without leaving dangling intermediary nodes.
    const cypher = `
      MATCH (c:Candidate {cand_id: $candId})
      OPTIONAL MATCH (c)-[:UNDERWENT]->(ass:Assessment)
      WITH c, collect(DISTINCT ass) AS assessments
      OPTIONAL MATCH (c)-[:HAS_REFERRAL]->(ref:Referral)
      WITH c, assessments, collect(DISTINCT ref) AS referrals
      FOREACH (a IN assessments | DETACH DELETE a)
      FOREACH (r IN referrals | DETACH DELETE r)
      DETACH DELETE c
      RETURN count(c) AS deletedCount
    `;

    const result = await runQuery(cypher, { candId });
    const deletedCount = result.rows[0]?.deletedCount || 0;

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: `Candidate with ID ${id} not found.` });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_CANDIDATE',
      details: `Deleted Candidate #${candId} from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Candidate #${candId} deleted successfully from Neo4j.` });
  } catch (error) {
    next(error);
  }
}
