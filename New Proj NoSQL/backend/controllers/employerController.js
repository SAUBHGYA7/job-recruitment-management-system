import { runQuery, getNextSequence } from '../db/neo4j.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getEmployers(req, res, next) {
  try {
    const cypher = `
      MATCH (e:Employer)
      OPTIONAL MATCH (e)-[:AFFILIATED_WITH]->(co:Company)
      OPTIONAL MATCH (e)-[:CONTRACTS_AGENCY]->(ra:RecruitmentAgency)
      RETURN e.emp_id AS emp_id,
             e.company_name AS company_name,
             e.founded_year AS founded_year,
             e.company_mail AS company_mail,
             e.website AS website,
             e.headquarter AS headquarter,
             e.license_no AS license_no,
             ra.agency_name AS agency_name,
             co.comp_type AS company_type,
             coalesce(e.phones, []) AS phones
      ORDER BY e.emp_id ASC
    `;

    const records = await runQuery(cypher);

    const employers = records.map(r => ({
      emp_id: r.emp_id,
      company_name: r.company_name,
      founded_year: r.founded_year,
      company_mail: r.company_mail,
      website: r.website,
      headquarter: r.headquarter,
      license_no: r.license_no,
      agency_name: r.agency_name,
      company_type: r.company_type || 'Private Enterprise',
      phones: Array.isArray(r.phones) ? r.phones : (r.phones ? [r.phones] : [])
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

    const nextNum = await getNextSequence('employer', 16);
    const nextId = `E${String(nextNum).padStart(3, '0')}`;

    const phoneList = Array.isArray(phone_no)
      ? phone_no
      : (phone_no ? String(phone_no).split(',').map(p => p.trim()).filter(Boolean) : []);

    const cypher = `
      CREATE (e:Employer {
        emp_id: $nextId,
        company_name: $company_name,
        founded_year: $founded_year,
        company_mail: $company_mail,
        website: $website,
        headquarter: $headquarter,
        phones: $phones
      })
      RETURN e
    `;

    await runQuery(cypher, {
      nextId,
      company_name: company_name.trim(),
      founded_year: founded_year ? parseInt(founded_year, 10) : 2020,
      company_mail: company_mail || 'contact@company.com',
      website: website || 'https://company.example.com',
      headquarter: headquarter || 'Bengaluru',
      phones: phoneList
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'CREATE_EMPLOYER',
      details: `Created Employer #${nextId} (${company_name}) in Neo4j Graph Database`
    });

    res.status(201).json({ success: true, message: 'Employer created in Neo4j.', data: { emp_id: nextId, company_name } });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployer(req, res, next) {
  try {
    const { id } = req.params;
    const { company_name, founded_year, company_mail, website, headquarter, phone_no } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const phoneList = phone_no !== undefined
      ? (Array.isArray(phone_no) ? phone_no : String(phone_no).split(',').map(p => p.trim()).filter(Boolean))
      : null;

    const cypher = `
      MATCH (e:Employer {emp_id: $id})
      SET e.company_name = coalesce($company_name, e.company_name),
          e.founded_year = coalesce($founded_year, e.founded_year),
          e.company_mail = coalesce($company_mail, e.company_mail),
          e.website = coalesce($website, e.website),
          e.headquarter = coalesce($headquarter, e.headquarter)
      WITH e
      FOREACH (_ IN CASE WHEN $phones IS NOT NULL THEN [1] ELSE [] END |
        SET e.phones = $phones
      )
      RETURN e
    `;

    await runQuery(cypher, {
      id,
      company_name: company_name.trim(),
      founded_year: founded_year ? parseInt(founded_year, 10) : null,
      company_mail: company_mail ?? null,
      website: website ?? null,
      headquarter: headquarter ?? null,
      phones: phoneList
    });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'UPDATE_EMPLOYER',
      details: `Updated Employer #${id} (${company_name}) in Neo4j Graph Database`
    });

    res.json({ success: true, message: `Employer #${id} updated successfully in Neo4j.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployer(req, res, next) {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (e:Employer {emp_id: $id})
      DETACH DELETE e
      RETURN count(e) AS deletedCount
    `;

    await runQuery(cypher, { id });

    await logAuditEvent({
      username: req.user?.username || 'USER',
      role: req.user?.role || 'USER',
      action: 'DELETE_EMPLOYER',
      details: `Deleted Employer #${id} from Neo4j Graph Database`
    });

    res.json({ success: true, message: `Employer #${id} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
