import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

// ─── EDUCATION (Relation #5) ──────────────────────────────────────────────────────────
export async function getEducation(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT e.edu_id, e.cgpa, e.specialization,
             ee.degree, ee.end_year,
             ed.university, ed.start_year,
             c.cand_id, c.fname, c.lname
      FROM Education e
      LEFT JOIN Education_End ee ON ee.edu_id = e.edu_id
      LEFT JOIN Education_Degree ed ON ed.degree = ee.degree
      LEFT JOIN Candidate c ON c.edu_id = e.edu_id
      ORDER BY e.edu_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      edu_id: r.EDU_ID ?? r.edu_id,
      cgpa: r.CGPA !== null && r.CGPA !== undefined ? Number(r.CGPA ?? r.cgpa) : null,
      specialization: r.SPECIALIZATION ?? r.specialization,
      degree: r.DEGREE ?? r.degree ?? 'BTech',
      end_year: r.END_YEAR ?? r.end_year ?? 2023,
      university: r.UNIVERSITY ?? r.university ?? 'Delhi University',
      start_year: r.START_YEAR ?? r.start_year ?? 2019,
      cand_id: r.CAND_ID ?? r.cand_id,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id ?? '101'}`
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.edu_id || '').toLowerCase().includes(q) ||
        (r.specialization || '').toLowerCase().includes(q) ||
        (r.degree || '').toLowerCase().includes(q) ||
        (r.university || '').toLowerCase().includes(q) ||
        (r.candidate_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createEducation(req, res, next) {
  try {
    const { cand_id, degree, cgpa, specialization, university, start_year, end_year } = req.body;
    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(edu_id, 3))), 0) + 1 AS next_num FROM Education');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 26;
    const nextEduId = `ED${String(nextNum).padStart(3, '0')}`;

    const cleanDegree = degree || 'BTech';
    const cleanUniv = university || 'Anna University';
    const cleanStartYear = start_year ? parseInt(start_year, 10) : 2020;
    const cleanEndYear = end_year ? parseInt(end_year, 10) : 2024;
    const cleanCgpa = cgpa ? parseFloat(cgpa) : 8.0;
    const cleanSpec = specialization || 'Computer Science';

    await executeQuery(`
      INSERT INTO Education (edu_id, cgpa, specialization)
      VALUES (:nextEduId, :cleanCgpa, :cleanSpec)
    `, { nextEduId, cleanCgpa, cleanSpec });

    await executeQuery(`
      INSERT INTO Education_Degree (degree, university, start_year)
      VALUES (:cleanDegree, :cleanUniv, :cleanStartYear)
    `, { cleanDegree, cleanUniv, cleanStartYear });

    await executeQuery(`
      INSERT INTO Education_End (edu_id, degree, end_year)
      VALUES (:nextEduId, :cleanDegree, :cleanEndYear)
    `, { nextEduId, cleanDegree, cleanEndYear });

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET edu_id = :nextEduId WHERE cand_id = :cand_id`, { nextEduId, cand_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_EDUCATION',
      details: `Created Education #${nextEduId} (${cleanDegree} - ${cleanSpec}) for Candidate #${cand_id || 'N/A'}`
    });

    res.json({ success: true, message: `Education record ${nextEduId} created successfully.`, data: { edu_id: nextEduId } });
  } catch (error) {
    next(error);
  }
}

export async function updateEducation(req, res, next) {
  try {
    const { id } = req.params;
    const { cand_id, degree, cgpa, specialization, university, start_year, end_year } = req.body;

    if (cgpa !== undefined || specialization !== undefined) {
      await executeQuery(`
        UPDATE Education
        SET cgpa = :cgpa, specialization = :specialization
        WHERE edu_id = :id
      `, {
        cgpa: cgpa !== undefined ? parseFloat(cgpa) : 8.0,
        specialization: specialization || 'Computer Science',
        id
      });
    }

    if (degree !== undefined || end_year !== undefined) {
      await executeQuery(`
        UPDATE Education_End
        SET degree = :degree, end_year = :end_year
        WHERE edu_id = :id
      `, {
        degree: degree || 'BTech',
        end_year: end_year ? parseInt(end_year, 10) : 2024,
        id
      });
    }

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET edu_id = :id WHERE cand_id = :cand_id`, { id, cand_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_EDUCATION',
      details: `Updated Education #${id}`
    });

    res.json({ success: true, message: `Education #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteEducation(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`UPDATE Candidate SET edu_id = NULL WHERE edu_id = :id`, { id });
    await executeQuery(`DELETE FROM Education_End WHERE edu_id = :id`, { id });
    await executeQuery(`DELETE FROM Education WHERE edu_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_EDUCATION',
      details: `Deleted Education #${id}`
    });

    res.json({ success: true, message: `Education #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── EXPERIENCE (Relation #6) ─────────────────────────────────────────────────────────
export async function getExperience(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT e.exp_id, e.start_date, e.job_title,
             ec.cand_id, ec.comp_name, ec.end_date,
             c.fname, c.lname
      FROM Experience e
      LEFT JOIN Experience_Candidate ec ON ec.exp_id = e.exp_id
      LEFT JOIN Candidate c ON c.cand_id = ec.cand_id
      ORDER BY e.exp_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      exp_id: r.EXP_ID ?? r.exp_id,
      job_title: r.JOB_TITLE ?? r.job_title ?? 'Software Developer',
      start_date: (r.START_DATE ?? r.start_date ?? '2021-01-01').toString().split('T')[0],
      end_date: (r.END_DATE ?? r.end_date ?? '2023-01-01').toString().split('T')[0],
      comp_name: r.COMP_NAME ?? r.comp_name ?? 'Tech Corp',
      cand_id: r.CAND_ID ?? r.cand_id ?? 101,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id ?? '101'}`
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.exp_id || '').toLowerCase().includes(q) ||
        (r.job_title || '').toLowerCase().includes(q) ||
        (r.comp_name || '').toLowerCase().includes(q) ||
        (r.candidate_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createExperience(req, res, next) {
  try {
    const { cand_id, comp_name, job_title, start_date, end_date } = req.body;
    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(exp_id, 4))), 0) + 1 AS next_num FROM Experience');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 26;
    const nextExpId = `EXP${String(nextNum).padStart(3, '0')}`;

    const cleanTitle = job_title || 'Software Engineer';
    const cleanComp = comp_name || 'Innovate Labs';
    const cleanCandId = cand_id ? parseInt(cand_id, 10) : 101;
    const cleanStart = start_date || '2021-01-01';
    const cleanEnd = end_date || '2023-01-01';

    await executeQuery(`
      INSERT INTO Experience (exp_id, start_date, job_title)
      VALUES (:nextExpId, TO_DATE(:cleanStart, 'YYYY-MM-DD'), :cleanTitle)
    `, { nextExpId, cleanStart, cleanTitle });

    await executeQuery(`
      INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date)
      VALUES (:nextExpId, :cleanCandId, :cleanComp, TO_DATE(:cleanEnd, 'YYYY-MM-DD'))
    `, { nextExpId, cleanCandId, cleanComp, cleanEnd });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_EXPERIENCE',
      details: `Created Experience #${nextExpId} (${cleanTitle} at ${cleanComp}) for Candidate #${cleanCandId}`
    });

    res.json({ success: true, message: `Experience #${nextExpId} created successfully.`, data: { exp_id: nextExpId } });
  } catch (error) {
    next(error);
  }
}

export async function updateExperience(req, res, next) {
  try {
    const { id } = req.params;
    const { cand_id, comp_name, job_title, start_date, end_date } = req.body;

    if (job_title !== undefined || start_date !== undefined) {
      await executeQuery(`
        UPDATE Experience
        SET job_title = :job_title, start_date = TO_DATE(:start_date, 'YYYY-MM-DD')
        WHERE exp_id = :id
      `, {
        job_title: job_title || 'Software Engineer',
        start_date: start_date || '2021-01-01',
        id
      });
    }

    if (cand_id !== undefined || comp_name !== undefined || end_date !== undefined) {
      await executeQuery(`
        UPDATE Experience_Candidate
        SET cand_id = :cand_id, comp_name = :comp_name, end_date = TO_DATE(:end_date, 'YYYY-MM-DD')
        WHERE exp_id = :id
      `, {
        cand_id: cand_id ? parseInt(cand_id, 10) : 101,
        comp_name: comp_name || 'Tech Corp',
        end_date: end_date || '2023-01-01',
        id
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_EXPERIENCE',
      details: `Updated Experience #${id}`
    });

    res.json({ success: true, message: `Experience #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteExperience(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM Experience_Candidate WHERE exp_id = :id`, { id });
    await executeQuery(`DELETE FROM Experience WHERE exp_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_EXPERIENCE',
      details: `Deleted Experience #${id}`
    });

    res.json({ success: true, message: `Experience #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── DEPENDENT (Relation #7) ──────────────────────────────────────────────────────────
export async function getDependents(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT d.dep_id, d.dob, d.relationship,
             c.cand_id, c.fname, c.lname
      FROM Dependent d
      LEFT JOIN Candidate c ON c.dep_id = d.dep_id
      ORDER BY d.dep_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      dep_id: r.DEP_ID ?? r.dep_id,
      dob: (r.DOB ?? r.dob ?? '2000-01-01').toString().split('T')[0],
      relationship: r.RELATIONSHIP ?? r.relationship ?? 'Child',
      cand_id: r.CAND_ID ?? r.cand_id,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id ?? '101'}`
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.dep_id || '').toLowerCase().includes(q) ||
        (r.relationship || '').toLowerCase().includes(q) ||
        (r.candidate_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createDependent(req, res, next) {
  try {
    const { cand_id, dob, relationship } = req.body;
    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(dep_id, 2))), 0) + 1 AS next_num FROM Dependent');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 26;
    const nextDepId = `D${String(nextNum).padStart(3, '0')}`;

    const cleanDob = dob || '2005-01-01';
    const cleanRel = relationship || 'Child';

    await executeQuery(`
      INSERT INTO Dependent (dep_id, dob, relationship)
      VALUES (:nextDepId, TO_DATE(:cleanDob, 'YYYY-MM-DD'), :cleanRel)
    `, { nextDepId, cleanDob, cleanRel });

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET dep_id = :nextDepId WHERE cand_id = :cand_id`, { nextDepId, cand_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_DEPENDENT',
      details: `Created Dependent #${nextDepId} (${cleanRel}) for Candidate #${cand_id || 'N/A'}`
    });

    res.json({ success: true, message: `Dependent #${nextDepId} created successfully.`, data: { dep_id: nextDepId } });
  } catch (error) {
    next(error);
  }
}

export async function updateDependent(req, res, next) {
  try {
    const { id } = req.params;
    const { cand_id, dob, relationship } = req.body;

    await executeQuery(`
      UPDATE Dependent
      SET dob = TO_DATE(:dob, 'YYYY-MM-DD'), relationship = :relationship
      WHERE dep_id = :id
    `, {
      dob: dob || '2005-01-01',
      relationship: relationship || 'Spouse',
      id
    });

    if (cand_id) {
      await executeQuery(`UPDATE Candidate SET dep_id = :id WHERE cand_id = :cand_id`, { id, cand_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_DEPENDENT',
      details: `Updated Dependent #${id}`
    });

    res.json({ success: true, message: `Dependent #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteDependent(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`UPDATE Candidate SET dep_id = NULL WHERE dep_id = :id`, { id });
    await executeQuery(`DELETE FROM Dependent WHERE dep_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_DEPENDENT',
      details: `Deleted Dependent #${id}`
    });

    res.json({ success: true, message: `Dependent #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── CANDIDATE SUBTYPES (Relations #8, #9, #10: Fresher, Experienced, Freelancer) ─────
export async function getSubtypes(req, res, next) {
  try {
    const [freshersRes, expRes, freeRes, candRes] = await Promise.all([
      executeQuery(`
        SELECT f.cand_id, f.grad_year, f.internship_count, c.fname, c.lname
        FROM Fresher f
        LEFT JOIN Candidate c ON c.cand_id = f.cand_id
        ORDER BY f.cand_id ASC
      `),
      executeQuery(`
        SELECT e.cand_id, e.total_exp, e.current_company, c.fname, c.lname
        FROM Experienced e
        LEFT JOIN Candidate c ON c.cand_id = e.cand_id
        ORDER BY e.cand_id ASC
      `),
      executeQuery(`
        SELECT fl.cand_id, fl.hourly_rate, fl.portfolio_url, c.fname, c.lname
        FROM Freelancer fl
        LEFT JOIN Candidate c ON c.cand_id = fl.cand_id
        ORDER BY fl.cand_id ASC
      `),
      executeQuery(`SELECT cand_id, fname, lname FROM Candidate ORDER BY cand_id ASC`)
    ]);

    const candidates = (candRes.rows || []).map(c => ({
      cand_id: c.CAND_ID ?? c.cand_id,
      candidate_name: `${c.FNAME || ''} ${c.LNAME || ''}`.trim()
    }));

    const freshers = (freshersRes.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      grad_year: r.GRAD_YEAR ?? r.grad_year ?? 2023,
      internship_count: r.INTERNSHIP_COUNT ?? r.internship_count ?? 0,
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`
    }));

    const experienced = (expRes.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      total_exp: r.TOTAL_EXP ?? r.total_exp ?? 2,
      current_company: r.CURRENT_COMPANY ?? r.current_company ?? 'Tech Labs',
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`
    }));

    const freelancers = (freeRes.rows || []).map(r => ({
      cand_id: r.CAND_ID ?? r.cand_id,
      hourly_rate: r.HOURLY_RATE ?? r.hourly_rate ?? 500,
      portfolio_url: r.PORTFOLIO_URL ?? r.portfolio_url ?? 'https://portfolio.example.com',
      candidate_name: (r.FNAME || r.LNAME) ? `${r.FNAME || ''} ${r.LNAME || ''}`.trim() : `Candidate #${r.CAND_ID ?? r.cand_id}`
    }));

    res.json({
      success: true,
      data: {
        freshers,
        experienced,
        freelancers,
        candidates
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createSubtype(req, res, next) {
  try {
    const { type } = req.params;
    const { cand_id, grad_year, internship_count, total_exp, current_company, hourly_rate, portfolio_url } = req.body;

    if (!cand_id) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required' });
    }

    if (type === 'fresher') {
      await executeQuery(`
        INSERT INTO Fresher (cand_id, grad_year, internship_count)
        VALUES (:cand_id, :grad_year, :internship_count)
      `, {
        cand_id: parseInt(cand_id, 10),
        grad_year: grad_year ? parseInt(grad_year, 10) : 2024,
        internship_count: internship_count ? parseInt(internship_count, 10) : 1
      });
    } else if (type === 'experienced') {
      await executeQuery(`
        INSERT INTO Experienced (cand_id, total_exp, current_company)
        VALUES (:cand_id, :total_exp, :current_company)
      `, {
        cand_id: parseInt(cand_id, 10),
        total_exp: total_exp ? parseFloat(total_exp) : 3,
        current_company: current_company || 'Global Enterprise'
      });
    } else if (type === 'freelancer') {
      await executeQuery(`
        INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url)
        VALUES (:cand_id, :hourly_rate, :portfolio_url)
      `, {
        cand_id: parseInt(cand_id, 10),
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : 750,
        portfolio_url: portfolio_url || 'https://freelancer.portfolio.io'
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid subtype. Must be fresher, experienced, or freelancer.' });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: `CREATE_${type.toUpperCase()}`,
      details: `Added Candidate #${cand_id} as ${type}`
    });

    res.json({ success: true, message: `${type} profile created for Candidate #${cand_id}.` });
  } catch (error) {
    next(error);
  }
}

export async function updateSubtype(req, res, next) {
  try {
    const { type, cand_id } = req.params;
    const { grad_year, internship_count, total_exp, current_company, hourly_rate, portfolio_url } = req.body;

    if (type === 'fresher') {
      await executeQuery(`
        UPDATE Fresher
        SET grad_year = :grad_year, internship_count = :internship_count
        WHERE cand_id = :cand_id
      `, {
        grad_year: grad_year ? parseInt(grad_year, 10) : 2024,
        internship_count: internship_count ? parseInt(internship_count, 10) : 1,
        cand_id: parseInt(cand_id, 10)
      });
    } else if (type === 'experienced') {
      await executeQuery(`
        UPDATE Experienced
        SET total_exp = :total_exp, current_company = :current_company
        WHERE cand_id = :cand_id
      `, {
        total_exp: total_exp ? parseFloat(total_exp) : 3,
        current_company: current_company || 'Global Enterprise',
        cand_id: parseInt(cand_id, 10)
      });
    } else if (type === 'freelancer') {
      await executeQuery(`
        UPDATE Freelancer
        SET hourly_rate = :hourly_rate, portfolio_url = :portfolio_url
        WHERE cand_id = :cand_id
      `, {
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : 750,
        portfolio_url: portfolio_url || 'https://freelancer.portfolio.io',
        cand_id: parseInt(cand_id, 10)
      });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: `UPDATE_${type.toUpperCase()}`,
      details: `Updated ${type} profile for Candidate #${cand_id}`
    });

    res.json({ success: true, message: `${type} profile updated for Candidate #${cand_id}.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubtype(req, res, next) {
  try {
    const { type, cand_id } = req.params;
    const cid = parseInt(cand_id, 10);

    if (type === 'fresher') {
      await executeQuery(`DELETE FROM Fresher WHERE cand_id = :cid`, { cid });
    } else if (type === 'experienced') {
      await executeQuery(`DELETE FROM Experienced WHERE cand_id = :cid`, { cid });
    } else if (type === 'freelancer') {
      await executeQuery(`DELETE FROM Freelancer WHERE cand_id = :cid`, { cid });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: `DELETE_${type.toUpperCase()}`,
      details: `Removed Candidate #${cid} from ${type} subtype`
    });

    res.json({ success: true, message: `${type} record for Candidate #${cid} removed.` });
  } catch (error) {
    next(error);
  }
}
