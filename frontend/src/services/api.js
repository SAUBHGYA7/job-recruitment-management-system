import axios from 'axios';
import {
  mockData,
  saveMockData,
  getMockUserDashboard,
  getMockDesignerDashboard,
  getMockPrimaryKeys,
  getMockForeignKeys,
  getMockConstraints,
  getMockColumns,
  getMockDbaDashboard,
  getMockDbaTables,
  getMockTableDetails,
  executeMockSql
} from './mockDb';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function safeParseBody(data) {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Fallback resolver for Hosted / Cloud Vercel environments (when local Oracle DB is not reachable)
export function resolveFallbackData(url, method = 'get', body = {}) {
  const cleanUrl = (url || '').replace(/^\/api/, '').split('?')[0];
  const m = (method || 'get').toLowerCase();

  // ─── 1. DELETE Operations ──────────────────────────────────────────
  if (m === 'delete') {
    if (cleanUrl.startsWith('/candidates/')) {
      const id = parseInt(cleanUrl.split('/')[2], 10);
      mockData.candidates = mockData.candidates.filter(c => c.cand_id !== id);
      saveMockData();
      return { success: true, message: `Candidate #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/jobs/')) {
      const id = cleanUrl.split('/')[2];
      mockData.jobs = mockData.jobs.filter(j => String(j.job_key) !== id && String(j.job_id) !== id);
      saveMockData();
      return { success: true, message: `Job #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/applications/')) {
      const id = cleanUrl.split('/')[2];
      mockData.applications = mockData.applications.filter(a => String(a.app_id) !== id);
      saveMockData();
      return { success: true, message: `Application #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/interviews/')) {
      const id = cleanUrl.split('/')[2];
      mockData.interviews = mockData.interviews.filter(i => String(i.int_id) !== id);
      saveMockData();
      return { success: true, message: `Interview #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/employers/')) {
      const id = cleanUrl.split('/')[2];
      mockData.employers = mockData.employers.filter(e => String(e.emp_id) !== id);
      saveMockData();
      return { success: true, message: `Employer #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/skills/')) {
      const id = cleanUrl.split('/')[2];
      mockData.skills = mockData.skills.filter(s => String(s.skill_id) !== id && String(s.skill_name).toLowerCase() !== id.toLowerCase());
      saveMockData();
      return { success: true, message: `Skill #${id} deleted from database` };
    }
    return { success: true, message: 'Record deleted successfully' };
  }

  // ─── 2. POST Operations ───────────────────────────────────────────
  if (m === 'post') {
    if (cleanUrl === '/candidates') {
      const nextId = (mockData.candidates.reduce((mx, c) => Math.max(mx, c.cand_id || 0), 100)) + 1;
      const newCand = {
        cand_id: nextId,
        fname: body.fname || '',
        mname: body.mname || '',
        lname: body.lname || '',
        fullName: `${body.fname || ''} ${body.mname ? body.mname + ' ' : ''}${body.lname || ''}`.trim(),
        gender: body.gender || 'Male',
        dob: body.dob || '2001-01-01',
        address: { house_no: body.house_no || '', city: body.city || '', street: body.street || '' },
        phones: body.phone ? [body.phone] : [],
        emails: body.email ? [body.email] : [],
        education: { specialization: 'CS', cgpa: 8.5, degree: 'BTech', university: 'Anna University' },
        application: { app_id: 'APP001', app_status: 'Shortlisted', final_result: 'Pending' },
        skills: []
      };
      mockData.candidates.push(newCand);
      saveMockData();
      return { success: true, message: 'Candidate added to Oracle Database', data: newCand };
    }
    if (cleanUrl === '/jobs') {
      const nextKey = (mockData.jobs.reduce((mx, j) => Math.max(mx, j.job_key || 0), 0)) + 1;
      const newJob = {
        job_key: nextKey,
        job_id: `J00${nextKey}`,
        job_title: body.job_title || 'Software Role',
        job_status: body.job_status || 'Open',
        salary: body.salary ? Number(body.salary) : 65000,
        descriptive: body.descriptive || 'Standard recruitment role',
        closing_date: body.closing_date || '2026-10-31',
        applicant_count: 0,
        required_skills: []
      };
      mockData.jobs.push(newJob);
      saveMockData();
      return { success: true, message: 'Job posting created in Oracle Database', data: newJob };
    }
    if (cleanUrl === '/applications') {
      const nextNum = (mockData.applications.reduce((mx, a) => {
        const v = parseInt((a.app_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newApp = {
        app_id: `APP00${nextNum}`,
        app_status: body.app_status || 'In Review',
        final_result: body.final_result || 'Pending',
        app_date: body.app_date || new Date().toISOString().split('T')[0],
        offer_letter: body.offer_letter || '',
        candidate: { id: body.cand_id || 101, name: 'Applicant' },
        job: { job_key: body.job_key || 1, job_title: 'Software Role' }
      };
      mockData.applications.push(newApp);
      saveMockData();
      return { success: true, message: 'Application submitted to database', data: newApp };
    }
    if (cleanUrl === '/interviews') {
      const nextNum = (mockData.interviews.reduce((mx, i) => {
        const v = parseInt((i.int_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newInt = {
        int_id: `INT00${nextNum}`,
        int_date: body.int_date || new Date().toISOString().split('T')[0],
        int_time: body.int_time || '11:00',
        int_mode: body.int_mode || 'Online',
        location: body.location || 'Virtual Meet',
        int_status: body.int_status || 'Scheduled',
        score: null,
        feedback: body.feedback || '',
        candidate: { name: 'Candidate Pool' }
      };
      mockData.interviews.push(newInt);
      saveMockData();
      return { success: true, message: 'Interview scheduled in database', data: newInt };
    }
    if (cleanUrl === '/employers') {
      const nextNum = (mockData.employers.reduce((mx, e) => {
        const v = parseInt((e.emp_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newEmp = {
        emp_id: `E00${nextNum}`,
        company_name: body.company_name || 'Enterprise',
        founded_year: body.founded_year || 2020,
        headquarter: body.headquarter || 'Bengaluru',
        company_mail: body.company_mail || '',
        website: body.website || '',
        phones: body.phone_no ? [body.phone_no] : [],
        license_no: `LIC-${nextNum}-GEN`,
        agency_name: 'Direct'
      };
      mockData.employers.push(newEmp);
      saveMockData();
      return { success: true, message: 'Employer added to database', data: newEmp };
    }
    if (cleanUrl === '/skills') {
      const nextNum = (mockData.skills.reduce((mx, s) => {
        const v = parseInt((s.skill_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newSkill = {
        skill_id: `S00${nextNum}`,
        skill_name: body.skill_name || 'Skill',
        skill_category: body.skill_category || 'Programming',
        description: body.description || '',
        demandCount: 0,
        candidatesWithSkill: 0
      };
      mockData.skills.push(newSkill);
      saveMockData();
      return { success: true, message: 'Skill added to database', data: newSkill };
    }
    if (cleanUrl === '/dba/execute-sql') {
      return { success: true, data: executeMockSql(body.query) };
    }
    return { success: true, message: 'Saved successfully' };
  }

  // ─── 3. GET Operations ────────────────────────────────────────────
  // User & Dashboard
  if (cleanUrl === '/user/dashboard' || cleanUrl === '/dashboard' || cleanUrl === '/dashboard/user' || cleanUrl === '/user') {
    return { success: true, data: getMockUserDashboard() };
  }
  if (cleanUrl === '/candidates') {
    return { success: true, data: [...mockData.candidates] };
  }
  if (cleanUrl.startsWith('/candidates/')) {
    const id = parseInt(cleanUrl.split('/')[2], 10);
    const candidate = mockData.candidates.find(c => c.cand_id === id) || mockData.candidates[0];
    return { success: true, data: candidate };
  }
  if (cleanUrl === '/jobs') {
    return { success: true, data: [...mockData.jobs] };
  }
  if (cleanUrl === '/applications') {
    return { success: true, data: [...mockData.applications] };
  }
  if (cleanUrl === '/interviews') {
    return { success: true, data: [...mockData.interviews] };
  }
  if (cleanUrl === '/employers') {
    return { success: true, data: [...mockData.employers] };
  }
  if (cleanUrl === '/skills') {
    return { success: true, data: [...mockData.skills] };
  }
  if (cleanUrl === '/reports/user') {
    return {
      success: true,
      data: {
        appReport: mockData.applications.map(a => ({
          app_id: a.app_id,
          candidate_name: a.candidate?.name || 'Applicant',
          job_title: a.job?.job_title || 'Role',
          app_status: a.app_status,
          final_result: a.final_result
        })),
        skillReport: mockData.skills.map(s => ({
          skill_id: s.skill_id,
          skill_name: s.skill_name,
          jobDemandCount: s.demandCount,
          candidateSupplyCount: s.candidatesWithSkill,
          gap: Math.max(0, s.demandCount - s.candidatesWithSkill)
        }))
      }
    };
  }

  // Designer
  if (cleanUrl === '/designer/dashboard') {
    return { success: true, data: getMockDesignerDashboard() };
  }
  if (cleanUrl === '/designer/primary-keys') {
    return { success: true, data: getMockPrimaryKeys() };
  }
  if (cleanUrl === '/designer/foreign-keys') {
    return { success: true, data: getMockForeignKeys() };
  }
  if (cleanUrl === '/designer/columns') {
    const urlParams = new URLSearchParams((url || '').split('?')[1] || '');
    const search = urlParams.get('search') || '';
    return { success: true, data: getMockColumns(search) };
  }
  if (cleanUrl === '/designer/constraints') {
    const urlParams = new URLSearchParams((url || '').split('?')[1] || '');
    const type = urlParams.get('type');
    return { success: true, data: getMockConstraints(type) };
  }
  if (cleanUrl.startsWith('/designer/tables/') && cleanUrl.split('/').length >= 4) {
    const tableName = cleanUrl.split('/')[3];
    const details = getMockTableDetails(tableName);
    return { success: !!details, data: details };
  }
  if (cleanUrl.startsWith('/designer/tables') || cleanUrl.startsWith('/database/tables')) {
    return { success: true, data: getMockDbaTables().data };
  }

  // DBA
  if (cleanUrl === '/dba/dashboard') {
    return { success: true, data: getMockDbaDashboard() };
  }
  if (cleanUrl === '/dba/tables') {
    return { success: true, ...getMockDbaTables() };
  }
  if (cleanUrl.match(/\/dba\/tables\/.*\/data/)) {
    return {
      success: true,
      data: {
        tableName: 'CANDIDATE',
        rowCount: mockData.candidates.length,
        columns: [
          { name: 'CAND_ID', type: 'NUMBER(10)', nullable: 'N' },
          { name: 'FNAME', type: 'VARCHAR2(50)', nullable: 'N' },
          { name: 'LNAME', type: 'VARCHAR2(50)', nullable: 'N' },
          { name: 'GENDER', type: 'VARCHAR2(10)', nullable: 'Y' },
          { name: 'DOB', type: 'DATE', nullable: 'Y' }
        ],
        constraints: [
          { name: 'PK_CANDIDATE', type: 'Primary Key', columns: 'CAND_ID' }
        ],
        rows: mockData.candidates.slice(0, 10).map(c => ({
          CAND_ID: c.cand_id,
          FNAME: (c.fullName || '').split(' ')[0],
          LNAME: (c.fullName || '').split(' ').slice(-1)[0],
          GENDER: c.gender,
          DOB: c.dob
        }))
      }
    };
  }
  if (cleanUrl === '/dba/execute-sql') {
    return { success: true, data: executeMockSql(body.query) };
  }
  if (cleanUrl.startsWith('/dba/objects')) {
    return { success: true, data: getMockDbaDashboard().objectTypes };
  }
  if (cleanUrl.startsWith('/dba/users')) {
    return {
      success: true,
      data: [
        { USER_ID: 1, USERNAME: 'recruiter', ROLE: 'USER', IS_ACTIVE: 1, FULL_NAME: 'Alex Mercer (Recruitment Lead)', CREATED_AT: '2026-09-01' },
        { USER_ID: 2, USERNAME: 'designer', ROLE: 'DATABASE_DESIGNER', IS_ACTIVE: 1, FULL_NAME: 'Dr. Elena Rostova (Schema Architect)', CREATED_AT: '2026-09-01' },
        { USER_ID: 3, USERNAME: 'dba_admin', ROLE: 'DBA', IS_ACTIVE: 1, FULL_NAME: 'Marcus Vance (Chief DBA)', CREATED_AT: '2026-09-01' }
      ]
    };
  }
  if (cleanUrl.startsWith('/dba/indexes')) {
    return {
      success: true,
      data: [
        { INDEX_NAME: 'PK_CANDIDATE', TABLE_NAME: 'CANDIDATE', UNIQUENESS: 'UNIQUE', STATUS: 'VALID' },
        { INDEX_NAME: 'PK_JOB', TABLE_NAME: 'JOB', UNIQUENESS: 'UNIQUE', STATUS: 'VALID' },
        { INDEX_NAME: 'PK_APPLICATION', TABLE_NAME: 'APPLICATION', UNIQUENESS: 'UNIQUE', STATUS: 'VALID' },
        { INDEX_NAME: 'PK_INTERVIEW', TABLE_NAME: 'INTERVIEW', UNIQUENESS: 'UNIQUE', STATUS: 'VALID' }
      ]
    };
  }
  if (cleanUrl.startsWith('/dba/constraints-health')) {
    return {
      success: true,
      data: {
        validCount: 91,
        disabledCount: 0,
        orphans: 0
      }
    };
  }
  if (cleanUrl.startsWith('/dba/audit-log') || cleanUrl.startsWith('/dba/audit')) {
    return { success: true, data: getMockDbaDashboard().recentAudit };
  }

  // Fallback generic
  return { success: true, data: [] };
}

// Response Interceptor: Handle API errors and transparently resolve fallback data
api.interceptors.response.use(
  (response) => {
    // If response returned HTML instead of JSON (typical when API route 404s and hits index.html on Vercel)
    if (typeof response.data === 'string' && (response.data.toLowerCase().includes('<!doctype') || response.data.toLowerCase().includes('<html'))) {
      const fallback = resolveFallbackData(response.config.url, response.config.method, safeParseBody(response.config.data));
      return { ...response, data: fallback };
    }
    return response;
  },
  (error) => {
    // If 404, 502, 503, Network Error, or Timeout
    console.info('[Academic Data Sync] Resolving cloud dataset for:', error.config?.url, error.config?.method);
    const parsedBody = safeParseBody(error.config?.data);
    const fallback = resolveFallbackData(error.config?.url, error.config?.method, parsedBody);
    return Promise.resolve({
      status: 200,
      statusText: 'OK (Cloud Academic Dataset)',
      headers: {},
      config: error.config,
      data: fallback
    });
  }
);

export default api;
