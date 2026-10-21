async function testVercelAuth() {
  console.log('Sending request to live Vercel API...');
  try {
    const res = await fetch('https://job-recruitment-management-system.vercel.app/api/auth/quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'USER' })
    });
    console.log('Quick-login HTTP status:', res.status);
    const data = await res.json();
    console.log('Login success:', data.success, 'Token received:', !!data.token);

    if (data.token) {
      // 1. Candidates
      const candRes = await fetch('https://job-recruitment-management-system.vercel.app/api/candidates', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const candData = await candRes.json();
      console.log('Candidates status:', candRes.status, 'Total candidates:', candData.data?.length);
      const v = candData.data?.find(c => (c.cand_id || c.CAND_ID) === 126);
      console.log('Candidate 126 (Vikramaditya Rao) on Vercel:', v ? `${v.fullName || v.FNAME} (ID: ${v.cand_id || v.CAND_ID})` : 'NOT FOUND');

      // 2. Jobs
      const jobRes = await fetch('https://job-recruitment-management-system.vercel.app/api/jobs', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const jobData = await jobRes.json();
      console.log('Jobs status:', jobRes.status, 'Total jobs:', jobData.data?.length);
      const j = jobData.data?.find(jb => (jb.job_key || jb.JOB_KEY) === 21);
      console.log('Job 21 (Lead AI Engineer) on Vercel:', j ? `${j.job_title || j.JOB_TITLE} (Key: ${j.job_key || j.JOB_KEY})` : 'NOT FOUND');

      // 3. Employers
      const empRes = await fetch('https://job-recruitment-management-system.vercel.app/api/employers', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const empData = await empRes.json();
      console.log('Employers status:', empRes.status, 'Total employers:', empData.data?.length);
      const e = empData.data?.find(em => (em.emp_id || em.EMP_ID) === 'EMP016' || (em.emp_id || em.EMP_ID) === 'E016');
      console.log('Employer EMP016 (Apex Technologies) on Vercel:', e ? `${e.company_name || e.COMPANY_NAME} (ID: ${e.emp_id || e.EMP_ID})` : 'NOT FOUND');
    }
  } catch (err) {
    console.error('Vercel test error:', err.message);
  }
}

testVercelAuth();
