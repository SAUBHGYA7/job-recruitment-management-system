import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSeedSql } from './parseSeed.js';
import { initConstraints } from './initConstraints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  NEO4J_URI = 'bolt://localhost:7687',
  NEO4J_USER = 'neo4j',
  NEO4J_PASSWORD,
  NEO4J_DATABASE = 'neo4j'
} = process.env;

if (!NEO4J_PASSWORD) {
  console.error('FATAL ERROR: NEO4J_PASSWORD is not set in .env');
  process.exit(1);
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  { disableLosslessIntegers: true }
);

/**
 * Filter out null/undefined keys from parameter maps so Neo4j properties are clean
 */
function cleanProps(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

export async function runMigration() {
  const startTime = Date.now();
  console.log('='.repeat(70));
  console.log('  JRMS ORACLE-TO-NEO4J MIGRATION PIPELINE');
  console.log('='.repeat(70));

  // Step 1: Initialize Constraints and Indexes
  console.log('\n[Phase 1/4] Ensuring Schema Constraints & Indexes...');
  await initConstraints();

  // Step 2: Parse Seed Dataset
  const seedPath = path.resolve(__dirname, '../database/seed.sql');
  console.log(`\n[Phase 2/4] Parsing source SQL dataset from ${seedPath}...`);
  const { tableData, totalInserts } = parseSeedSql(seedPath);
  console.log(`[Seed Parser] Successfully parsed ${totalInserts} statements across ${Object.keys(tableData).length} tables.`);

  const session = driver.session({ database: NEO4J_DATABASE });
  const reconciliationLog = [];

  try {
    console.log('\n[Phase 3/4] Migrating Entity Nodes & Relationships...');

    // -------------------------------------------------------------
    // 1. Locations (Consolidating Location + State_City)
    // -------------------------------------------------------------
    console.log('  - Migrating Location nodes (Location + State_City)...');
    const stateCityMap = new Map();
    for (const sc of (tableData['State_City'] || [])) {
      stateCityMap.set(sc.state, sc.city);
    }

    for (const loc of (tableData['Location'] || [])) {
      const city = stateCityMap.get(loc.state) || null;
      await session.run(`
        MERGE (l:Location {pincode: $pincode})
        SET l += $props
      `, {
        pincode: loc.pincode,
        props: cleanProps({
          country: loc.country,
          state: loc.state,
          city: city
        })
      });
    }

    // -------------------------------------------------------------
    // 2. Education (Consolidating Education + Education_Degree + Education_End)
    // -------------------------------------------------------------
    console.log('  - Migrating Education nodes (Education + Degree + End)...');
    const degreeMap = new Map();
    for (const deg of (tableData['Education_Degree'] || [])) {
      degreeMap.set(deg.degree, deg);
    }
    const eduEndMap = new Map();
    for (const ee of (tableData['Education_End'] || [])) {
      eduEndMap.set(ee.edu_id, ee);
    }

    for (const edu of (tableData['Education'] || [])) {
      const ee = eduEndMap.get(edu.edu_id);
      const degreeInfo = ee ? degreeMap.get(ee.degree) : null;
      await session.run(`
        MERGE (ed:Education {edu_id: $edu_id})
        SET ed += $props
      `, {
        edu_id: edu.edu_id,
        props: cleanProps({
          cgpa: edu.cgpa,
          specialization: edu.specialization,
          degree: ee ? ee.degree : null,
          end_year: ee ? ee.end_year : null,
          university: degreeInfo ? degreeInfo.university : null,
          start_year: degreeInfo ? degreeInfo.start_year : null
        })
      });
    }

    // -------------------------------------------------------------
    // 3. Experience (Consolidating Experience + Experience_Candidate + Experience_Company)
    // -------------------------------------------------------------
    console.log('  - Migrating Experience nodes (Experience + Candidate + Company)...');
    const expCandMap = new Map();
    for (const ec of (tableData['Experience_Candidate'] || [])) {
      expCandMap.set(ec.exp_id, ec);
    }

    for (const exp of (tableData['Experience'] || [])) {
      const ec = expCandMap.get(exp.exp_id);
      await session.run(`
        MERGE (ex:Experience {exp_id: $exp_id})
        SET ex += $props
      `, {
        exp_id: exp.exp_id,
        props: cleanProps({
          job_title: exp.job_title,
          start_date: exp.start_date,
          comp_name: ec ? ec.comp_name : null,
          end_date: ec ? ec.end_date : null
        })
      });
    }

    // -------------------------------------------------------------
    // 4. Application (Consolidating Application + Application_Info + Application_Date)
    // -------------------------------------------------------------
    console.log('  - Migrating Application nodes (Application + Info + Date)...');
    const appInfoMap = new Map();
    for (const ai of (tableData['Application_Info'] || [])) {
      appInfoMap.set(ai.app_id, ai.app_date);
    }
    const appDateMap = new Map();
    for (const ad of (tableData['Application_Date'] || [])) {
      // Keyed by app_date + '_' + final_result
      appDateMap.set(`${ad.app_date}_${ad.final_result}`, ad.offer_letter);
    }

    for (const app of (tableData['Application'] || [])) {
      const appDate = appInfoMap.get(app.app_id) || null;
      const offerLetter = appDate ? (appDateMap.get(`${appDate}_${app.final_result}`) || null) : null;
      await session.run(`
        MERGE (a:Application {app_id: $app_id})
        SET a += $props
      `, {
        app_id: app.app_id,
        props: cleanProps({
          app_status: app.app_status,
          final_result: app.final_result,
          app_date: appDate,
          offer_letter: offerLetter
        })
      });
    }

    // -------------------------------------------------------------
    // 5. Interview (Consolidating Interview + Interview_Details)
    // -------------------------------------------------------------
    console.log('  - Migrating Interview nodes (Interview + Details)...');
    const intDetailsMap = new Map();
    for (const id of (tableData['Interview_Details'] || [])) {
      intDetailsMap.set(id.int_id, id);
    }

    for (const intw of (tableData['Interview'] || [])) {
      const det = intDetailsMap.get(intw.int_id);
      await session.run(`
        MERGE (i:Interview {int_id: $int_id})
        SET i += $props
      `, {
        int_id: intw.int_id,
        props: cleanProps({
          int_date: intw.int_date,
          int_time: intw.int_time,
          int_mode: det ? det.int_mode : null,
          location: det ? det.location : null,
          int_status: det ? det.int_status : null,
          score: det ? det.score : null,
          feedback: det ? det.feedback : null
        })
      });
    }

    // -------------------------------------------------------------
    // 6. Dependent
    // -------------------------------------------------------------
    console.log('  - Migrating Dependent nodes...');
    for (const dep of (tableData['Dependent'] || [])) {
      await session.run(`
        MERGE (d:Dependent {dep_id: $dep_id})
        SET d += $props
      `, {
        dep_id: dep.dep_id,
        props: cleanProps({
          dob: dep.dob,
          relationship: dep.relationship
        })
      });
    }

    // -------------------------------------------------------------
    // 7. Skills (Consolidating Skill + Skill_Details)
    // -------------------------------------------------------------
    console.log('  - Migrating Skill nodes (Skill + Skill_Details)...');
    const skillDetailsMap = new Map();
    for (const sd of (tableData['Skill_Details'] || [])) {
      skillDetailsMap.set(sd.skill_name, sd);
    }

    for (const sk of (tableData['Skill'] || [])) {
      const det = skillDetailsMap.get(sk.skill_name);
      await session.run(`
        MERGE (s:Skill {skill_id: $skill_id})
        SET s += $props
      `, {
        skill_id: sk.skill_id,
        props: cleanProps({
          skill_name: sk.skill_name,
          skill_category: det ? det.skill_category : null,
          description: det ? det.description : null
        })
      });
    }

    // -------------------------------------------------------------
    // 8. Jobs (Consolidating Job + Job_Details + Job_Posting)
    // -------------------------------------------------------------
    console.log('  - Migrating Job nodes (Job + Job_Details + Job_Posting)...');
    const jobDetailsMap = new Map();
    for (const jd of (tableData['Job_Details'] || [])) {
      jobDetailsMap.set(jd.job_key, jd);
    }
    const jobPostingMap = new Map();
    for (const jp of (tableData['Job_Posting'] || [])) {
      jobPostingMap.set(jp.job_title, jp);
    }

    for (const j of (tableData['Job'] || [])) {
      const jd = jobDetailsMap.get(j.job_key);
      const jp = jd ? jobPostingMap.get(jd.job_title) : null;
      await session.run(`
        MERGE (job:Job {job_key: $job_key})
        SET job += $props
      `, {
        job_key: j.job_key,
        props: cleanProps({
          job_id: j.job_id,
          job_status: j.job_status,
          salary: j.salary,
          job_title: jd ? jd.job_title : null,
          descriptive: jd ? jd.descriptive : null,
          closing_date: jp ? jp.closing_date : null,
          posted_date: jp ? jp.posted_date : null
        })
      });
    }

    // -------------------------------------------------------------
    // 9. Employer (Consolidating Employer + Employer_Details + Employer_Phone + Recruitment_License)
    // -------------------------------------------------------------
    console.log('  - Migrating Employer nodes (Employer + Details + Phones + License)...');
    const empDetailsMap = new Map();
    for (const ed of (tableData['Employer_Details'] || [])) {
      empDetailsMap.set(ed.emp_id, ed);
    }
    const empPhoneMap = new Map();
    for (const ep of (tableData['Employer_Phone'] || [])) {
      if (!empPhoneMap.has(ep.emp_id)) empPhoneMap.set(ep.emp_id, []);
      empPhoneMap.get(ep.emp_id).push(ep.phone_no);
    }
    const empLicenseMap = new Map();
    for (const el of (tableData['Recruitment_License'] || [])) {
      empLicenseMap.set(el.emp_id, el.lic_no);
    }

    for (const emp of (tableData['Employer'] || [])) {
      const det = empDetailsMap.get(emp.emp_id);
      const phones = empPhoneMap.get(emp.emp_id) || [];
      const licenseNo = empLicenseMap.get(emp.emp_id) || null;
      await session.run(`
        MERGE (e:Employer {emp_id: $emp_id})
        SET e += $props
      `, {
        emp_id: emp.emp_id,
        props: cleanProps({
          company_name: emp.company_name,
          founded_year: emp.founded_year,
          company_mail: det ? det.company_mail : null,
          website: det ? det.website : null,
          headquarter: det ? det.headquarter : null,
          license_no: licenseNo,
          phones: phones
        })
      });
    }

    // -------------------------------------------------------------
    // 10. Company & Recruitment_Agency
    // -------------------------------------------------------------
    console.log('  - Migrating Company and RecruitmentAgency nodes...');
    for (const comp of (tableData['Company'] || [])) {
      await session.run(`
        MERGE (co:Company {comp_id: $comp_id})
        SET co += $props
      `, {
        comp_id: comp.comp_id,
        props: cleanProps({
          comp_type: comp.comp_type,
          emp_count: comp.emp_count
        })
      });
    }

    for (const ra of (tableData['Recruitment_Agency'] || [])) {
      await session.run(`
        MERGE (agency:RecruitmentAgency {agency_no: $agency_no})
        SET agency += $props
      `, {
        agency_no: ra.agency_no,
        props: cleanProps({
          agency_name: ra.agency_name
        })
      });
    }

    // -------------------------------------------------------------
    // 11. Candidate (Candidate + Address + Email + Phone + Subtypes)
    // -------------------------------------------------------------
    console.log('  - Migrating Candidate nodes with consolidated profiles and subtypes...');
    const candAddressMap = new Map();
    for (const ca of (tableData['Candidate_Address'] || [])) {
      candAddressMap.set(ca.cand_id, ca);
    }
    const candEmailMap = new Map();
    for (const ce of (tableData['Candidate_Email'] || [])) {
      if (!candEmailMap.has(ce.cand_id)) candEmailMap.set(ce.cand_id, []);
      candEmailMap.get(ce.cand_id).push(ce.email);
    }
    const candPhoneMap = new Map();
    for (const cp of (tableData['Candidate_Phone'] || [])) {
      if (!candPhoneMap.has(cp.cand_id)) candPhoneMap.set(cp.cand_id, []);
      candPhoneMap.get(cp.cand_id).push(cp.phone);
    }

    const freelancerMap = new Map();
    for (const f of (tableData['Freelancer'] || [])) freelancerMap.set(f.cand_id, f);
    const fresherMap = new Map();
    for (const f of (tableData['Fresher'] || [])) fresherMap.set(f.cand_id, f);
    const expMap = new Map();
    for (const ex of (tableData['Experienced'] || [])) expMap.set(ex.cand_id, ex);

    const candAppMap = new Map(); // Keep track of cand_id -> app_id

    for (const cand of (tableData['Candidate'] || [])) {
      candAppMap.set(cand.cand_id, cand.app_id);
      const addr = candAddressMap.get(cand.cand_id);
      const emails = candEmailMap.get(cand.cand_id) || [];
      const phones = candPhoneMap.get(cand.cand_id) || [];

      // Base candidate node
      await session.run(`
        MERGE (c:Candidate {cand_id: $cand_id})
        SET c += $props
      `, {
        cand_id: cand.cand_id,
        props: cleanProps({
          fname: cand.fname,
          mname: cand.mname,
          lname: cand.lname,
          dob: cand.dob,
          gender: cand.gender,
          reg_date: cand.reg_date,
          house_no: addr ? addr.house_no : null,
          city: addr ? addr.city : null,
          street: addr ? addr.street : null,
          emails: emails,
          phones: phones
        })
      });

      // Subtypes
      if (freelancerMap.has(cand.cand_id)) {
        const fl = freelancerMap.get(cand.cand_id);
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id})
          SET c:Freelancer, c += $props
        `, {
          cand_id: cand.cand_id,
          props: cleanProps({
            hourly_rate: fl.hourly_rate,
            portfolio_url: fl.portfolio_url
          })
        });
      }

      if (fresherMap.has(cand.cand_id)) {
        const fr = fresherMap.get(cand.cand_id);
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id})
          SET c:Fresher, c += $props
        `, {
          cand_id: cand.cand_id,
          props: cleanProps({
            grad_year: fr.grad_year,
            internship_count: fr.internship_count
          })
        });
      }

      if (expMap.has(cand.cand_id)) {
        const ex = expMap.get(cand.cand_id);
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id})
          SET c:Experienced, c += $props
        `, {
          cand_id: cand.cand_id,
          props: cleanProps({
            total_exp: ex.total_exp,
            current_company: ex.current_company
          })
        });
      }

      // Candidate foreign key edges:
      // HAS_EDUCATION
      if (cand.edu_id) {
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id}), (ed:Education {edu_id: $edu_id})
          MERGE (c)-[:HAS_EDUCATION]->(ed)
        `, { cand_id: cand.cand_id, edu_id: cand.edu_id });
      }

      // SUBMITTED_APPLICATION
      if (cand.app_id) {
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id}), (a:Application {app_id: $app_id})
          MERGE (c)-[:SUBMITTED_APPLICATION]->(a)
        `, { cand_id: cand.cand_id, app_id: cand.app_id });
      }

      // HAS_DEPENDENT
      if (cand.dep_id) {
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id}), (d:Dependent {dep_id: $dep_id})
          MERGE (c)-[:HAS_DEPENDENT]->(d)
        `, { cand_id: cand.cand_id, dep_id: cand.dep_id });
      }

      // HAS_INTERVIEW
      if (cand.int_id) {
        await session.run(`
          MATCH (c:Candidate {cand_id: $cand_id}), (i:Interview {int_id: $int_id})
          MERGE (c)-[:HAS_INTERVIEW]->(i)
        `, { cand_id: cand.cand_id, int_id: cand.int_id });
      }
    }

    // -------------------------------------------------------------
    // 12. Candidate Experience Link (HAS_EXPERIENCE)
    // -------------------------------------------------------------
    console.log('  - Migrating HAS_EXPERIENCE edges (Experience_Candidate)...');
    for (const ec of (tableData['Experience_Candidate'] || [])) {
      await session.run(`
        MATCH (c:Candidate {cand_id: $cand_id}), (ex:Experience {exp_id: $exp_id})
        MERGE (c)-[:HAS_EXPERIENCE]->(ex)
      `, { cand_id: ec.cand_id, exp_id: ec.exp_id });
    }

    // -------------------------------------------------------------
    // 13. Reified Entities: Assessed_For -> Assessment
    // -------------------------------------------------------------
    console.log('  - Reifying Assessed_For into Assessment entity nodes and 3 edges...');
    for (const row of (tableData['Assessed_For'] || [])) {
      const assessmentId = `ASSESS_${row.cand_id}_${row.job_key}_${row.skill_id}`;
      await session.run(`
        MERGE (ass:Assessment {assessment_id: $assessment_id})
        SET ass += $props
        WITH ass
        MATCH (c:Candidate {cand_id: $cand_id})
        MATCH (j:Job {job_key: $job_key})
        MATCH (s:Skill {skill_id: $skill_id})
        MERGE (c)-[:UNDERWENT]->(ass)
        MERGE (ass)-[:ASSESSED_FOR_JOB]->(j)
        MERGE (ass)-[:EVALUATED_SKILL]->(s)
      `, {
        assessment_id: assessmentId,
        cand_id: row.cand_id,
        job_key: row.job_key,
        skill_id: row.skill_id,
        props: cleanProps({
          cand_id: row.cand_id,
          job_key: row.job_key,
          skill_id: row.skill_id,
          match_per: row.match_per,
          ass_date: row.ass_date,
          ass_score: row.ass_score
        })
      });
    }

    // -------------------------------------------------------------
    // 14. Reified Entities: Refers -> Referral
    // -------------------------------------------------------------
    console.log('  - Reifying Refers into Referral entity nodes and HAS_REFERRAL edges...');
    for (const ref of (tableData['Refers'] || [])) {
      const referralId = `REF_${ref.cand_id}_${ref.referral_date}`;
      await session.run(`
        MERGE (r:Referral {referral_id: $referral_id})
        SET r += $props
        WITH r
        MATCH (c:Candidate {cand_id: $cand_id})
        MERGE (c)-[:HAS_REFERRAL]->(r)
      `, {
        referral_id: referralId,
        cand_id: ref.cand_id,
        props: cleanProps({
          cand_id: ref.cand_id,
          referral_date: ref.referral_date,
          referral_status: ref.referral_status
        })
      });
    }

    // -------------------------------------------------------------
    // 15. Standard Relationships: Has, Requires, Applies, Matched_To, Prefers
    // -------------------------------------------------------------
    console.log('  - Migrating HAS_SKILL relationships (Has table)...');
    for (const h of (tableData['Has'] || [])) {
      await session.run(`
        MATCH (c:Candidate {cand_id: $cand_id}), (s:Skill {skill_id: $skill_id})
        MERGE (c)-[r:HAS_SKILL]->(s)
        SET r += $props
      `, {
        cand_id: h.cand_id,
        skill_id: h.skill_id,
        props: cleanProps({
          pgd_level: h.pgd_level,
          years_of_exp: h.years_of_exp
        })
      });
    }

    console.log('  - Migrating REQUIRES relationships (Requires table)...');
    for (const req of (tableData['Requires'] || [])) {
      await session.run(`
        MATCH (j:Job {job_key: $job_key}), (s:Skill {skill_id: $skill_id})
        MERGE (j)-[r:REQUIRES]->(s)
        SET r += $props
      `, {
        job_key: req.job_key,
        skill_id: req.skill_id,
        props: cleanProps({
          is_mandatory: req.is_mandatory === 'Y' || req.is_mandatory === 1,
          min_years: req.min_years
        })
      });
    }

    console.log('  - Migrating APPLIED_FOR relationships (Applies table)...');
    const candidateAppliesMap = new Map(); // cand_id -> job_key
    for (const ap of (tableData['Applies'] || [])) {
      candidateAppliesMap.set(ap.cand_id, ap.job_key);
      await session.run(`
        MATCH (c:Candidate {cand_id: $cand_id}), (j:Job {job_key: $job_key})
        MERGE (c)-[:APPLIED_FOR]->(j)
      `, { cand_id: ap.cand_id, job_key: ap.job_key });
    }

    console.log('  - Migrating MATCHED_TO relationships (Matched_To table with match_id identity)...');
    for (const m of (tableData['Matched_To'] || [])) {
      await session.run(`
        MATCH (c:Candidate {cand_id: $cand_id}), (j:Job {job_key: $job_key})
        MERGE (c)-[r:MATCHED_TO {match_id: $match_id}]->(j)
        SET r.match_date = $match_date
      `, {
        cand_id: m.cand_id,
        job_key: m.job_key,
        match_id: m.match_id,
        match_date: m.match_date
      });
    }

    console.log('  - Migrating PREFERS_LOCATION relationships (Prefers table)...');
    for (const p of (tableData['Prefers'] || [])) {
      await session.run(`
        MATCH (c:Candidate {cand_id: $cand_id}), (l:Location {pincode: $pincode})
        MERGE (c)-[:PREFERS_LOCATION]->(l)
      `, { cand_id: p.cand_id, pincode: p.pincode });
    }

    // -------------------------------------------------------------
    // 16. Corporate Relationships: Company_Employer, Recruitment
    // -------------------------------------------------------------
    console.log('  - Migrating AFFILIATED_WITH relationships (Company_Employer table)...');
    for (const ce of (tableData['Company_Employer'] || [])) {
      await session.run(`
        MATCH (e:Employer {emp_id: $emp_id}), (co:Company {comp_id: $comp_id})
        MERGE (e)-[:AFFILIATED_WITH]->(co)
      `, { emp_id: ce.emp_id, comp_id: ce.comp_id });
    }

    console.log('  - Migrating CONTRACTS_AGENCY relationships (Recruitment table)...');
    for (const r of (tableData['Recruitment'] || [])) {
      await session.run(`
        MATCH (e:Employer {emp_id: $emp_id}), (ra:RecruitmentAgency {agency_no: $agency_no})
        MERGE (e)-[:CONTRACTS_AGENCY]->(ra)
      `, { emp_id: r.emp_id, agency_no: r.agency_no });
    }

    // -------------------------------------------------------------
    // 17. Application to Job Links (FOR_JOB) with Audited Reconciliation
    // -------------------------------------------------------------
    console.log('  - Migrating FOR_JOB relationships (with audited reconciliation for APP021-APP025)...');
    // Map cand_id to candidate row
    const appToCandMap = new Map();
    for (const [candId, appId] of candAppMap.entries()) {
      appToCandMap.set(appId, candId);
    }

    // 17.1 Connect APP001 - APP020 via Job_Details.app_id
    for (const jd of (tableData['Job_Details'] || [])) {
      if (jd.app_id) {
        await session.run(`
          MATCH (a:Application {app_id: $app_id}), (j:Job {job_key: $job_key})
          MERGE (a)-[:FOR_JOB]->(j)
        `, { app_id: jd.app_id, job_key: jd.job_key });
      }
    }

    // 17.2 Reconcile APP021 - APP025 via Applies table
    const allApps = (tableData['Application'] || []).map(a => a.app_id);
    for (const appId of allApps) {
      // Check if FOR_JOB already exists
      const checkRes = await session.run(`
        MATCH (a:Application {app_id: $app_id})-[:FOR_JOB]->(j:Job)
        RETURN j.job_key AS job_key
      `, { app_id: appId });

      if (checkRes.records.length === 0) {
        // Find corresponding candidate
        const candId = appToCandMap.get(appId);
        const targetJobKey = candidateAppliesMap.get(candId);
        if (targetJobKey) {
          await session.run(`
            MATCH (a:Application {app_id: $app_id}), (j:Job {job_key: $job_key})
            MERGE (a)-[:FOR_JOB]->(j)
          `, { app_id: appId, job_key: targetJobKey });

          const logMsg = `Reconciled ${appId} (Candidate ${candId}) to Job ${targetJobKey} via Applies table (source Job_Details.app_id was NULL)`;
          reconciliationLog.push(logMsg);
          console.log(`    [Audited Reconciliation] ${logMsg}`);
        } else {
          console.warn(`    [Warning] Could not reconcile ${appId}: No candidate or target job found.`);
        }
      }
    }

    // -------------------------------------------------------------
    // 18. APP_USERS and APP_AUDIT_LOG
    // -------------------------------------------------------------
    console.log('  - Migrating AppUser and AuditLog system nodes...');
    const SEEDED_PASSWORDS = {
      recruiter: '$2a$10$oQcQB04tvJwyVNzDbh9yzePvBuR0RtWU3gNj22Cr5Mro3oqr2c6Fm',
      designer: '$2a$10$5VxY/cQ/aGc6VCPytjpbVeK6WnVZ6QWPsTbYztjn6uflyVOvZI5jO',
      dba_admin: '$2a$10$cHFc7Nva1YOkjaceVfH12Ohu8opxT2GWCe0cRKDEYONx9QEIUQ9Hq'
    };

    let userSeq = 1;
    for (const u of (tableData['APP_USERS'] || [])) {
      const userId = u.user_id ?? userSeq++;
      const genuineHash = SEEDED_PASSWORDS[u.username] || u.password_hash;
      await session.run(`
        MERGE (user:AppUser {username: $username})
        SET user.user_id = coalesce(user.user_id, $user_id),
            user += $props
      `, {
        username: u.username,
        user_id: userId,
        props: cleanProps({
          password_hash: genuineHash,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at || new Date().toISOString()
        })
      });
    }

    let logSeq = 1;
    for (const al of (tableData['APP_AUDIT_LOG'] || [])) {
      const logId = al.log_id ?? logSeq++;
      await session.run(`
        MERGE (log:AuditLog {log_id: $log_id})
        SET log += $props
      `, {
        log_id: logId,
        props: cleanProps({
          username: al.username,
          role: al.role,
          action: al.action,
          details: al.details,
          ip_address: al.ip_address,
          created_at: al.created_at || new Date().toISOString()
        })
      });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n[Phase 4/4] Migration Execution Complete in ' + elapsed + 's!');
    console.log(`Total Reconciled Records: ${reconciliationLog.length}`);

    return {
      success: true,
      elapsed,
      totalInserts,
      reconciliationLog
    };
  } catch (err) {
    console.error('\n[Migration Error] Execution failed:', err);
    throw err;
  } finally {
    await session.close();
  }
}

// Allow direct CLI invocation
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMigration()
    .then(async (res) => {
      console.log('\n[JRMS Migration] Done!');
      await driver.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n[JRMS Migration] FATAL ERROR:', err.message);
      await driver.close();
      process.exit(1);
    });
}
