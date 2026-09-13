import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getCandidates(req, res, next) {
  try {
    const { search, gender } = req.query;

    let sql = `
      SELECT c.cand_id, c.fname, c.mname, c.lname, 
             TO_CHAR(c.dob, 'YYYY-MM-DD') AS dob, c.gender, 
             TO_CHAR(c.reg_date, 'YYYY-MM-DD') AS reg_date,
             c.edu_id, c.app_id, c.dep_id, c.int_id,
             ca.house_no, ca.city, ca.street,
             (SELECT LISTAGG(email, ', ') WITHIN GROUP (ORDER BY email) FROM Candidate_Email WHERE cand_id = c.cand_id) AS emails,
             (SELECT LISTAGG(phone, ', ') WITHIN GROUP (ORDER BY phone) FROM Candidate_Phone WHERE cand_id = c.cand_id) AS phones,
             e.cgpa, e.specialization,
             a.app_status, a.final_result
      FROM Candidate c
      LEFT JOIN Candidate_Address ca ON ca.cand_id = c.cand_id
      LEFT JOIN Education e ON e.edu_id = c.edu_id
      LEFT JOIN Application a ON a.app_id = c.app_id
      WHERE 1=1
    `;

    const binds = {};

    if (gender && gender !== 'ALL') {
      sql += ` AND LOWER(c.gender) = LOWER(:gender)`;
      binds.gender = gender;
    }

    if (search) {
      sql += ` AND (
        LOWER(c.fname) LIKE '%' || LOWER(:search) || '%' OR 
        LOWER(c.lname) LIKE '%' || LOWER(:search) || '%' OR
        LOWER(ca.city) LIKE '%' || LOWER(:search) || '%' OR
        TO_CHAR(c.cand_id) LIKE '%' || :search || '%' OR
        LOWER(e.specialization) LIKE '%' || LOWER(:search) || '%'
      )`;
      binds.search = search;
    }

    sql += ` ORDER BY c.cand_id ASC`;

    const result = await executeQuery(sql, binds);

    const candidates = result.rows.map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      fname: r.FNAME ?? r.fname,
      mname: r.MNAME ?? r.mname ?? '',
      lname: r.LNAME ?? r.lname,
      fullName: `${r.FNAME ?? r.fname} ${r.MNAME ? (r.MNAME ?? r.mname) + ' ' : ''}${r.LNAME ?? r.lname}`,
      dob: r.DOB ?? r.dob,
      gender: r.GENDER ?? r.gender,
      reg_date: r.REG_DATE ?? r.reg_date,
      edu_id: r.EDU_ID ?? r.edu_id,
      app_id: r.APP_ID ?? r.app_id,
      dep_id: r.DEP_ID ?? r.dep_id,
      int_id: r.INT_ID ?? r.int_id,
      address: {
        house_no: r.HOUSE_NO ?? r.house_no ?? '',
        city: r.CITY ?? r.city ?? '',
        street: r.STREET ?? r.street ?? ''
      },
      emails: (r.EMAILS ?? r.emails ?? '').split(', ').filter(Boolean),
      phones: (r.PHONES ?? r.phones ?? '').split(', ').filter(Boolean),
      education: {
        cgpa: r.CGPA ?? r.cgpa,
        specialization: r.SPECIALIZATION ?? r.specialization
      },
      application: {
        app_status: r.APP_STATUS ?? r.app_status,
        final_result: r.FINAL_RESULT ?? r.final_result
      }
    }));

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

    const candResult = await executeQuery(
      `SELECT c.cand_id, c.fname, c.mname, c.lname, 
              TO_CHAR(c.dob, 'YYYY-MM-DD') AS dob, c.gender, 
              TO_CHAR(c.reg_date, 'YYYY-MM-DD') AS reg_date,
              c.edu_id, c.app_id, c.dep_id, c.int_id
       FROM Candidate c WHERE c.cand_id = :candId`,
      { candId }
    );

    if (candResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Candidate with ID ${id} not found.` });
    }

    const c = candResult.rows[0];

    const addrRes = await executeQuery(`SELECT house_no, city, street FROM Candidate_Address WHERE cand_id = :candId`, { candId });
    const emailRes = await executeQuery(`SELECT email FROM Candidate_Email WHERE cand_id = :candId`, { candId });
    const phoneRes = await executeQuery(`SELECT phone FROM Candidate_Phone WHERE cand_id = :candId`, { candId });
    const eduRes = await executeQuery(`SELECT edu_id, cgpa, specialization FROM Education WHERE edu_id = :eduId`, { eduId: c.EDU_ID || c.edu_id });
    const appRes = await executeQuery(`SELECT app_id, app_status, final_result FROM Application WHERE app_id = :appId`, { appId: c.APP_ID || c.app_id });
    const depRes = await executeQuery(`SELECT dep_id, TO_CHAR(dob, 'YYYY-MM-DD') AS dob, relationship FROM Dependent WHERE dep_id = :depId`, { depId: c.DEP_ID || c.dep_id });
    const intRes = await executeQuery(`
      SELECT i.int_id, TO_CHAR(i.int_date, 'YYYY-MM-DD') AS int_date, i.int_time,
             id.int_mode, id.location, id.int_status, id.score, id.feedback
      FROM Interview i
      LEFT JOIN Interview_Details id ON id.int_id = i.int_id
      WHERE i.int_id = :intId
    `, { intId: c.INT_ID || c.int_id });

    const skillsRes = await executeQuery(`
      SELECT h.skill_id, s.skill_name, h.pgd_level, h.years_of_exp, sd.skill_category, sd.description
      FROM Has h
      JOIN Skill s ON s.skill_id = h.skill_id
      LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name
      WHERE h.cand_id = :candId
    `, { candId });

    const expRes = await executeQuery(`
      SELECT ec.exp_id, ec.comp_name, TO_CHAR(e.start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(ec.end_date, 'YYYY-MM-DD') AS end_date, e.job_title
      FROM Experience_Candidate ec
      JOIN Experience e ON e.exp_id = ec.exp_id
      WHERE ec.cand_id = :candId
    `, { candId });

    const appliesRes = await executeQuery(`
      SELECT a.job_key, j.job_id, jd.job_title, j.job_status, j.salary
      FROM Applies a
      JOIN Job j ON j.job_key = a.job_key
      JOIN Job_Details jd ON jd.job_key = j.job_key
      WHERE a.cand_id = :candId
    `, { candId });

    res.json({
      success: true,
      data: {
        cand_id: c.CAND_ID ?? c.cand_id,
        fname: c.FNAME ?? c.fname,
        mname: c.MNAME ?? c.mname,
        lname: c.LNAME ?? c.lname,
        fullName: `${c.FNAME ?? c.fname} ${c.MNAME ? (c.MNAME ?? c.mname) + ' ' : ''}${c.LNAME ?? c.lname}`,
        dob: c.DOB ?? c.dob,
        gender: c.GENDER ?? c.gender,
        reg_date: c.REG_DATE ?? c.reg_date,
        address: addrRes.rows[0] || {},
        emails: emailRes.rows.map(r => r.EMAIL || r.email),
        phones: phoneRes.rows.map(r => r.PHONE || r.phone),
        education: eduRes.rows[0] || {},
        application: appRes.rows[0] || {},
        dependent: depRes.rows[0] || {},
        interview: intRes.rows[0] || {},
        skills: skillsRes.rows.map(r => ({
          skill_id: r.SKILL_ID || r.skill_id,
          skill_name: r.SKILL_NAME || r.skill_name,
          pgd_level: r.PGD_LEVEL || r.pgd_level,
          years_of_exp: r.YEARS_OF_EXP || r.years_of_exp,
          skill_category: r.SKILL_CATEGORY || r.skill_category,
          description: r.DESCRIPTION || r.description
        })),
        experience: expRes.rows.map(r => ({
          exp_id: r.EXP_ID || r.exp_id,
          comp_name: r.COMP_NAME || r.comp_name,
          start_date: r.START_DATE || r.start_date,
          end_date: r.END_DATE || r.end_date,
          job_title: r.JOB_TITLE || r.job_title
        })),
        appliedJobs: appliesRes.rows.map(r => ({
          job_key: r.JOB_KEY || r.job_key,
          job_id: r.JOB_ID || r.job_id,
          job_title: r.JOB_TITLE || r.job_title,
          job_status: r.JOB_STATUS || r.job_status,
          salary: r.SALARY || r.salary
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createCandidate(req, res, next) {
  try {
    const { fname, mname, lname, dob, gender, house_no, city, street, email, phone, edu_id, app_id, dep_id, int_id } = req.body;

    if (!fname || !lname) {
      return res.status(400).json({ success: false, message: 'First name and Last name are required.' });
    }

    const maxIdResult = await executeQuery('SELECT NVL(MAX(cand_id), 100) + 1 AS next_id FROM Candidate');
    const nextId = maxIdResult.rows[0]?.NEXT_ID ?? maxIdResult.rows[0]?.next_id ?? 106;

    await executeQuery(`
      INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
      VALUES (:nextId, :fname, :mname, :lname, TO_DATE(:dob, 'YYYY-MM-DD'), :gender, SYSDATE, :edu_id, :app_id, :dep_id, :int_id)
    `, {
      nextId,
      fname,
      mname: mname || null,
      lname,
      dob: dob || '2001-01-01',
      gender: gender || 'Male',
      edu_id: edu_id || 'ED001',
      app_id: app_id || 'APP001',
      dep_id: dep_id || 'D001',
      int_id: int_id || 'INT001'
    });

    if (house_no || city || street) {
      await executeQuery(`
        INSERT INTO Candidate_Address (cand_id, house_no, city, street)
        VALUES (:nextId, :house_no, :city, :street)
      `, { nextId, house_no: house_no || '', city: city || '', street: street || '' });
    }

    if (email) {
      await executeQuery(`
        INSERT INTO Candidate_Email (cand_id, email)
        VALUES (:nextId, :email)
      `, { nextId, email });
    }

    if (phone) {
      await executeQuery(`
        INSERT INTO Candidate_Phone (cand_id, phone)
        VALUES (:nextId, :phone)
      `, { nextId, phone });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_CANDIDATE',
      details: `Created Candidate #${nextId} (${fname} ${lname}) in Oracle Database`
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created in Oracle Database.',
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
    const { fname, mname, lname, dob, gender, house_no, city, street } = req.body;

    await executeQuery(`
      UPDATE Candidate
      SET fname = :fname, mname = :mname, lname = :lname, gender = :gender, dob = TO_DATE(:dob, 'YYYY-MM-DD')
      WHERE cand_id = :candId
    `, {
      candId,
      fname,
      mname: mname || null,
      lname,
      gender,
      dob: dob || '2001-01-01'
    });

    if (house_no || city || street) {
      const addrCheck = await executeQuery(`SELECT cand_id FROM Candidate_Address WHERE cand_id = :candId`, { candId });
      if (addrCheck.rows.length > 0) {
        await executeQuery(`
          UPDATE Candidate_Address SET house_no = :house_no, city = :city, street = :street WHERE cand_id = :candId
        `, { candId, house_no: house_no || '', city: city || '', street: street || '' });
      } else {
        await executeQuery(`
          INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (:candId, :house_no, :city, :street)
        `, { candId, house_no: house_no || '', city: city || '', street: street || '' });
      }
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_CANDIDATE',
      details: `Updated Candidate #${candId} in Oracle Database`
    });

    res.json({ success: true, message: 'Candidate updated successfully in Oracle.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidate(req, res, next) {
  try {
    const { id } = req.params;
    const candId = parseInt(id, 10);

    await executeQuery(`DELETE FROM Candidate WHERE cand_id = :candId`, { candId });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_CANDIDATE',
      details: `Deleted Candidate #${candId} from Oracle Database`
    });

    res.json({ success: true, message: `Candidate #${candId} deleted successfully from Oracle.` });
  } catch (error) {
    next(error);
  }
}
