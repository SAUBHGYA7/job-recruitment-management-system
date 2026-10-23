import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigration } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  NEO4J_URI = 'bolt://localhost:7687',
  NEO4J_USER = 'neo4j',
  NEO4J_PASSWORD,
  NEO4J_DATABASE = 'neo4j'
} = process.env;

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  { disableLosslessIntegers: true }
);

const EXPECTED_NODE_COUNTS = {
  Candidate: 25,
  Job: 20,
  Skill: 15,
  Employer: 15,
  Education: 25,
  Experience: 25,
  Interview: 25,
  Application: 25,
  Dependent: 25,
  Location: 12,
  Company: 8,
  RecruitmentAgency: 5,
  Assessment: 20,
  Referral: 14,
  AppUser: 3,
  AuditLog: 2,
  _Sequence: 8,
  'Candidate:Freelancer': 10,
  'Candidate:Fresher': 12,
  'Candidate:Experienced': 13
};

const EXPECTED_RELATIONSHIP_COUNTS = {
  HAS_SKILL: 35,
  REQUIRES: 27,
  APPLIED_FOR: 25,
  MATCHED_TO: 20,
  UNDERWENT: 20,
  ASSESSED_FOR_JOB: 20,
  EVALUATED_SKILL: 20,
  HAS_REFERRAL: 14,
  PREFERS_LOCATION: 25,
  HAS_EDUCATION: 25,
  HAS_EXPERIENCE: 25,
  HAS_INTERVIEW: 25,
  SUBMITTED_APPLICATION: 25,
  FOR_JOB: 25,
  HAS_DEPENDENT: 25,
  AFFILIATED_WITH: 15,
  CONTRACTS_AGENCY: 15,
  POSTED_JOB: 0
};

export async function runVerification() {
  const session = driver.session({ database: NEO4J_DATABASE });
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      testsFailed++;
    }
  }

  console.log('='.repeat(70));
  console.log('  JRMS NEO4J MIGRATION AUTOMATED VERIFICATION SUITE');
  console.log('='.repeat(70));

  try {
    // -------------------------------------------------------------
    // Test Suite 1: Node Count Assertions
    // -------------------------------------------------------------
    console.log('\n[Suite 1: Node Counts by Label]');
    for (const [label, expected] of Object.entries(EXPECTED_NODE_COUNTS)) {
      const cypher = label.includes(':')
        ? `MATCH (n:${label}) RETURN count(n) AS cnt`
        : `MATCH (n:\`${label}\`) RETURN count(n) AS cnt`;
      const res = await session.run(cypher);
      const actual = res.records[0].get('cnt');
      const isAudit = label === 'AuditLog';
      const isSequence = label === '_Sequence';
      const passes = (isAudit || isSequence) ? actual >= expected : actual === expected;
      assert(passes, `Label :${label} count (expected ${(isAudit || isSequence) ? '>=' : ''}${expected}, got ${actual})`);
    }

    // -------------------------------------------------------------
    // Test Suite 2: Relationship Count Assertions
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Relationship Counts by Type (18 Canonical Types)]');
    for (const [relType, expected] of Object.entries(EXPECTED_RELATIONSHIP_COUNTS)) {
      const res = await session.run(`MATCH ()-[r:\`${relType}\`]->() RETURN count(r) AS cnt`);
      const actual = res.records[0].get('cnt');
      assert(actual === expected, `Type [:${relType}] count (expected ${expected}, got ${actual})`);
    }

    // -------------------------------------------------------------
    // Test Suite 3: Multi-Valued Attributes & Data Structures
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Multi-Valued Attributes as Arrays]');
    const candidateArrayRes = await session.run(`
      MATCH (c:Candidate)
      RETURN 
        count(c) AS total,
        count(CASE WHEN size(c.emails) >= 1 THEN 1 END) AS withEmails,
        count(CASE WHEN size(c.phones) >= 1 THEN 1 END) AS withPhones
    `);
    const candTotal = candidateArrayRes.records[0].get('total');
    const candWithEmails = candidateArrayRes.records[0].get('withEmails');
    const candWithPhones = candidateArrayRes.records[0].get('withPhones');
    assert(candTotal === 25 && candWithEmails === 25, `All 25 candidates have non-empty emails array (${candWithEmails}/25)`);
    assert(candWithPhones === 25, `All 25 candidates have non-empty phones array (${candWithPhones}/25)`);

    const employerPhoneRes = await session.run(`
      MATCH (e:Employer)
      RETURN 
        count(e) AS total,
        count(CASE WHEN size(e.phones) >= 1 THEN 1 END) AS withPhones
    `);
    const empTotal = employerPhoneRes.records[0].get('total');
    const empWithPhones = employerPhoneRes.records[0].get('withPhones');
    assert(empTotal === 15 && empWithPhones === 15, `All 15 employers have non-empty phones array (${empWithPhones}/15)`);

    // -------------------------------------------------------------
    // Test Suite 4: Association Identity & Multi-Edge Preservation (Matched_To)
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Association Identity Keys & Zero Edge Collapse]');
    const matchIdRes = await session.run(`
      MATCH ()-[r:MATCHED_TO]->()
      RETURN count(r) AS totalRels, count(DISTINCT r.match_id) AS distinctMatchIds
    `);
    const totalMatches = matchIdRes.records[0].get('totalRels');
    const distinctMatchIds = matchIdRes.records[0].get('distinctMatchIds');
    assert(totalMatches === 20 && distinctMatchIds === 20, `MATCHED_TO edges preserve unique match_id property (${distinctMatchIds}/20)`);

    // -------------------------------------------------------------
    // Test Suite 5: Reified Entities Integrity (Assessment & Referral)
    // -------------------------------------------------------------
    console.log('\n[Suite 5: Reified Entity Verification]');
    const assessmentRes = await session.run(`
      MATCH (c:Candidate)-[:UNDERWENT]->(a:Assessment)-[:ASSESSED_FOR_JOB]->(j:Job)
      MATCH (a)-[:EVALUATED_SKILL]->(s:Skill)
      RETURN count(a) AS fullyConnectedAssessments
    `);
    const fullyConnectedAssessments = assessmentRes.records[0].get('fullyConnectedAssessments');
    assert(fullyConnectedAssessments === 20, `All 20 Assessments are 3-way connected to Candidate, Job, and Skill (${fullyConnectedAssessments}/20)`);

    const referralRes = await session.run(`
      MATCH (c:Candidate)-[:HAS_REFERRAL]->(r:Referral)
      RETURN count(r) AS connectedReferrals
    `);
    const connectedReferrals = referralRes.records[0].get('connectedReferrals');
    assert(connectedReferrals === 14, `All 14 Referrals are connected to Candidate (${connectedReferrals}/14)`);

    // -------------------------------------------------------------
    // Test Suite 6: Audited Application Reconciliation (APP021 - APP025)
    // -------------------------------------------------------------
    console.log('\n[Suite 6: Application Lifecycle Reconciliation Verification]');
    const appEdgesRes = await session.run(`
      MATCH (a:Application)-[:FOR_JOB]->(j:Job)
      RETURN count(a) AS totalAppEdges
    `);
    const totalAppEdges = appEdgesRes.records[0].get('totalAppEdges');
    assert(totalAppEdges === 25, `Application-to-Job (:FOR_JOB) has 25 edges (20 from seed + 5 reconciled)`);

    const orphanAppRes = await session.run(`
      MATCH (a:Application)
      WHERE NOT (a)-[:FOR_JOB]->(:Job)
      RETURN count(a) AS orphanApps
    `);
    const orphanApps = orphanAppRes.records[0].get('orphanApps');
    assert(orphanApps === 0, `Zero orphaned Application nodes without a target Job (${orphanApps} orphans)`);

    // Check specific reconciled pairs
    const reconciliations = [
      { app: 'APP021', cand: 121, job: 7 },
      { app: 'APP022', cand: 122, job: 12 },
      { app: 'APP023', cand: 123, job: 16 },
      { app: 'APP024', cand: 124, job: 6 },
      { app: 'APP025', cand: 125, job: 10 }
    ];
    for (const rec of reconciliations) {
      const checkRes = await session.run(`
        MATCH (c:Candidate {cand_id: $cand})-[:SUBMITTED_APPLICATION]->(a:Application {app_id: $app})-[:FOR_JOB]->(j:Job {job_key: $job})
        RETURN count(a) AS matched
      `, rec);
      const matched = checkRes.records[0].get('matched');
      assert(matched === 1, `Candidate ${rec.cand} (${rec.app}) correctly reconciled to Job ${rec.job}`);
    }

    // -------------------------------------------------------------
    // Test Suite 7: Schema Constraints Active Verification
    // -------------------------------------------------------------
    console.log('\n[Suite 7: Active Schema Constraints]');
    const constraintsRes = await session.run(`SHOW CONSTRAINTS YIELD name, type WHERE type = 'UNIQUENESS';`);
    assert(constraintsRes.records.length === 17, `17 Uniqueness constraints active in Neo4j (${constraintsRes.records.length}/17)`);

    // -------------------------------------------------------------
    // Test Suite 8: Sample Entity Field-Level Parity Checks
    // -------------------------------------------------------------
    console.log('\n[Suite 8: Field-Level Parity Sampling]');
    // Sample Candidate 101
    const cand101Res = await session.run(`
      MATCH (c:Candidate {cand_id: 101})
      RETURN c.fname AS fname, c.lname AS lname, c.city AS city, c.house_no AS house_no
    `);
    const cand101 = cand101Res.records[0];
    assert(
      cand101.get('fname') === 'Ram' && cand101.get('lname') === 'Mishra' && cand101.get('city') === 'Jaipur' && cand101.get('house_no') === '83',
      `Candidate 101 field parity (Ram Mishra, Jaipur, house_no: ${cand101.get('house_no')})`
    );

    // Sample Job 1
    const job1Res = await session.run(`
      MATCH (j:Job {job_key: 1})
      RETURN j.job_id AS jobId, j.job_title AS title, j.salary AS salary, j.closing_date AS closingDate
    `);
    const job1 = job1Res.records[0];
    assert(
      job1.get('jobId') === 'J001' && job1.get('salary') === 65000 && job1.get('title') === 'S/W Dev',
      `Job 1 field parity (J001, Title: "${job1.get('title')}", Salary: ${job1.get('salary')})`
    );

    // Sample Assessment
    const ass101Res = await session.run(`
      MATCH (a:Assessment {assessment_id: 'ASSESS_101_1_S001'})
      RETURN a.match_per AS matchPer, a.ass_score AS score, a.ass_date AS assDate
    `);
    const ass101 = ass101Res.records[0];
    assert(
      ass101 && ass101.get('matchPer') === 92 && ass101.get('score') === 90,
      `Assessment ASSESS_101_1_S001 field parity (match_per: 92, score: 90)`
    );

    // -------------------------------------------------------------
    // Test Suite 9: Second Run Idempotency Test
    // -------------------------------------------------------------
    console.log('\n[Suite 9: Second Migration Run Idempotency Verification]');
    const countBeforeRes = await session.run(`
      MATCH (n) WITH count(n) AS nodeCount
      MATCH ()-[r]->() WITH nodeCount, count(r) AS relCount
      RETURN nodeCount, relCount
    `);
    const nodeCountBefore = countBeforeRes.records[0].get('nodeCount');
    const relCountBefore = countBeforeRes.records[0].get('relCount');
    console.log(`  State before 2nd run: ${nodeCountBefore} nodes, ${relCountBefore} relationships.`);

    console.log('  Executing second migration pass...');
    await runMigration();

    const countAfterRes = await session.run(`
      MATCH (n) WITH count(n) AS nodeCount
      MATCH ()-[r]->() WITH nodeCount, count(r) AS relCount
      RETURN nodeCount, relCount
    `);
    const nodeCountAfter = countAfterRes.records[0].get('nodeCount');
    const relCountAfter = countAfterRes.records[0].get('relCount');
    console.log(`  State after 2nd run:  ${nodeCountAfter} nodes, ${relCountAfter} relationships.`);

    assert(nodeCountBefore === nodeCountAfter, `Node count identical on 2nd run (Zero duplicate nodes created: ${nodeCountBefore} == ${nodeCountAfter})`);
    assert(relCountBefore === relCountAfter, `Relationship count identical on 2nd run (Zero duplicate edges created: ${relCountBefore} == ${relCountAfter})`);

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(70));
    console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('='.repeat(70));

    return {
      passed: testsPassed,
      failed: testsFailed,
      total: testsPassed + testsFailed
    };
  } catch (err) {
    console.error('\n[Verification Error] Test suite encountered an exception:', err);
    throw err;
  } finally {
    await session.close();
  }
}

// Allow direct CLI invocation
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runVerification()
    .then(async (res) => {
      await driver.close();
      if (res.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(async (err) => {
      console.error('Fatal test runner error:', err);
      await driver.close();
      process.exit(1);
    });
}
