import http from 'http';
import app from '../app.js';
import { initNeo4jDriver, closeNeo4jDriver, runQuery, getNextSequence } from '../db/neo4j.js';
import bcrypt from 'bcryptjs';

let server;
let baseUrl;
let dbaToken = '';
let userToken = '';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, headers: res.headers, body };
}

async function runPhase31SafetySuite() {
  console.log('================================================================');
  console.log('🛡️  PHASE 3.1: BACKEND SAFETY REVIEW & TARGETED AUDIT SUITE');
  console.log('================================================================');

  try {
    await initNeo4jDriver();

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`[Test Server] Ephemeral test server active on ${baseUrl}`);
        resolve();
      });
    });

    // -----------------------------------------------------------------
    // Suite 1: Authentication & Bcrypt Verification (Zero Fallback / Bypass)
    // -----------------------------------------------------------------
    console.log('\n[Suite 1: Authentication & Stored Password Hashes (Zero Bypass)]');

    // 1.1 Verified Seeded User: recruiter / User@123
    const recruiterLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'User@123' })
    });
    assert(recruiterLogin.status === 200, 'recruiter logs in successfully with stored Bcrypt hash (HTTP 200)');
    assert(recruiterLogin.body?.user?.role === 'USER', 'recruiter assigned role USER');
    userToken = recruiterLogin.body.token;

    // 1.2 Verified Seeded User: designer / Designer@123
    const designerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'designer', password: 'Designer@123' })
    });
    assert(designerLogin.status === 200, 'designer logs in successfully with stored Bcrypt hash (HTTP 200)');
    assert(designerLogin.body?.user?.role === 'DATABASE_DESIGNER', 'designer assigned role DATABASE_DESIGNER');

    // 1.3 Verified Seeded User: dba_admin / Dba@123
    const dbaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dba_admin', password: 'Dba@123' })
    });
    assert(dbaLogin.status === 200, 'dba_admin logs in successfully with stored Bcrypt hash (HTTP 200)');
    assert(dbaLogin.body?.user?.role === 'DBA', 'dba_admin assigned role DBA');
    dbaToken = dbaLogin.body.token;

    // 1.4 Strict Password Rejection (Bcrypt mismatch)
    const wrongPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dba_admin', password: 'InvalidPassword2026!' })
    });
    assert(wrongPassLogin.status === 401, 'Password mismatch returns HTTP 401 (no fallback bypass)');
    assert(wrongPassLogin.body?.message === 'Invalid username or password.', 'Error message is generic and uninformative');

    // 1.5 Rejection of Insecure Alias / Bypass Attempt
    const aliasLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'Dba@123' })
    });
    assert(aliasLogin.status === 401, 'Unregistered alias username returns HTTP 401 (strict username resolution)');

    // 1.6 Deactivated Account Rejection
    const deactHash = await bcrypt.hash('Deact@123', 10);
    await runQuery(`
      MERGE (u:AppUser {username: 'deactivated_test_user'})
      SET u.user_id = 9999, u.password_hash = $hash, u.role = 'USER', u.is_active = 0, u.full_name = 'Deactivated User'
    `, { hash: deactHash });

    const deactLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'deactivated_test_user', password: 'Deact@123' })
    });
    assert(deactLogin.status === 403, 'Deactivated account rejected with HTTP 403 Forbidden');
    assert(deactLogin.body?.message?.includes('deactivated'), 'Deactivation message clearly communicated');
    await runQuery(`MATCH (u:AppUser {username: 'deactivated_test_user'}) DETACH DELETE u`);

    // 1.7 Mock Token Rejection (Bearer jwt_token_dba must fail)
    const mockTokenRes = await request('/api/candidates', {
      headers: { Authorization: 'Bearer jwt_token_dba' }
    });
    assert(mockTokenRes.status === 401, 'Mock / unverified token rejected with HTTP 401 (JWT verify enforced)');

    // -----------------------------------------------------------------
    // Suite 2: Deletion Integrity (Multiple Children & Job Applications)
    // -----------------------------------------------------------------
    console.log('\n[Suite 2: Deletion Integrity & Cascading Safeguards]');

    // 2.1 Candidate with multiple assessments and referrals
    const testCandId = 9991;
    await runQuery(`
      MERGE (c:Candidate {cand_id: $candId})
      SET c.fname = 'MultiChild', c.lname = 'TestCandidate'
      WITH c
      MERGE (a1:Assessment {assessment_id: 'ASSESS_TEST_DEL_1'})
      MERGE (a2:Assessment {assessment_id: 'ASSESS_TEST_DEL_2'})
      MERGE (c)-[:UNDERWENT]->(a1)
      MERGE (c)-[:UNDERWENT]->(a2)
      WITH c
      MERGE (r1:Referral {referral_id: 'REF_TEST_DEL_1'})
      MERGE (r2:Referral {referral_id: 'REF_TEST_DEL_2'})
      MERGE (c)-[:HAS_REFERRAL]->(r1)
      MERGE (c)-[:HAS_REFERRAL]->(r2)
      WITH c
      MERGE (app:Application {app_id: 'APP_TEST_HIST_1'})
      SET app.app_status = 'Submitted', app.final_result = 'Pending'
      MERGE (c)-[:SUBMITTED_APPLICATION]->(app)
      WITH app
      MATCH (j:Job {job_key: 1})
      MERGE (app)-[:FOR_JOB]->(j)
    `, { candId: testCandId });

    // Verify candidate and children exist before deletion
    const beforeCand = await runQuery(`
      MATCH (c:Candidate {cand_id: $candId})
      OPTIONAL MATCH (c)-[:UNDERWENT]->(a:Assessment)
      OPTIONAL MATCH (c)-[:HAS_REFERRAL]->(r:Referral)
      OPTIONAL MATCH (c)-[:SUBMITTED_APPLICATION]->(app:Application)
      RETURN count(DISTINCT c) AS cCount, count(DISTINCT a) AS aCount, count(DISTINCT r) AS rCount, count(DISTINCT app) AS appCount
    `, { candId: testCandId });
    assert(beforeCand[0]?.cCount === 1, 'Test candidate created with children');
    assert(beforeCand[0]?.aCount === 2, 'Candidate has 2 connected assessments');
    assert(beforeCand[0]?.rCount === 2, 'Candidate has 2 connected referrals');
    assert(beforeCand[0]?.appCount === 1, 'Candidate has 1 connected application');

    // Delete Candidate via API
    const delCandRes = await request(`/api/candidates/${testCandId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(delCandRes.status === 200, `DELETE /api/candidates/${testCandId} returns HTTP 200`);

    // Verify Candidate and child reified nodes are deleted
    const afterCand = await runQuery(`
      MATCH (c:Candidate {cand_id: $candId})
      RETURN count(c) AS cCount
    `, { candId: testCandId });
    assert(afterCand[0]?.cCount === 0, 'Candidate node deleted cleanly');

    const afterAssessments = await runQuery(`
      MATCH (a:Assessment)
      WHERE a.assessment_id IN ['ASSESS_TEST_DEL_1', 'ASSESS_TEST_DEL_2']
      RETURN count(a) AS aCount
    `);
    assert(afterAssessments[0]?.aCount === 0, 'All connected reified assessments deleted (zero dangling assessments)');

    const afterReferrals = await runQuery(`
      MATCH (r:Referral)
      WHERE r.referral_id IN ['REF_TEST_DEL_1', 'REF_TEST_DEL_2']
      RETURN count(r) AS rCount
    `);
    assert(afterReferrals[0]?.rCount === 0, 'All connected reified referrals deleted (zero dangling referrals)');

    // Verify shared Application history was preserved
    const afterApp = await runQuery(`
      MATCH (app:Application {app_id: 'APP_TEST_HIST_1'})
      OPTIONAL MATCH (app)-[:FOR_JOB]->(j:Job)
      RETURN count(app) AS appCount, j.job_key AS jobKey
    `);
    assert(afterApp[0]?.appCount === 1, 'Application history node PRESERVED intact (not accidentally deleted)');
    assert(afterApp[0]?.jobKey === 1, 'Application history maintains link to target job');

    // 2.2 Job deletion when applications already reference that job
    const testJobKey = 9992;
    await runQuery(`
      MERGE (j:Job {job_key: $jobKey})
      SET j.job_id = 'JOB_DEL_HIST_TEST', j.job_title = 'Deletion History Test Role'
      WITH j
      MERGE (app:Application {app_id: 'APP_JOB_HIST_TEST'})
      SET app.app_status = 'Under Review'
      MERGE (app)-[:FOR_JOB]->(j)
    `, { jobKey: testJobKey });

    const delJobRes = await request(`/api/jobs/${testJobKey}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(delJobRes.status === 200, `DELETE /api/jobs/${testJobKey} returns HTTP 200`);

    // Verify Job deleted but Application history node preserved
    const checkJobDel = await runQuery(`MATCH (j:Job {job_key: $jobKey}) RETURN count(j) AS cnt`, { jobKey: testJobKey });
    assert(checkJobDel[0]?.cnt === 0, 'Job node deleted cleanly');

    const checkAppPreserved = await runQuery(`
      MATCH (app:Application {app_id: 'APP_JOB_HIST_TEST'})
      RETURN count(app) AS cnt
    `);
    assert(checkAppPreserved[0]?.cnt === 1, 'Application history preserved when referenced Job was deleted');

    // Clean up test application history nodes
    await runQuery(`MATCH (app:Application) WHERE app.app_id IN ['APP_TEST_HIST_1', 'APP_JOB_HIST_TEST'] DETACH DELETE app`);

    // -----------------------------------------------------------------
    // Suite 3: ID Generation Concurrency & Seed Range Protection
    // -----------------------------------------------------------------
    console.log('\n[Suite 3: ID Generation Concurrency & Range Protection]');

    // 3.1 Concurrency test: 50 simultaneous parallel requests
    const concurrencyCount = 50;
    const concurrentPromises = [];
    for (let i = 0; i < concurrencyCount; i++) {
      concurrentPromises.push(getNextSequence('safety_concurrency_seq', 1));
    }
    const generatedIds = await Promise.all(concurrentPromises);
    const uniqueIds = new Set(generatedIds);

    assert(generatedIds.length === concurrencyCount, `Generated 50 sequence IDs under concurrent execution`);
    assert(uniqueIds.size === concurrencyCount, `All 50 generated IDs are strictly unique (Zero collisions: ${uniqueIds.size}/${concurrencyCount})`);
    assert(Math.min(...generatedIds) === 1, 'Minimum generated ID is 1');
    assert(Math.max(...generatedIds) === concurrencyCount, `Maximum generated ID is ${concurrencyCount}`);

    // 3.2 Seed range protection test
    // Candidate seeded range is 101..125. Next sequence must be >= 126 and never overwrite seeded nodes.
    const candSeqVal = await getNextSequence('candidate', 126);
    assert(candSeqVal >= 126, `Candidate sequence generator guarantees ID >= 126 (got: ${candSeqVal})`);

    const collisionCheck = await runQuery(`
      MATCH (c:Candidate {cand_id: $candSeqVal})
      RETURN count(c) AS cnt
    `, { candSeqVal });
    assert(collisionCheck[0]?.cnt === 0, `Generated ID ${candSeqVal} does not collide with any existing candidate`);

    // Clean up test sequence node
    await runQuery(`MATCH (s:_Sequence {name: 'safety_concurrency_seq'}) DETACH DELETE s`);

    // -----------------------------------------------------------------
    // Suite 4: Database Failure Handling & Safe Error Responses
    // -----------------------------------------------------------------
    console.log('\n[Suite 4: Database Failure Handling & Information Leakage Prevention]');

    // 4.1 Simulate Database Disconnection
    console.log('  Simulating Neo4j offline state (closing driver)...');
    await closeNeo4jDriver();

    // Health check returns HTTP 503
    const offlineHealth = await request('/api/health');
    assert(offlineHealth.status === 503, 'GET /api/health returns HTTP 503 Service Unavailable when DB is offline');
    assert(offlineHealth.body?.status === 'DEGRADED', 'Health status indicates DEGRADED');
    assert(offlineHealth.body?.database?.connected === false, 'database.connected reports false');

    // Login returns HTTP 503 without leaking credentials
    const offlineLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'User@123' })
    });
    assert(offlineLogin.status === 503, 'POST /api/auth/login returns HTTP 503 when DB is offline');
    assert(!JSON.stringify(offlineLogin.body).includes('User@123'), 'Login response does not leak password');
    assert(!JSON.stringify(offlineLogin.body).includes('password_hash'), 'Login response does not leak password hash');
    assert(offlineLogin.body?.message?.includes('Database service unavailable'), 'Clean, user-safe error message');

    // Authenticated API operation returns HTTP 503 without leaking stack traces or credentials
    const offlineApi = await request('/api/candidates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(offlineApi.status === 503, 'GET /api/candidates returns HTTP 503 when DB is offline');
    assert(!JSON.stringify(offlineApi.body).includes(process.env.NEO4J_PASSWORD || 'secret'), 'API response does not leak database credentials');

    // 4.2 Reconnect Neo4j Driver
    console.log('  Restoring Neo4j live driver connection...');
    await initNeo4jDriver();

    const restoredHealth = await request('/api/health');
    assert(restoredHealth.status === 200, 'GET /api/health returns HTTP 200 after driver restored');
    assert(restoredHealth.body?.status === 'ONLINE', 'System status restored to ONLINE');
    assert(restoredHealth.body?.database?.connected === true, 'database.connected restored to true');

    // -----------------------------------------------------------------
    // Suite 5: API Compatibility & Contract Parity
    // -----------------------------------------------------------------
    console.log('\n[Suite 5: API Compatibility & Contract Verification]');

    // 5.1 Validation Error format (Candidate missing fname)
    const valErrorRes = await request('/api/candidates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ lname: 'MissingFname' })
    });
    assert(valErrorRes.status === 400, 'Missing mandatory field returns HTTP 400 Bad Request');
    assert(valErrorRes.body?.success === false, 'Validation response indicates success: false');

    // 5.2 Unauthenticated access
    const unauthCandidateRes = await request('/api/candidates');
    assert(unauthCandidateRes.status === 401, 'Protected route without token returns HTTP 401 Unauthorized');

    // 5.3 Forbidden role boundary
    const forbiddenDbaRes = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(forbiddenDbaRes.status === 403, 'USER token accessing DBA endpoint returns HTTP 403 Forbidden');

    // 5.4 Resource Not Found
    const notFoundCandRes = await request('/api/candidates/999999', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(notFoundCandRes.status === 404, 'Non-existent candidate returns HTTP 404 Not Found');

    // 5.5 Response envelope parity (Candidate List)
    const candListRes = await request('/api/candidates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(candListRes.status === 200, 'GET /api/candidates returns HTTP 200');
    assert(typeof candListRes.body?.success === 'boolean', 'Response contains boolean "success"');
    assert(typeof candListRes.body?.total === 'number', 'Response contains numeric "total"');
    assert(Array.isArray(candListRes.body?.data), 'Response contains array "data"');

    // 5.6 Dashboard response envelope parity
    const dashRes = await request('/api/dashboard/user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(dashRes.status === 200, 'GET /api/dashboard/user returns HTTP 200');
    assert(dashRes.body?.data?.kpis !== undefined, 'Dashboard data includes kpis object');
    assert(dashRes.body?.data?.charts !== undefined, 'Dashboard data includes charts object');
    assert(Array.isArray(dashRes.body?.data?.recentApplications), 'Dashboard data includes recentApplications array');

    console.log('\n================================================================');
    console.log(`📊 PHASE 3.1 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('================================================================');

  } catch (err) {
    console.error('[FATAL PHASE 3.1 ERROR]:', err);
    failedTests++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Server] Ephemeral HTTP server closed.');
    }
    await closeNeo4jDriver();
    console.log('[Neo4j] Driver connection closed.');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runPhase31SafetySuite();
