import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

// ─── LOCATIONS (Relation #11: Location & State_City) ──────────────────────────────────
export async function getLocations(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT l.pincode, l.country, l.state, sc.city
      FROM Location l
      LEFT JOIN State_City sc ON sc.state = l.state
      ORDER BY l.pincode ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      pincode: r.PINCODE ?? r.pincode,
      country: r.COUNTRY ?? r.country ?? 'India',
      state: r.STATE ?? r.state ?? 'Karnataka',
      city: r.CITY ?? r.city ?? 'Bengaluru'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        String(r.pincode).includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createLocation(req, res, next) {
  try {
    const { pincode, city, state, country } = req.body;
    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode is required.' });
    }

    const cleanPin = parseInt(pincode, 10);
    const cleanState = state || 'Karnataka';
    const cleanCity = city || 'Bengaluru';
    const cleanCountry = country || 'India';

    await executeQuery(`
      INSERT INTO State_City (state, city)
      VALUES (:cleanState, :cleanCity)
    `, { cleanState, cleanCity });

    await executeQuery(`
      INSERT INTO Location (pincode, country, state)
      VALUES (:cleanPin, :cleanCountry, :cleanState)
    `, { cleanPin, cleanCountry, cleanState });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_LOCATION',
      details: `Created Location #${cleanPin} (${cleanCity}, ${cleanState}, ${cleanCountry})`
    });

    res.json({ success: true, message: `Location ${cleanPin} added successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function updateLocation(req, res, next) {
  try {
    const { pincode } = req.params;
    const { city, state, country } = req.body;
    const cleanPin = parseInt(pincode, 10);

    if (state !== undefined || country !== undefined) {
      await executeQuery(`
        UPDATE Location
        SET state = :state, country = :country
        WHERE pincode = :cleanPin
      `, {
        state: state || 'Karnataka',
        country: country || 'India',
        cleanPin
      });
    }

    if (city !== undefined && state !== undefined) {
      await executeQuery(`
        UPDATE State_City
        SET city = :city
        WHERE state = :state
      `, { city, state });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_LOCATION',
      details: `Updated Location #${cleanPin}`
    });

    res.json({ success: true, message: `Location #${cleanPin} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteLocation(req, res, next) {
  try {
    const { pincode } = req.params;
    const cleanPin = parseInt(pincode, 10);

    await executeQuery(`DELETE FROM Location WHERE pincode = :cleanPin`, { cleanPin });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_LOCATION',
      details: `Deleted Location #${cleanPin}`
    });

    res.json({ success: true, message: `Location #${cleanPin} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── COMPANIES & AFFILIATES (Relations #14, #15: Company, Company_Employer) ───────────
export async function getCompanies(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.comp_id, c.comp_type, c.emp_count,
             ce.emp_id, e.company_name
      FROM Company c
      LEFT JOIN Company_Employer ce ON ce.comp_id = c.comp_id
      LEFT JOIN Employer e ON e.emp_id = ce.emp_id
      ORDER BY c.comp_id ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      comp_id: r.COMP_ID ?? r.comp_id,
      comp_type: r.COMP_TYPE ?? r.comp_type ?? 'Technology',
      emp_count: r.EMP_COUNT ?? r.emp_count ?? 100,
      emp_id: r.EMP_ID ?? r.emp_id,
      company_name: r.COMPANY_NAME ?? r.company_name ?? 'Affiliated Partner'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.comp_id || '').toLowerCase().includes(q) ||
        (r.comp_type || '').toLowerCase().includes(q) ||
        (r.company_name || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createCompany(req, res, next) {
  try {
    const { comp_type, emp_count, emp_id } = req.body;
    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(comp_id, 5))), 0) + 1 AS next_num FROM Company');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 9;
    const nextCompId = `COMP${String(nextNum).padStart(3, '0')}`;

    const cleanType = comp_type || 'Software Enterprise';
    const cleanCount = emp_count ? parseInt(emp_count, 10) : 250;

    await executeQuery(`
      INSERT INTO Company (comp_id, comp_type, emp_count)
      VALUES (:nextCompId, :cleanType, :cleanCount)
    `, { nextCompId, cleanType, cleanCount });

    if (emp_id) {
      await executeQuery(`
        INSERT INTO Company_Employer (comp_id, emp_id)
        VALUES (:nextCompId, :emp_id)
      `, { nextCompId, emp_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_COMPANY',
      details: `Created Company #${nextCompId} (${cleanType}) linked to Employer #${emp_id || 'N/A'}`
    });

    res.json({ success: true, message: `Company ${nextCompId} created successfully.`, data: { comp_id: nextCompId } });
  } catch (error) {
    next(error);
  }
}

export async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { comp_type, emp_count, emp_id } = req.body;

    await executeQuery(`
      UPDATE Company
      SET comp_type = :comp_type, emp_count = :emp_count
      WHERE comp_id = :id
    `, {
      comp_type: comp_type || 'Technology Services',
      emp_count: emp_count ? parseInt(emp_count, 10) : 500,
      id
    });

    if (emp_id) {
      await executeQuery(`DELETE FROM Company_Employer WHERE comp_id = :id`, { id });
      await executeQuery(`
        INSERT INTO Company_Employer (comp_id, emp_id)
        VALUES (:id, :emp_id)
      `, { id, emp_id });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_COMPANY',
      details: `Updated Company #${id}`
    });

    res.json({ success: true, message: `Company #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteCompany(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM Company_Employer WHERE comp_id = :id`, { id });
    await executeQuery(`DELETE FROM Company WHERE comp_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_COMPANY',
      details: `Deleted Company #${id}`
    });

    res.json({ success: true, message: `Company #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

// ─── RECRUITMENT AGENCIES (Relations #16, #17, #18) ──────────────────────────────────
export async function getAgencies(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT ra.agency_no, ra.agency_name,
             r.emp_id, e.company_name,
             rl.lic_no
      FROM Recruitment_Agency ra
      LEFT JOIN Recruitment r ON r.agency_no = ra.agency_no
      LEFT JOIN Employer e ON e.emp_id = r.emp_id
      LEFT JOIN Recruitment_License rl ON rl.emp_id = r.emp_id
      ORDER BY ra.agency_no ASC
    `;
    const result = await executeQuery(sql);
    let rows = (result.rows || []).map(r => ({
      agency_no: r.AGENCY_NO ?? r.agency_no,
      agency_name: r.AGENCY_NAME ?? r.agency_name ?? 'Global Recruiters',
      emp_id: r.EMP_ID ?? r.emp_id,
      company_name: r.COMPANY_NAME ?? r.company_name ?? 'Associated Partner',
      lic_no: r.LIC_NO ?? r.lic_no ?? 'LIC-4100'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter(r =>
        (r.agency_no || '').toLowerCase().includes(q) ||
        (r.agency_name || '').toLowerCase().includes(q) ||
        (r.company_name || '').toLowerCase().includes(q) ||
        (r.lic_no || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createAgency(req, res, next) {
  try {
    const { agency_name, emp_id, lic_no } = req.body;
    if (!agency_name) {
      return res.status(400).json({ success: false, message: 'Agency name is required.' });
    }

    const maxResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(agency_no, 3))), 0) + 1 AS next_num FROM Recruitment_Agency');
    const nextNum = maxResult.rows[0]?.NEXT_NUM ?? maxResult.rows[0]?.next_num ?? 6;
    const nextAgencyNo = `AG${String(nextNum).padStart(3, '0')}`;

    await executeQuery(`
      INSERT INTO Recruitment_Agency (agency_no, agency_name)
      VALUES (:nextAgencyNo, :agency_name)
    `, { nextAgencyNo, agency_name });

    if (emp_id) {
      await executeQuery(`
        INSERT INTO Recruitment (emp_id, agency_no)
        VALUES (:emp_id, :nextAgencyNo)
      `, { emp_id, nextAgencyNo });

      if (lic_no) {
        await executeQuery(`
          INSERT INTO Recruitment_License (emp_id, lic_no)
          VALUES (:emp_id, :lic_no)
        `, { emp_id, lic_no });
      }
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_AGENCY',
      details: `Created Recruitment Agency #${nextAgencyNo} (${agency_name})`
    });

    res.json({ success: true, message: `Agency ${nextAgencyNo} created successfully.`, data: { agency_no: nextAgencyNo } });
  } catch (error) {
    next(error);
  }
}

export async function updateAgency(req, res, next) {
  try {
    const { id } = req.params;
    const { agency_name, emp_id, lic_no } = req.body;

    if (agency_name) {
      await executeQuery(`
        UPDATE Recruitment_Agency
        SET agency_name = :agency_name
        WHERE agency_no = :id
      `, { agency_name, id });
    }

    if (emp_id) {
      await executeQuery(`DELETE FROM Recruitment WHERE agency_no = :id`, { id });
      await executeQuery(`
        INSERT INTO Recruitment (emp_id, agency_no)
        VALUES (:emp_id, :id)
      `, { emp_id, id });

      if (lic_no) {
        await executeQuery(`DELETE FROM Recruitment_License WHERE emp_id = :emp_id`, { emp_id });
        await executeQuery(`
          INSERT INTO Recruitment_License (emp_id, lic_no)
          VALUES (:emp_id, :lic_no)
        `, { emp_id, lic_no });
      }
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_AGENCY',
      details: `Updated Recruitment Agency #${id}`
    });

    res.json({ success: true, message: `Agency #${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteAgency(req, res, next) {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM Recruitment WHERE agency_no = :id`, { id });
    await executeQuery(`DELETE FROM Recruitment_Agency WHERE agency_no = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_AGENCY',
      details: `Deleted Recruitment Agency #${id}`
    });

    res.json({ success: true, message: `Agency #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
