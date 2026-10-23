const BASE_URL = 'https://job-recruitment-management-system.vercel.app';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { rawText: text.substring(0, 200) };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runVerification() {
  console.log('===============================================================');
  console.log('   FULL END-TO-END VERIFICATION: VERCEL DEPLOYMENT');
  console.log(`   Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function report(testName, ok, detail = '') {
    if (ok) {
      console.log(` ✅ [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.log(` ❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // 1. Health
  try {
    const health = await req('/api/health');
    report('API /api/health Endpoint', health.ok && health.data.status === 'ONLINE', `Status: ${health.data.status}`);
  } catch (err) {
    report('API /api/health Endpoint', false, err.message);
  }

  // 2. Authentication: Recruiter (USER)
  let userToken = '';
  try {
    const login = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'recruiter', password: 'User@123' })
    });
    userToken = login.data?.token || '';
    report('Login: USER (Recruiter)', login.ok && !!userToken, `Token acquired`);
  } catch (err) {
    report('Login: USER', false, err.message);
  }

  const userHeaders = { Authorization: `Bearer ${userToken}` };

  // 3. User Dashboard
  try {
    const dash = await req('/api/user/dashboard', { headers: userHeaders });
    const hasData = dash.ok && (dash.data?.data?.kpis || dash.data?.kpis || dash.data?.data?.stats);
    report('GET /api/user/dashboard', hasData, `Metrics loaded`);
  } catch (err) {
    report('GET /api/user/dashboard', false, err.message);
  }

  // 4. Candidate CRUD Lifecycle
  let testCandId = null;
  try {
    // READ
    const getCands = await req('/api/candidates', { headers: userHeaders });
    const candsList = getCands.data?.data || getCands.data || [];
    report('GET /api/candidates', getCands.ok && Array.isArray(candsList), `${candsList.length} candidates loaded`);

    // CREATE
    const newCand = {
      fname: 'Aarav',
      lname: 'Sharma',
      gender: 'Male',
      dob: '2001-05-15',
      house_no: 'Flat 402',
      street: 'MG Road',
      city: 'Bengaluru',
      email: 'aarav.sharma.test@example.com',
      phone: '9876543210'
    };
    const createRes = await req('/api/candidates', {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify(newCand)
    });
    testCandId = createRes.data?.data?.cand_id || createRes.data?.cand_id || createRes.data?.id;
    report('POST /api/candidates (CREATE)', createRes.ok, `Created Candidate ID: ${testCandId}`);

    // UPDATE
    if (testCandId) {
      const updateRes = await req(`/api/candidates/${testCandId}`, {
        method: 'PUT',
        headers: userHeaders,
        body: JSON.stringify({ fname: 'Aarav Updated', city: 'Mumbai' })
      });
      report('PUT /api/candidates/:id (UPDATE)', updateRes.ok, `Updated fname & city`);
    }

    // DELETE
    if (testCandId) {
      const delRes = await req(`/api/candidates/${testCandId}`, {
        method: 'DELETE',
        headers: userHeaders
      });
      report('DELETE /api/candidates/:id (DELETE)', delRes.ok, `Deleted Candidate ID: ${testCandId}`);
    }
  } catch (err) {
    report('Candidate CRUD Lifecycle', false, err.message);
  }

  // 5. Job CRUD Lifecycle
  let testJobId = null;
  try {
    // READ
    const getJobs = await req('/api/jobs', { headers: userHeaders });
    const jobList = getJobs.data?.data || getJobs.data || [];
    report('GET /api/jobs', getJobs.ok && Array.isArray(jobList), `${jobList.length} jobs loaded`);

    // CREATE
    const createJob = await req('/api/jobs', {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        job_title: 'Cloud DevOps Engineer',
        salary: 1350000,
        job_status: 'Open',
        descriptive: 'Kubernetes, Terraform, Oracle Cloud Infra',
        closing_date: '2026-12-31'
      })
    });
    testJobId = createJob.data?.data?.job_key || createJob.data?.data?.job_id || createJob.data?.job_key || createJob.data?.job_id;
    report('POST /api/jobs (CREATE)', createJob.ok, `Created Job Key: ${testJobId}`);

    // UPDATE
    if (testJobId) {
      const updateJob = await req(`/api/jobs/${testJobId}`, {
        method: 'PUT',
        headers: userHeaders,
        body: JSON.stringify({ salary: 1450000, job_status: 'Closed' })
      });
      report('PUT /api/jobs/:id (UPDATE)', updateJob.ok, `Updated salary & status`);
    }

    // DELETE
    if (testJobId) {
      const delJob = await req(`/api/jobs/${testJobId}`, {
        method: 'DELETE',
        headers: userHeaders
      });
      report('DELETE /api/jobs/:id (DELETE)', delJob.ok, `Deleted Job Key: ${testJobId}`);
    }
  } catch (err) {
    report('Job CRUD Lifecycle', false, err.message);
  }

  // 6. Employer CRUD Lifecycle
  let testEmpId = null;
  try {
    const getEmps = await req('/api/employers', { headers: userHeaders });
    const empList = getEmps.data?.data || getEmps.data || [];
    report('GET /api/employers', getEmps.ok && Array.isArray(empList), `${empList.length} employers loaded`);

    // CREATE
    const createEmp = await req('/api/employers', {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        company_name: 'Apex Robotics Inc',
        headquarter: 'Hyderabad',
        founded_year: 2021,
        company_mail: 'hr@apexrobotics.io',
        website: 'https://apexrobotics.io',
        phone_no: '040-66778899'
      })
    });
    testEmpId = createEmp.data?.data?.emp_id || createEmp.data?.emp_id;
    report('POST /api/employers (CREATE)', createEmp.ok, `Created Employer ID: ${testEmpId}`);

    // UPDATE
    if (testEmpId) {
      const updateEmp = await req(`/api/employers/${testEmpId}`, {
        method: 'PUT',
        headers: userHeaders,
        body: JSON.stringify({ headquarter: 'Bengaluru Tech Park' })
      });
      report('PUT /api/employers/:id (UPDATE)', updateEmp.ok, `Updated headquarter`);
    }

    // DELETE
    if (testEmpId) {
      const delEmp = await req(`/api/employers/${testEmpId}`, {
        method: 'DELETE',
        headers: userHeaders
      });
      report('DELETE /api/employers/:id (DELETE)', delEmp.ok, `Deleted Employer ID: ${testEmpId}`);
    }
  } catch (err) {
    report('Employer CRUD Lifecycle', false, err.message);
  }

  // 7. Applications & Interviews
  try {
    const apps = await req('/api/applications', { headers: userHeaders });
    const appList = apps.data?.data || apps.data || [];
    report('GET /api/applications', apps.ok && Array.isArray(appList), `${appList.length} applications loaded`);

    if (appList.length > 0) {
      const firstAppId = appList[0].app_id;
      const updateApp = await req(`/api/applications/${firstAppId}`, {
        method: 'PUT',
        headers: userHeaders,
        body: JSON.stringify({ app_status: 'Interviewing', final_result: 'In Review' })
      });
      report('PUT /api/applications/:id (STATUS UPDATE)', updateApp.ok, `Updated App #${firstAppId}`);
    }

    const ints = await req('/api/interviews', { headers: userHeaders });
    const intList = ints.data?.data || ints.data || [];
    report('GET /api/interviews', ints.ok && Array.isArray(intList), `${intList.length} interviews loaded`);
  } catch (err) {
    report('Applications & Interviews', false, err.message);
  }

  // 8. Authentication: Database Designer
  let designerToken = '';
  try {
    const login = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'designer', password: 'Designer@123' })
    });
    designerToken = login.data?.token || '';
    report('Login: DESIGNER', login.ok && !!designerToken, `Token acquired`);
  } catch (err) {
    report('Login: DESIGNER', false, err.message);
  }

  const designerHeaders = { Authorization: `Bearer ${designerToken}` };

  // 9. Designer Views & Metadata
  try {
    const dash = await req('/api/designer/dashboard', { headers: designerHeaders });
    report('GET /api/designer/dashboard', dash.ok, `Metrics & BCNF summary loaded`);

    const tables = await req('/api/designer/tables', { headers: designerHeaders });
    const tableList = tables.data?.data || tables.data || [];
    report('GET /api/designer/tables', tables.ok && tableList.length >= 41, `${tableList.length} BCNF tables found`);

    const tableDetail = await req('/api/designer/tables/CANDIDATE', { headers: designerHeaders });
    report('GET /api/designer/tables/:name (CANDIDATE)', tableDetail.ok, `Columns & PK/FK info loaded`);

    const columns = await req('/api/designer/columns', { headers: designerHeaders });
    const colList = columns.data?.data || columns.data || [];
    report('GET /api/designer/columns', columns.ok && Array.isArray(colList), `${colList.length} columns inspected`);

    const pks = await req('/api/designer/primary-keys', { headers: designerHeaders });
    report('GET /api/designer/primary-keys', pks.ok, `Primary keys catalog loaded`);

    const fks = await req('/api/designer/foreign-keys', { headers: designerHeaders });
    report('GET /api/designer/foreign-keys', fks.ok, `Foreign keys catalog loaded`);

    const rels = await req('/api/designer/relationships', { headers: designerHeaders });
    report('GET /api/designer/relationships', rels.ok, `ER Graph schema relations loaded`);

    const norm = await req('/api/designer/normalization', { headers: designerHeaders });
    report('GET /api/designer/normalization', norm.ok, `BCNF decomposition proof proofs loaded`);
  } catch (err) {
    report('Designer Views & Metadata', false, err.message);
  }

  // 10. Authentication: Database Administrator (DBA)
  let dbaToken = '';
  try {
    const login = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dba_admin', password: 'Dba@123' })
    });
    dbaToken = login.data?.token || '';
    report('Login: DBA (Administrator)', login.ok && !!dbaToken, `Token acquired`);
  } catch (err) {
    report('Login: DBA', false, err.message);
  }

  const dbaHeaders = { Authorization: `Bearer ${dbaToken}` };

  // 11. DBA Management & Maintenance
  try {
    const dbaDash = await req('/api/dba/dashboard', { headers: dbaHeaders });
    report('GET /api/dba/dashboard', dbaDash.ok, `System metrics loaded`);

    const dbaTables = await req('/api/dba/tables', { headers: dbaHeaders });
    report('GET /api/dba/tables', dbaTables.ok, `Tablespace & row statistics loaded`);

    const dbaUsers = await req('/api/dba/users', { headers: dbaHeaders });
    const userList = dbaUsers.data?.data || dbaUsers.data || [];
    report('GET /api/dba/users', dbaUsers.ok && Array.isArray(userList), `${userList.length} users listed`);

    // Create DBA user
    const newUser = await req('/api/dba/users', {
      method: 'POST',
      headers: dbaHeaders,
      body: JSON.stringify({
        username: `test_dba_${Date.now().toString().slice(-4)}`,
        password: 'Password123!',
        full_name: 'Test Administrator',
        role: 'DBA'
      })
    });
    const createdUserId = newUser.data?.data?.user_id || newUser.data?.user_id;
    report('POST /api/dba/users (CREATE USER)', newUser.ok, `Created User ID: ${createdUserId}`);

    if (createdUserId) {
      const toggle = await req(`/api/dba/users/${createdUserId}/toggle-status`, {
        method: 'PUT',
        headers: dbaHeaders
      });
      report('PUT /api/dba/users/:id/toggle-status', toggle.ok, `Toggled active state`);
    }

    // Dynamic SQL Console
    const sqlRes = await req('/api/dba/execute-sql', {
      method: 'POST',
      headers: dbaHeaders,
      body: JSON.stringify({
        query: 'SELECT cand_id, fname, lname FROM Candidate FETCH FIRST 3 ROWS ONLY'
      })
    });
    const sqlData = sqlRes.data?.data || sqlRes.data || {};
    const rows = sqlData.rows || [];
    report('POST /api/dba/execute-sql (DYNAMIC SQL)', sqlRes.ok && rows.length > 0, `${rows.length} rows returned`);

    // Audit Log
    const auditRes = await req('/api/dba/audit-log', { headers: dbaHeaders });
    const auditList = auditRes.data?.data || auditRes.data || [];
    report('GET /api/dba/audit-log', auditRes.ok && Array.isArray(auditList), `${auditList.length} audit entries found`);
  } catch (err) {
    report('DBA Management & Maintenance', false, err.message);
  }

  // 12. Reports
  try {
    const userReports = await req('/api/reports/user', { headers: userHeaders });
    report('GET /api/reports/user', userReports.ok, `Skill gap & applicant reports loaded`);

    const designerReports = await req('/api/reports/designer', { headers: designerHeaders });
    report('GET /api/reports/designer', designerReports.ok, `Schema integrity reports loaded`);

    const dbaReports = await req('/api/reports/dba', { headers: dbaHeaders });
    report('GET /api/reports/dba', dbaReports.ok, `System audit & user role reports loaded`);
  } catch (err) {
    report('Reports', false, err.message);
  }

  console.log('\n===============================================================');
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');
}

runVerification();
