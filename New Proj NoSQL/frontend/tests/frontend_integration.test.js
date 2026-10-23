import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../../backend/app.js';
import { initNeo4jDriver, closeNeo4jDriver } from '../../backend/db/neo4j.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

let userToken = '';
let designerToken = '';
let dbaToken = '';

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

async function request(pathUrl, options = {}) {
  const url = `${baseUrl}${pathUrl}`;
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

async function runFrontendIntegrationSuite() {
  console.log('======================================================================');
  console.log('🌐 PHASE 4: FRONTEND-TO-BACKEND INTEGRATION TEST SUITE');
  console.log('======================================================================');

  try {
    // 1. Initialize Neo4j Driver
    await initNeo4jDriver();

    // 2. Start Ephemeral Test Server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`[Test Server] Ephemeral full-stack server running on ${baseUrl}`);
        resolve();
      });
    });

    // -----------------------------------------------------------------
    // Suite 1: Production Build Assets & SPA Static Serving
    // -----------------------------------------------------------------
    console.log('\n[Suite 1: Frontend Production Build & SPA Static Serving]');
    const distHtmlPath = path.resolve(__dirname, '../dist/index.html');
    const distExists = fs.existsSync(distHtmlPath);
    assert(distExists, 'frontend/dist/index.html production bundle exists');

    const htmlContent = distExists ? fs.readFileSync(distHtmlPath, 'utf8') : '';
    assert(htmlContent.includes('<div id="root"></div>'), 'index.html contains root mount node');
    assert(htmlContent.includes('/assets/index-'), 'index.html links to compiled JS and CSS chunks');

    // Test SPA fallback routing on server
    const spaRes = await fetch(`${baseUrl}/user/candidates`);
    assert(spaRes.status === 200, 'Server returns HTTP 200 for client-side SPA route (/user/candidates)');
    const spaText = await spaRes.text();
    assert(spaText.includes('<div id="root"></div>'), 'Server serves React SPA shell on client route');

    // -----------------------------------------------------------------
    // Suite 2: Authentication & Token Management (All 3 Roles)
    // -----------------------------------------------------------------
    console.log('\n[Suite 2: Authentication & Token Lifecycle]');

    // 2.1 User Login: recruiter / User@123
    const userLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'User@123' })
    });
    assert(userLogin.status === 200, 'recruiter logs in via POST /api/auth/login (HTTP 200)');
    assert(userLogin.body?.token?.length > 20, 'recruiter receives valid JWT string');
    assert(userLogin.body?.user?.role === 'USER', 'recruiter has role USER');
    userToken = userLogin.body.token;

    // 2.2 Verify Session: GET /api/auth/me with recruiter token
    const userMe = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userMe.status === 200, 'GET /api/auth/me returns HTTP 200 for valid session');
    assert(userMe.body?.user?.username === 'recruiter', 'Session identifies recruiter');

    // 2.3 Designer Login: designer / Designer@123
    const designerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'designer', password: 'Designer@123' })
    });
    assert(designerLogin.status === 200, 'designer logs in via POST /api/auth/login (HTTP 200)');
    assert(designerLogin.body?.user?.role === 'DATABASE_DESIGNER', 'designer has role DATABASE_DESIGNER');
    designerToken = designerLogin.body.token;

    // 2.4 DBA Login: dba_admin / Dba@123
    const dbaLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dba_admin', password: 'Dba@123' })
    });
    assert(dbaLogin.status === 200, 'dba_admin logs in via POST /api/auth/login (HTTP 200)');
    assert(dbaLogin.body?.user?.role === 'DBA', 'dba_admin has role DBA');
    dbaToken = dbaLogin.body.token;

    // 2.5 Invalid Credentials
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'WrongPassword!' })
    });
    assert(badLogin.status === 401, 'Invalid credentials return HTTP 401 Unauthorized');
    assert(badLogin.body?.success === false, 'Invalid login response indicates success: false');

    // 2.6 Logout
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200');

    // -----------------------------------------------------------------
    // Suite 3: User Portal Screens & Data Integration
    // -----------------------------------------------------------------
    console.log('\n[Suite 3: User Portal Screen Endpoints]');

    // 3.1 Candidates Screen
    const candList = await request('/api/candidates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(candList.status === 200, 'CandidatesPage: GET /api/candidates returns HTTP 200');
    assert(candList.body?.total >= 25, `CandidatesPage: total candidates count >= 25 (got: ${candList.body?.total})`);
    assert(Array.isArray(candList.body?.data), 'CandidatesPage: data is array');

    const candSearch = await request('/api/candidates?gender=Male&search=Ram', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(candSearch.status === 200, 'CandidatesPage: Filter query returns HTTP 200');
    assert(candSearch.body?.data?.length >= 1, 'CandidatesPage: Search filter returns matching candidate');

    const candDetail = await request('/api/candidates/101', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(candDetail.status === 200, 'CandidatesPage: GET /api/candidates/101 returns HTTP 200');
    assert(candDetail.body?.data?.fname === 'Ram', 'CandidatesPage: Candidate detail profile matches candidate 101');

    // 3.2 Jobs Screen
    const jobsList = await request('/api/jobs', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(jobsList.status === 200, 'JobsPage: GET /api/jobs returns HTTP 200');
    assert(jobsList.body?.total >= 20, `JobsPage: total jobs count >= 20 (got: ${jobsList.body?.total})`);

    const jobsFilter = await request('/api/jobs?status=Open', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(jobsFilter.status === 200, 'JobsPage: Open status filter returns HTTP 200');

    // 3.3 Applications Screen
    const appList = await request('/api/applications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(appList.status === 200, 'ApplicationsPage: GET /api/applications returns HTTP 200');
    assert(appList.body?.total >= 25, `ApplicationsPage: total applications >= 25 (got: ${appList.body?.total})`);
    assert(appList.body?.data?.[0]?.candidate?.name !== undefined, 'ApplicationsPage: joined candidate name populated');
    assert(appList.body?.data?.[0]?.job?.job_title !== undefined, 'ApplicationsPage: joined job title populated');

    // 3.4 Interviews Screen
    const intList = await request('/api/interviews', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(intList.status === 200, 'InterviewsPage: GET /api/interviews returns HTTP 200');
    assert(intList.body?.total >= 25, `InterviewsPage: total interviews >= 25 (got: ${intList.body?.total})`);

    // 3.5 Employers Screen
    const empList = await request('/api/employers', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(empList.status === 200, 'EmployersPage: GET /api/employers returns HTTP 200');
    assert(empList.body?.total >= 15, `EmployersPage: total employers >= 15 (got: ${empList.body?.total})`);

    // 3.6 Skills Screen
    const skillList = await request('/api/skills', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(skillList.status === 200, 'SkillsPage: GET /api/skills returns HTTP 200');
    assert(skillList.body?.total >= 15, `SkillsPage: total skills >= 15 (got: ${skillList.body?.total})`);

    // 3.7 User Dashboard Screen
    const userDash = await request('/api/user/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userDash.status === 200, 'UserDashboard: GET /api/user/dashboard returns HTTP 200');
    assert(userDash.body?.data?.kpis?.totalCandidates >= 25, 'UserDashboard: KPI totalCandidates populated');
    assert(userDash.body?.data?.charts?.demandedSkills?.length > 0, 'UserDashboard: demandedSkills chart populated');
    assert(userDash.body?.data?.recentApplications?.length > 0, 'UserDashboard: recentApplications populated');

    // 3.8 User Reports Screen
    const userReports = await request('/api/reports/user', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userReports.status === 200, 'UserReportsPage: GET /api/reports/user returns HTTP 200');
    assert(Array.isArray(userReports.body?.data?.appReport), 'UserReportsPage: appReport array populated');
    assert(Array.isArray(userReports.body?.data?.skillReport), 'UserReportsPage: skillReport array populated');
    assert(Array.isArray(userReports.body?.data?.salaryReport), 'UserReportsPage: salaryReport array populated');

    // -----------------------------------------------------------------
    // Suite 4: Database Designer Module Endpoints
    // -----------------------------------------------------------------
    console.log('\n[Suite 4: Database Designer Module Endpoints]');

    // 4.1 Designer Dashboard
    const desDash = await request('/api/designer/dashboard', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desDash.status === 200, 'DesignerDashboard: GET /api/designer/dashboard returns HTTP 200');
    assert(desDash.body?.data?.metrics?.totalTables >= 40, 'DesignerDashboard: totalTables metric populated');
    assert(desDash.body?.data?.normalizationMetrics?.decomposedRelations?.length > 0, 'DesignerDashboard: decomposedRelations populated');

    // 4.2 Tables Catalog
    const desTables = await request('/api/designer/tables', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desTables.status === 200, 'TablesPage: GET /api/designer/tables returns HTTP 200');
    assert(desTables.body?.data?.length >= 40, 'TablesPage: 40+ tables listed');

    // 4.3 Table Detail
    const tableDetail = await request('/api/designer/tables/CANDIDATE', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(tableDetail.status === 200, 'TableDetailPage: GET /api/designer/tables/CANDIDATE returns HTTP 200');
    assert(tableDetail.body?.data?.tableName === 'CANDIDATE', 'TableDetailPage: CANDIDATE metadata returned');

    // 4.4 Columns, Keys & Constraints
    const desColumns = await request('/api/designer/columns', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desColumns.status === 200, 'ColumnsPage: GET /api/designer/columns returns HTTP 200');

    const desPKs = await request('/api/designer/primary-keys', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desPKs.status === 200, 'PrimaryKeysPage: GET /api/designer/primary-keys returns HTTP 200');

    const desFKs = await request('/api/designer/foreign-keys', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desFKs.status === 200, 'ForeignKeysPage: GET /api/designer/foreign-keys returns HTTP 200');

    const desConstraints = await request('/api/designer/constraints', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desConstraints.status === 200, 'ConstraintsPage: GET /api/designer/constraints returns HTTP 200');

    const desRels = await request('/api/designer/relationships', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desRels.status === 200, 'RelationshipsPage: GET /api/designer/relationships returns HTTP 200');

    const desNorm = await request('/api/designer/normalization', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desNorm.status === 200, 'SchemaOverviewPage: GET /api/designer/normalization returns HTTP 200');

    const desReports = await request('/api/reports/designer', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(desReports.status === 200, 'DesignerReportsPage: GET /api/reports/designer returns HTTP 200');

    // -----------------------------------------------------------------
    // Suite 5: DBA Administration Module & Allowlisted Cypher Console
    // -----------------------------------------------------------------
    console.log('\n[Suite 5: DBA Administration Module & Cypher Console]');

    // 5.1 DBA Dashboard
    const dbaDash = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaDash.status === 200, 'DbaDashboard: GET /api/dba/dashboard returns HTTP 200');
    assert(dbaDash.body?.data?.summary?.dbStatus?.status === 'ONLINE', 'DbaDashboard: Neo4j database reports ONLINE');

    // 5.2 DBA Tables Explorer & Data Inspector
    const dbaTables = await request('/api/dba/tables', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaTables.status === 200, 'DbaTablesPage: GET /api/dba/tables returns HTTP 200');
    assert(dbaTables.body?.data?.length >= 16, 'DbaTablesPage: lists primary graph labels');

    const candData = await request('/api/dba/tables/Candidate/data', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(candData.status === 200, 'DbaTablesPage: GET /api/dba/tables/Candidate/data returns HTTP 200');
    assert(candData.body?.data?.rows?.length >= 25, 'DbaTablesPage: Candidate records inspected');

    // 5.3 Objects, Users, Indexes, Health, Stats, Audit
    const dbaObjects = await request('/api/dba/objects', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaObjects.status === 200, 'DatabaseObjectsPage: GET /api/dba/objects returns HTTP 200');

    const dbaUsers = await request('/api/dba/users', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaUsers.status === 200, 'UsersRolesPage: GET /api/dba/users returns HTTP 200');
    assert(dbaUsers.body?.data?.length >= 3, 'UsersRolesPage: 3 seeded users present');

    const dbaIndexes = await request('/api/dba/indexes', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaIndexes.status === 200, 'IndexesPage: GET /api/dba/indexes returns HTTP 200');

    const dbaHealth = await request('/api/dba/constraints-health', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaHealth.status === 200, 'ConstraintsHealthPage: GET /api/dba/constraints-health returns HTTP 200');

    const dbaStats = await request('/api/dba/statistics', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaStats.status === 200, 'DatabaseStatsPage: GET /api/dba/statistics returns HTTP 200');

    const dbaAudit = await request('/api/dba/audit-log', {
      headers: { Authorization: `Bearer ${dbaToken}` }
    });
    assert(dbaAudit.status === 200, 'ActivityAuditPage: GET /api/dba/audit-log returns HTTP 200');
    assert(dbaAudit.body?.data?.length > 0, 'ActivityAuditPage: live audit stream returned');

    // 5.4 Allowlisted Cypher Query Console Execution (All 7 Templates)
    const templatesToTest = [
      'LIST_CANDIDATES',
      'SEARCH_JOBS',
      'ALL_APPLICATIONS',
      'SCHEMA_CONSTRAINTS_HEALTH',
      'AUDIT_LOG_STREAM',
      'SKILL_DEMAND_ANALYSIS',
      'RELATIONSHIP_SUMMARY'
    ];

    for (const tmpl of templatesToTest) {
      const res = await request('/api/dba/execute-sql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${dbaToken}` },
        body: JSON.stringify({ query: tmpl })
      });
      assert(res.status === 200, `SqlQueryPage: Template ${tmpl} executes successfully (HTTP 200)`);
      assert(res.body?.data?.rowCount !== undefined, `SqlQueryPage: Template ${tmpl} returns rowCount`);
    }

    // -----------------------------------------------------------------
    // Suite 6: Security Boundaries, RBAC Enforcement & Malicious Blocking
    // -----------------------------------------------------------------
    console.log('\n[Suite 6: Security Boundaries & Attack Prevention]');

    // 6.1 Unauthenticated Request Blocked
    const unauthRes = await request('/api/candidates');
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401 Unauthorized');

    // 6.2 Standard User Accessing DBA Module Blocked
    const userBlockedFromDba = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userBlockedFromDba.status === 403, 'USER token accessing /api/dba/dashboard rejected with HTTP 403 Forbidden');

    // 6.3 Standard User Accessing Designer Module Blocked
    const userBlockedFromDesigner = await request('/api/designer/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userBlockedFromDesigner.status === 403, 'USER token accessing /api/designer/dashboard rejected with HTTP 403 Forbidden');

    // 6.4 Designer Accessing DBA Module Blocked
    const designerBlockedFromDba = await request('/api/dba/dashboard', {
      headers: { Authorization: `Bearer ${designerToken}` }
    });
    assert(designerBlockedFromDba.status === 403, 'DATABASE_DESIGNER token accessing /api/dba/dashboard rejected with HTTP 403 Forbidden');

    // 6.5 Arbitrary Cypher Execution Blocked (HTTP 403 Security Violation)
    const arbitraryCypher = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'MATCH (c:Candidate) DETACH DELETE c' })
    });
    assert(arbitraryCypher.status === 403, 'Destructive arbitrary Cypher DETACH DELETE blocked with HTTP 403 Forbidden');
    assert(arbitraryCypher.body?.message?.includes('Security Violation'), 'Response explicitly identifies Security Violation');

    // 6.6 SQL Injection Attempt Blocked
    const sqlInjection = await request('/api/dba/execute-sql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dbaToken}` },
      body: JSON.stringify({ query: 'DROP TABLE CANDIDATE CASCADE CONSTRAINTS' })
    });
    assert(sqlInjection.status === 403, 'Arbitrary SQL DDL DROP TABLE blocked with HTTP 403 Forbidden');

    // 6.7 Form Validation Error (Missing mandatory fname)
    const valError = await request('/api/candidates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ lname: 'MissingFname' })
    });
    assert(valError.status === 400, 'Validation failure returns HTTP 400 Bad Request');
    assert(valError.body?.success === false, 'Validation response indicates success: false');

    console.log('\n======================================================================');
    console.log(`📊 FRONTEND INTEGRATION SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================================');

  } catch (err) {
    console.error('[FATAL FRONTEND INTEGRATION ERROR]:', err);
    failedTests++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Server] Ephemeral full-stack server closed.');
    }
    await closeNeo4jDriver();
    console.log('[Neo4j] Database driver closed.');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runFrontendIntegrationSuite();
