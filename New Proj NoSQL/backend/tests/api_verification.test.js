import http from 'http';
import app from '../app.js';
import { initNeo4jDriver, closeNeo4jDriver, runQuery } from '../db/neo4j.js';

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

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 JRMS BACKEND INTEGRATION TEST SUITE (NEO4J BOLT)');
  console.log('================================================================');

  try {
    // Initialize Neo4j Driver
    await initNeo4jDriver();

    // Start ephemeral server
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
    // Suite 1: Healthcheck & Live Driver Status
    // -----------------------------------------------------------------
    console.log('\n[Suite 1: Healthcheck & Database Status]');
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    assert(healthRes.body?.status === 'ONLINE', 'System status is ONLINE');
    assert(healthRes.body?.database?.status === 'ONLINE', 'Database status is ONLINE');
    assert(healthRes.body?.database?.type === 'neo4j', 'Database engine is neo4j');
    assert(healthRes.body?.database?.latencyMs >= 0, 'Database latency is measurable');

    // -----------------------------------------------------------------
    // Suite 2: Authentication & Token Issuance
    // -----------------------------------------------------------------
    console.log('\n[Suite 2: Authentication & Session Management]');
    
    // Login with invalid credentials
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword123!' })
    });
    assert(invalidLogin.status === 401, 'Login with invalid password returns HTTP 401');
    assert(invalidLogin.body?.success === false, 'Invalid login response indicates success: false');

    // Login as DBA (dba_admin)
    const dbaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dba_admin', password: 'Dba@123' })
    });
    assert(dbaLogin.status === 200, 'Login as dba_admin returns HTTP 200');
    assert(dbaLogin.body?.success === true, 'Admin login response indicates success: true');
    assert(typeof dbaLogin.body?.token === 'string', 'Admin login returns a valid JWT string');
    assert(dbaLogin.body?.user?.role === 'DBA', 'Admin user role is DBA');
    dbaToken = dbaLogin.body.token;

    // Login as USER (recruiter)
    const userLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'User@123' })
    });
    assert(userLogin.status === 200, 'Login as recruiter returns HTTP 200');
    assert(userLogin.body?.user?.role === 'USER', 'Standard user role is USER');
    userToken = userLogin.body.token;

    // Verify /api/auth/me
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(meRes.status === 200, 'GET /api/auth/me with DBA token returns HTTP 200');
    assert(meRes.body?.user?.role === 'DBA', 'Current user identified as DBA role');

    // Verify /api/auth/logout with token
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200');

    // -----------------------------------------------------------------
    // Suite 3: RBAC Protection & Boundary Enforcement
    // -----------------------------------------------------------------
    console.log('\n[Suite 3: RBAC Protection & Boundary Enforcement]');
    
    // Unauthenticated request to protected candidate endpoint
    const unauthRes = await request('/api/candidates');
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/candidates returns HTTP 401');

    // USER role accessing DBA-only endpoint
    const userAccessDba = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAccessDba.status === 403, 'USER token accessing /api/dba/dashboard returns HTTP 403 Forbidden');

    // DBA role accessing DBA-only endpoint
    const dbaAccessDba = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaAccessDba.status === 200, 'DBA token accessing /api/dba/dashboard returns HTTP 200');

    // -----------------------------------------------------------------
    // Suite 4: Candidates CRUD & Destructive Deletion Safeguards
    // -----------------------------------------------------------------
    console.log('\n[Suite 4: Candidates CRUD & Destructive Deletion]');
    
    const candidatesList = await request('/api/candidates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(candidatesList.status === 200, 'GET /api/candidates returns HTTP 200');
    assert(candidatesList.body?.total >= 25, `Baseline candidate count >= 25 (found: ${candidatesList.body?.total})`);

    // Create candidate
    const createCandRes = await request('/api/candidates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        fname: 'Integration',
        lname: 'Tester',
        gender: 'M',
        dob: '1998-05-20',
        candidate_type: 'Experienced',
        email: ['integration.tester@jrms.org'],
        phone: ['+91 99999 88888'],
        address: { house_no: '404', street: 'Bolt Way', city: 'Graph City' },
        current_company: 'TestCorp',
        years_experience: 4
      })
    });
    assert(createCandRes.status === 201, 'POST /api/candidates returns HTTP 201 Created');
    const createdCandId = createCandRes.body?.data?.cand_id;
    assert(createdCandId !== undefined, `Auto-generated candidate ID assigned (${createdCandId})`);

    // Get specific candidate
    const getCandRes = await request(`/api/candidates/${createdCandId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(getCandRes.status === 200, `GET /api/candidates/${createdCandId} returns HTTP 200`);
    assert(getCandRes.body?.data?.fname === 'Integration', 'Candidate fname matches payload');
    assert(getCandRes.body?.data?.candidate_type === 'Experienced', 'Candidate type matches payload');
    assert(Array.isArray(getCandRes.body?.data?.emails), 'Candidate emails returned as array');

    // Update candidate
    const updateCandRes = await request(`/api/candidates/${createdCandId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        fname: 'IntegrationUpdated',
        lname: 'Tester',
        candidate_type: 'Experienced',
        current_company: 'TestCorp Updated'
      })
    });
    assert(updateCandRes.status === 200, `PUT /api/candidates/${createdCandId} returns HTTP 200`);

    // Delete candidate
    const deleteCandRes = await request(`/api/candidates/${createdCandId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteCandRes.status === 200, `DELETE /api/candidates/${createdCandId} returns HTTP 200`);

    // Verify deletion
    const verifyDelCand = await request(`/api/candidates/${createdCandId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(verifyDelCand.status === 404, 'Deleted candidate returns HTTP 404 Not Found');

    // -----------------------------------------------------------------
    // Suite 5: Jobs CRUD Operations
    // -----------------------------------------------------------------
    console.log('\n[Suite 5: Jobs CRUD Operations]');
    
    const jobsList = await request('/api/jobs', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(jobsList.status === 200, 'GET /api/jobs returns HTTP 200');
    assert(jobsList.body?.total >= 20, `Baseline job count >= 20 (found: ${jobsList.body?.total})`);

    // Create Job
    const createJobRes = await request('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        job_id: 'JOB-TEST-99',
        job_title: 'Neo4j Graph Architect',
        job_status: 'Open',
        salary: 145000,
        descriptive: 'Lead graph database modernization and high-performance Cypher development',
        posted_date: '2026-09-01',
        closing_date: '2026-10-31',
        skills: ['Neo4j', 'Cypher', 'Database Design']
      })
    });
    assert(createJobRes.status === 201, 'POST /api/jobs returns HTTP 201 Created');
    const createdJobKey = createJobRes.body?.data?.job_key;
    assert(createdJobKey !== undefined, `Auto-generated job_key assigned (${createdJobKey})`);

    // Update Job
    const updateJobRes = await request(`/api/jobs/${createdJobKey}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        job_title: 'Principal Graph Architect',
        salary: 160000,
        job_status: 'Open'
      })
    });
    assert(updateJobRes.status === 200, `PUT /api/jobs/${createdJobKey} returns HTTP 200`);

    // Delete Job
    const deleteJobRes = await request(`/api/jobs/${createdJobKey}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteJobRes.status === 200, `DELETE /api/jobs/${createdJobKey} returns HTTP 200`);

    // -----------------------------------------------------------------
    // Suite 6: Applications & Reconciled Relationships Verification
    // -----------------------------------------------------------------
    console.log('\n[Suite 6: Applications & Reconciled Relationships]');
    
    const appList = await request('/api/applications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(appList.status === 200, 'GET /api/applications returns HTTP 200');
    assert(appList.body?.total >= 25, `Baseline application count >= 25 (found: ${appList.body?.total})`);

    // Verify APP021-APP025 have valid candidate and job linkages
    const app21 = appList.body?.data?.find(a => a.app_id === 'APP021');
    const app25 = appList.body?.data?.find(a => a.app_id === 'APP025');
    assert(app21 && app21.candidate !== null, 'APP021 has verified candidate linkage');
    assert(app21 && app21.job !== null && app21.job.job_id !== undefined, `APP021 linked to job (${app21?.job?.job_id})`);
    assert(app25 && app25.candidate !== null, 'APP025 has verified candidate linkage');
    assert(app25 && app25.job !== null && app25.job.job_id !== undefined, `APP025 linked to job (${app25?.job?.job_id})`);

    // Create Application
    const createAppRes = await request('/api/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        cand_id: 1,
        job_id: 'JOB001',
        app_status: 'Submitted',
        final_result: 'Pending',
        app_date: '2026-09-15',
        offer_letter: 'Pending'
      })
    });
    assert(createAppRes.status === 201, 'POST /api/applications returns HTTP 201 Created');
    const createdAppId = createAppRes.body?.data?.app_id;
    assert(createdAppId !== undefined, `Auto-generated app_id assigned (${createdAppId})`);

    // Update Application
    const updateAppRes = await request(`/api/applications/${createdAppId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        app_status: 'Accepted',
        final_result: 'Selected'
      })
    });
    assert(updateAppRes.status === 200, `PUT /api/applications/${createdAppId} returns HTTP 200`);

    // Delete Application
    const deleteAppRes = await request(`/api/applications/${createdAppId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteAppRes.status === 200, `DELETE /api/applications/${createdAppId} returns HTTP 200`);

    // -----------------------------------------------------------------
    // Suite 7: Interviews CRUD Operations
    // -----------------------------------------------------------------
    console.log('\n[Suite 7: Interviews CRUD Operations]');
    
    const intList = await request('/api/interviews', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(intList.status === 200, 'GET /api/interviews returns HTTP 200');
    assert(intList.body?.total >= 25, `Baseline interview count >= 25 (found: ${intList.body?.total})`);

    // Create Interview
    const createIntRes = await request('/api/interviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        int_date: '2026-09-20',
        int_time: '14:30',
        int_mode: 'Online',
        location: 'Virtual Room A',
        int_status: 'Scheduled',
        score: 85,
        feedback: 'Strong graph architecture background',
        cand_id: 1
      })
    });
    assert(createIntRes.status === 201, 'POST /api/interviews returns HTTP 201 Created');
    const createdIntId = createIntRes.body?.data?.int_id;
    assert(createdIntId !== undefined, `Auto-generated int_id assigned (${createdIntId})`);

    // Update Interview
    const updateIntRes = await request(`/api/interviews/${createdIntId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        score: 92,
        feedback: 'Exceeded technical bar in graph querying'
      })
    });
    assert(updateIntRes.status === 200, `PUT /api/interviews/${createdIntId} returns HTTP 200`);

    // Delete Interview
    const deleteIntRes = await request(`/api/interviews/${createdIntId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteIntRes.status === 200, `DELETE /api/interviews/${createdIntId} returns HTTP 200`);

    // -----------------------------------------------------------------
    // Suite 8: Skills CRUD Operations
    // -----------------------------------------------------------------
    console.log('\n[Suite 8: Skills CRUD Operations]');
    
    const skillList = await request('/api/skills', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(skillList.status === 200, 'GET /api/skills returns HTTP 200');
    assert(skillList.body?.total >= 15, `Baseline skill count >= 15 (found: ${skillList.body?.total})`);

    // Create Skill
    const createSkillRes = await request('/api/skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        skill_name: 'Neo4j Cypher Optimization',
        skill_category: 'Graph Database',
        description: 'Advanced graph traversal, profiling, and query planning'
      })
    });
    assert(createSkillRes.status === 201, 'POST /api/skills returns HTTP 201 Created');
    const createdSkillId = createSkillRes.body?.data?.skill_id;
    assert(createdSkillId !== undefined, `Auto-generated skill_id assigned (${createdSkillId})`);

    // Update Skill
    const updateSkillRes = await request(`/api/skills/${createdSkillId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        skill_name: 'Neo4j Cypher Optimization Pro',
        skill_category: 'Graph Database'
      })
    });
    assert(updateSkillRes.status === 200, `PUT /api/skills/${createdSkillId} returns HTTP 200`);

    // Delete Skill
    const deleteSkillRes = await request(`/api/skills/${createdSkillId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteSkillRes.status === 200, `DELETE /api/skills/${createdSkillId} returns HTTP 200`);

    // -----------------------------------------------------------------
    // Suite 9: Employers CRUD Operations
    // -----------------------------------------------------------------
    console.log('\n[Suite 9: Employers CRUD Operations]');
    
    const employerList = await request('/api/employers', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(employerList.status === 200, 'GET /api/employers returns HTTP 200');
    assert(employerList.body?.total >= 15, `Baseline employer count >= 15 (found: ${employerList.body?.total})`);

    // Create Employer
    const createEmpRes = await request('/api/employers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        company_name: 'Graph Tech Innovators',
        founded_year: 2021,
        company_mail: 'hr@graphtech.example.com',
        website: 'https://graphtech.example.com',
        headquarter: 'Bengaluru',
        phone_no: ['+91 80 12345678', '+91 80 87654321']
      })
    });
    assert(createEmpRes.status === 201, 'POST /api/employers returns HTTP 201 Created');
    const createdEmpId = createEmpRes.body?.data?.emp_id;
    assert(createdEmpId !== undefined, `Auto-generated emp_id assigned (${createdEmpId})`);

    // Update Employer
    const updateEmpRes = await request(`/api/employers/${createdEmpId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        company_name: 'Graph Tech Innovators Global',
        headquarter: 'Bengaluru / Hybrid'
      })
    });
    assert(updateEmpRes.status === 200, `PUT /api/employers/${createdEmpId} returns HTTP 200`);

    // Delete Employer
    const deleteEmpRes = await request(`/api/employers/${createdEmpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteEmpRes.status === 200, `DELETE /api/employers/${createdEmpId} returns HTTP 200`);

    // -----------------------------------------------------------------
    // Suite 10: Dashboard Analytics & Graph Traversal KPIs
    // -----------------------------------------------------------------
    console.log('\n[Suite 10: User Dashboard KPIs & Analytics]');
    
    const dashboardRes = await request('/api/dashboard/user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(dashboardRes.status === 200, 'GET /api/dashboard/user returns HTTP 200');
    assert(dashboardRes.body?.data?.kpis?.totalCandidates >= 25, 'Dashboard KPIs report totalCandidates >= 25');
    assert(dashboardRes.body?.data?.kpis?.totalJobs >= 20, 'Dashboard KPIs report totalJobs >= 20');
    assert(dashboardRes.body?.data?.charts?.applicationsByStatus?.length > 0, 'Applications by status chart data populated');
    assert(dashboardRes.body?.data?.charts?.demandedSkills?.length > 0, 'Most demanded skills chart data populated');
    assert(dashboardRes.body?.data?.recentApplications?.length === 5, 'Recent applications returns 5 graph-joined rows');

    // -----------------------------------------------------------------
    // Suite 11: Reports Engine (User, Designer, DBA)
    // -----------------------------------------------------------------
    console.log('\n[Suite 11: Reports Engine]');
    
    const userReports = await request('/api/reports/user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userReports.status === 200, 'GET /api/reports/user returns HTTP 200');
    assert(userReports.body?.data?.appReport?.length >= 25, 'User reports appReport contains >= 25 applications');
    assert(userReports.body?.data?.skillReport?.length >= 15, 'User reports skillReport contains >= 15 skills');
    assert(userReports.body?.data?.salaryReport?.length >= 20, 'User reports salaryReport contains >= 20 jobs');

    const designerReports = await request('/api/reports/designer', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(designerReports.status === 200, 'GET /api/reports/designer returns HTTP 200');
    assert(designerReports.body?.data?.tableReport?.length > 0, 'Designer table report populated');

    const dbaReports = await request('/api/reports/dba', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaReports.status === 200, 'GET /api/reports/dba returns HTTP 200');
    assert(typeof dbaReports.body?.data?.userRoleCounts === 'object', 'DBA reports contains userRoleCounts');
    assert(typeof dbaReports.body?.data?.auditActionCounts === 'object', 'DBA reports contains auditActionCounts');

    // -----------------------------------------------------------------
    // Suite 12: DBA Console Allowlist Security & Threat Rejection
    // -----------------------------------------------------------------
    console.log('\n[Suite 12: DBA Query Console Security]');
    
    // Execute allowlisted template LIST_CANDIDATES
    const allowlistedCandidateRes = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'LIST_CANDIDATES' })
    });
    assert(allowlistedCandidateRes.status === 200, 'Allowlisted template LIST_CANDIDATES returns HTTP 200');
    assert(allowlistedCandidateRes.body?.data?.rows?.length > 0, 'LIST_CANDIDATES returns candidate rows');

    // Execute allowlisted template SEARCH_JOBS
    const allowlistedJobRes = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'SEARCH_JOBS' })
    });
    assert(allowlistedJobRes.status === 200, 'Allowlisted template SEARCH_JOBS returns HTTP 200');

    // Security Gate 1: Rejection of destructive Cypher
    const maliciousCypherRes = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'MATCH (n) DETACH DELETE n' })
    });
    assert(maliciousCypherRes.status === 403, 'Malicious DETACH DELETE Cypher returns HTTP 403 Forbidden');
    assert(maliciousCypherRes.body?.message?.includes('Security Violation'), 'Response explicitly notes Security Violation');

    // Security Gate 2: Rejection of destructive SQL DDL
    const maliciousSqlRes = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'DROP TABLE Candidate' })
    });
    assert(maliciousSqlRes.status === 403, 'Malicious DROP TABLE SQL returns HTTP 403 Forbidden');

    // -----------------------------------------------------------------
    // Suite 13: Audit Logging Persistence & Integrity
    // -----------------------------------------------------------------
    console.log('\n[Suite 13: Audit Log Persistence & Integrity]');
    
    const auditRes = await request('/api/dba/audit-log', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(auditRes.status === 200, 'GET /api/dba/audit-log returns HTTP 200');
    assert(auditRes.body?.total > 0, `Audit log entries persisted in Neo4j (found: ${auditRes.body?.total})`);
    
    // Check that recent actions from our test were logged
    const actionsLogged = auditRes.body?.data?.map(l => l.action) || [];
    assert(actionsLogged.includes('USER_LOGIN') || actionsLogged.includes('LOGIN'), 'LOGIN action logged in audit stream');
    assert(actionsLogged.includes('CREATE_CANDIDATE'), 'CREATE_CANDIDATE logged in audit stream');
    assert(actionsLogged.includes('DELETE_CANDIDATE'), 'DELETE_CANDIDATE logged in audit stream');

    console.log('\n================================================================');
    console.log(`📊 TEST EXECUTION SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('================================================================');

  } catch (err) {
    console.error('[FATAL TEST SUITE ERROR]:', err);
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

runAllTests();
