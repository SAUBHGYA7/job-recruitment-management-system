import http from 'http';
import app from '../backend/app.js';

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  console.log('Test server running on port:', port);

  try {
    // 1. Quick Login
    const loginRes = await fetch(`http://localhost:${port}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'USER' })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success, 'Token received:', !!loginData.token);

    // 2. Candidates
    const candRes = await fetch(`http://localhost:${port}/api/candidates`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const candData = await candRes.json();
    console.log('Candidates count:', candData.data?.length);
    const c126 = candData.data?.find(c => c.cand_id === 126);
    console.log('Candidate 126:', c126 ? `${c126.fullName} (ID: ${c126.cand_id})` : 'NOT FOUND');

    // 3. Employers
    const empRes = await fetch(`http://localhost:${port}/api/employers`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const empData = await empRes.json();
    console.log('Employers count:', empData.data?.length);
    const e16 = empData.data?.find(e => e.emp_id === 'EMP016' || e.emp_id === 'E016');
    console.log('Employer 16:', e16 ? `${e16.company_name} (ID: ${e16.emp_id})` : 'NOT FOUND');

    // 4. Jobs
    const jobRes = await fetch(`http://localhost:${port}/api/jobs`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const jobData = await jobRes.json();
    console.log('Jobs count:', jobData.data?.length);
    const j21 = jobData.data?.find(j => j.job_key === 21);
    console.log('Job 21:', j21 ? `${j21.job_title} (Key: ${j21.job_key})` : 'NOT FOUND');

    // 5. Test inserting a new Candidate to verify persistence!
    const addRes = await fetch(`http://localhost:${port}/api/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        fname: 'Devendra',
        lname: 'Nath',
        gender: 'Male',
        dob: '1999-07-21',
        house_no: '55',
        street: 'MG Road',
        city: 'Indore',
        phone: '9826012345',
        email: 'devendra.nath@test.org'
      })
    });
    const addData = await addRes.json();
    console.log('Insert candidate response:', addData.success, addData.message, addData.data?.cand_id);

    // 6. Re-fetch Candidates to verify immediate read of inserted record
    const reCandRes = await fetch(`http://localhost:${port}/api/candidates`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const reCandData = await reCandRes.json();
    console.log('Updated Candidates count:', reCandData.data?.length);
    const devendra = reCandData.data?.find(c => c.fname === 'Devendra' || c.fullName?.includes('Devendra'));
    console.log('Found newly inserted Devendra:', !!devendra, devendra?.cand_id);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
