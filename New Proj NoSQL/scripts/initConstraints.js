import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const CONSTRAINTS = [
  { name: 'uq_candidate_id', cypher: 'CREATE CONSTRAINT uq_candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.cand_id IS UNIQUE;' },
  { name: 'uq_job_key', cypher: 'CREATE CONSTRAINT uq_job_key IF NOT EXISTS FOR (j:Job) REQUIRE j.job_key IS UNIQUE;' },
  { name: 'uq_skill_id', cypher: 'CREATE CONSTRAINT uq_skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.skill_id IS UNIQUE;' },
  { name: 'uq_emp_id', cypher: 'CREATE CONSTRAINT uq_emp_id IF NOT EXISTS FOR (e:Employer) REQUIRE e.emp_id IS UNIQUE;' },
  { name: 'uq_edu_id', cypher: 'CREATE CONSTRAINT uq_edu_id IF NOT EXISTS FOR (ed:Education) REQUIRE ed.edu_id IS UNIQUE;' },
  { name: 'uq_exp_id', cypher: 'CREATE CONSTRAINT uq_exp_id IF NOT EXISTS FOR (ex:Experience) REQUIRE ex.exp_id IS UNIQUE;' },
  { name: 'uq_int_id', cypher: 'CREATE CONSTRAINT uq_int_id IF NOT EXISTS FOR (i:Interview) REQUIRE i.int_id IS UNIQUE;' },
  { name: 'uq_app_id', cypher: 'CREATE CONSTRAINT uq_app_id IF NOT EXISTS FOR (a:Application) REQUIRE a.app_id IS UNIQUE;' },
  { name: 'uq_dep_id', cypher: 'CREATE CONSTRAINT uq_dep_id IF NOT EXISTS FOR (d:Dependent) REQUIRE d.dep_id IS UNIQUE;' },
  { name: 'uq_location_pincode', cypher: 'CREATE CONSTRAINT uq_location_pincode IF NOT EXISTS FOR (l:Location) REQUIRE l.pincode IS UNIQUE;' },
  { name: 'uq_company_id', cypher: 'CREATE CONSTRAINT uq_company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.comp_id IS UNIQUE;' },
  { name: 'uq_agency_no', cypher: 'CREATE CONSTRAINT uq_agency_no IF NOT EXISTS FOR (ra:RecruitmentAgency) REQUIRE ra.agency_no IS UNIQUE;' },
  { name: 'uq_assessment_id', cypher: 'CREATE CONSTRAINT uq_assessment_id IF NOT EXISTS FOR (a:Assessment) REQUIRE a.assessment_id IS UNIQUE;' },
  { name: 'uq_referral_id', cypher: 'CREATE CONSTRAINT uq_referral_id IF NOT EXISTS FOR (r:Referral) REQUIRE r.referral_id IS UNIQUE;' },
  { name: 'uq_app_user_id', cypher: 'CREATE CONSTRAINT uq_app_user_id IF NOT EXISTS FOR (u:AppUser) REQUIRE u.user_id IS UNIQUE;' },
  { name: 'uq_app_user_username', cypher: 'CREATE CONSTRAINT uq_app_user_username IF NOT EXISTS FOR (u:AppUser) REQUIRE u.username IS UNIQUE;' },
  { name: 'uq_audit_log_id', cypher: 'CREATE CONSTRAINT uq_audit_log_id IF NOT EXISTS FOR (al:AuditLog) REQUIRE al.log_id IS UNIQUE;' }
];

const INDEXES = [
  { name: 'idx_candidate_names', cypher: 'CREATE INDEX idx_candidate_names IF NOT EXISTS FOR (c:Candidate) ON (c.lname, c.fname);' },
  { name: 'idx_job_title', cypher: 'CREATE INDEX idx_job_title IF NOT EXISTS FOR (j:Job) ON (j.job_title);' },
  { name: 'idx_skill_name', cypher: 'CREATE INDEX idx_skill_name IF NOT EXISTS FOR (s:Skill) ON (s.skill_name);' },
  { name: 'idx_employer_company', cypher: 'CREATE INDEX idx_employer_company IF NOT EXISTS FOR (e:Employer) ON (e.company_name);' }
];

export async function initConstraints() {
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log(`[Schema Init] Connecting to Neo4j at ${NEO4J_URI} (${NEO4J_DATABASE})...`);

  try {
    console.log(`[Schema Init] Creating 17 uniqueness constraints...`);
    for (const c of CONSTRAINTS) {
      process.stdout.write(`  - Applying ${c.name}... `);
      await session.run(c.cypher);
      console.log('OK');
    }

    console.log(`[Schema Init] Creating 4 search indexes...`);
    for (const idx of INDEXES) {
      process.stdout.write(`  - Applying ${idx.name}... `);
      await session.run(idx.cypher);
      console.log('OK');
    }

    // Verify constraints in database
    const constraintRes = await session.run('SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties;');
    console.log(`\n[Schema Init] Verification: Found ${constraintRes.records.length} active constraints in Neo4j:`);
    for (const rec of constraintRes.records) {
      console.log(`  - ${rec.get('name')} (${rec.get('type')}) on :${rec.get('labelsOrTypes')} [${rec.get('properties')}]`);
    }

    const indexRes = await session.run('SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties WHERE type <> "LOOKUP";');
    console.log(`\n[Schema Init] Verification: Found ${indexRes.records.length} non-lookup indexes in Neo4j.`);
    return true;
  } catch (err) {
    console.error(`[Schema Init] ERROR initializing constraints/indexes:`, err);
    throw err;
  } finally {
    await session.close();
  }
}

// Allow direct CLI invocation
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  initConstraints()
    .then(async () => {
      console.log('\n[Schema Init] Constraints and indexes initialized successfully.');
      await driver.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\n[Schema Init] FAILED:', err.message);
      await driver.close();
      process.exit(1);
    });
}
