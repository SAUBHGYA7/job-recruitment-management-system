import { executeQuery } from '../db/oracle.js';
import { logAuditEvent } from '../services/auditService.js';

export async function updateEmployer(req, res, next) {
  try {
    const { id } = req.params;
    const { company_name, founded_year, company_mail, website, headquarter, phone_no } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    await executeQuery(`
      UPDATE Employer SET company_name = :company_name, founded_year = :founded_year WHERE emp_id = :id
    `, { company_name, founded_year: founded_year ? parseInt(founded_year, 10) : 2020, id });

    await executeQuery(`
      UPDATE Employer_Details SET company_mail = :company_mail, website = :website, headquarter = :headquarter WHERE emp_id = :id
    `, { id, company_mail: company_mail || 'contact@company.com', website: website || 'https://company.example.com', headquarter: headquarter || 'Bengaluru' });

    const phoneCheck = await executeQuery(`SELECT emp_id FROM Employer_Phone WHERE emp_id = :id`, { id });
    if (phoneCheck.rows.length > 0) {
      if (phone_no) {
        await executeQuery(`UPDATE Employer_Phone SET phone_no = :phone_no WHERE emp_id = :id`, { id, phone_no });
      }
    } else if (phone_no) {
      await executeQuery(`INSERT INTO Employer_Phone (emp_id, phone_no) VALUES (:id, :phone_no)`, { id, phone_no });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_EMPLOYER',
      details: `Updated Employer #${id} in Oracle Database`
    });

    res.json({ success: true, message: `Employer #${id} updated successfully in Oracle.` });
  } catch (error) {
    next(error);
  }
}

export async function getEmployers(req, res, next) {
  try {
    const sql = `
      SELECT e.emp_id, e.company_name, e.founded_year,
             ed.company_mail, ed.website, ed.headquarter,
             rl.lic_no,
             ra.agency_name,
             co.comp_type,
             (SELECT LISTAGG(phone_no, ', ') WITHIN GROUP (ORDER BY phone_no) FROM Employer_Phone WHERE emp_id = e.emp_id) AS phones
      FROM Employer e
      LEFT JOIN Employer_Details ed ON ed.emp_id = e.emp_id
      LEFT JOIN Recruitment_License rl ON rl.emp_id = e.emp_id
      LEFT JOIN Recruitment r ON r.emp_id = e.emp_id
      LEFT JOIN Recruitment_Agency ra ON ra.agency_no = r.agency_no
      LEFT JOIN Company_Employer ce ON ce.emp_id = e.emp_id
      LEFT JOIN Company co ON co.comp_id = ce.comp_id
      ORDER BY e.emp_id ASC
    `;

    const result = await executeQuery(sql);

    const employers = result.rows.map(r => ({
      emp_id: r.EMP_ID ?? r.emp_id,
      company_name: r.COMPANY_NAME ?? r.company_name,
      founded_year: r.FOUNDED_YEAR ?? r.founded_year,
      company_mail: r.COMPANY_MAIL ?? r.company_mail,
      website: r.WEBSITE ?? r.website,
      headquarter: r.HEADQUARTER ?? r.headquarter,
      license_no: r.LIC_NO ?? r.lic_no,
      agency_name: r.AGENCY_NAME ?? r.agency_name,
      company_type: r.COMP_TYPE ?? r.comp_type ?? 'Private Enterprise',
      phones: (r.PHONES ?? r.phones ?? '').split(', ').filter(Boolean)
    }));

    res.json({ success: true, total: employers.length, data: employers });
  } catch (error) {
    next(error);
  }
}

export async function createEmployer(req, res, next) {
  try {
    const { company_name, founded_year, company_mail, website, headquarter, phone_no } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const maxIdResult = await executeQuery('SELECT NVL(MAX(TO_NUMBER(SUBSTR(emp_id, 2))), 0) + 1 AS next_num FROM Employer');
    const nextNum = maxIdResult.rows[0]?.NEXT_NUM ?? maxIdResult.rows[0]?.next_num ?? 6;
    const nextId = `E00${nextNum}`;

    await executeQuery(`
      INSERT INTO Employer (emp_id, company_name, founded_year)
      VALUES (:nextId, :company_name, :founded_year)
    `, { nextId, company_name, founded_year: founded_year ? parseInt(founded_year, 10) : 2020 });

    await executeQuery(`
      INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter)
      VALUES (:nextId, :company_mail, :website, :headquarter)
    `, {
      nextId,
      company_mail: company_mail || 'contact@company.com',
      website: website || 'https://company.example.com',
      headquarter: headquarter || 'Bengaluru'
    });

    if (phone_no) {
      await executeQuery(`
        INSERT INTO Employer_Phone (emp_id, phone_no) VALUES (:nextId, :phone_no)
      `, { nextId, phone_no });
    }

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_EMPLOYER',
      details: `Created Employer #${nextId} (${company_name}) in Oracle Database`
    });

    res.status(201).json({ success: true, message: 'Employer created in Oracle.', data: { emp_id: nextId, company_name } });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployer(req, res, next) {
  try {
    const { id } = req.params;

    await executeQuery(`DELETE FROM Employer_Phone WHERE emp_id = :id`, { id });
    await executeQuery(`DELETE FROM Employer_Details WHERE emp_id = :id`, { id });
    await executeQuery(`DELETE FROM Recruitment_License WHERE emp_id = :id`, { id });
    await executeQuery(`DELETE FROM Recruitment WHERE emp_id = :id`, { id });
    await executeQuery(`DELETE FROM Company_Employer WHERE emp_id = :id`, { id });
    await executeQuery(`DELETE FROM Employer WHERE emp_id = :id`, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_EMPLOYER',
      details: `Deleted Employer #${id} from Oracle Database`
    });

    res.json({ success: true, message: `Employer #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
