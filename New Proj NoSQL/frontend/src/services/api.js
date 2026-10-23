import axios from 'axios';
import {
  mockData,
  saveMockData,
  resetMockData,
  logMockAudit,
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
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
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
  const urlParams = new URLSearchParams((url || '').split('?')[1] || '');
  const m = (method || 'get').toLowerCase();

  // ─── 1. DELETE Operations ──────────────────────────────────────────
  if (m === 'delete') {
    if (cleanUrl.startsWith('/candidates/')) {
      const id = parseInt(cleanUrl.split('/')[2], 10);
      mockData.candidates = mockData.candidates.filter(c => c.cand_id !== id);
      logMockAudit('DELETE_CANDIDATE', `Deleted Candidate #${id} from database`);
      saveMockData();
      return { success: true, message: `Candidate #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/jobs/')) {
      const id = cleanUrl.split('/')[2];
      mockData.jobs = mockData.jobs.filter(j => String(j.job_key) !== id && String(j.job_id) !== id);
      logMockAudit('DELETE_JOB', `Deleted Job #${id} from database`);
      saveMockData();
      return { success: true, message: `Job #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/applications/')) {
      const id = cleanUrl.split('/')[2];
      mockData.applications = mockData.applications.filter(a => String(a.app_id) !== id);
      logMockAudit('DELETE_APPLICATION', `Deleted Application #${id} from database`);
      saveMockData();
      return { success: true, message: `Application #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/interviews/')) {
      const id = cleanUrl.split('/')[2];
      mockData.interviews = mockData.interviews.filter(i => String(i.int_id) !== id);
      logMockAudit('DELETE_INTERVIEW', `Deleted Interview #${id} from database`);
      saveMockData();
      return { success: true, message: `Interview #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/employers/')) {
      const id = cleanUrl.split('/')[2];
      mockData.employers = mockData.employers.filter(e => String(e.emp_id) !== id);
      logMockAudit('DELETE_EMPLOYER', `Deleted Employer #${id} from database`);
      saveMockData();
      return { success: true, message: `Employer #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/skills/')) {
      const id = cleanUrl.split('/')[2];
      mockData.skills = mockData.skills.filter(s => String(s.skill_id) !== id && String(s.skill_name).toLowerCase() !== id.toLowerCase());
      logMockAudit('DELETE_SKILL', `Deleted Skill #${id} from database`);
      saveMockData();
      return { success: true, message: `Skill #${id} deleted from database` };
    }
    return { success: true, message: 'Record deleted successfully' };
  }

  // ─── 2. PUT (Update) Operations ────────────────────────────────────
  if (m === 'put') {
    if (cleanUrl.startsWith('/candidates/')) {
      const id = parseInt(cleanUrl.split('/')[2], 10);
      mockData.candidates = mockData.candidates.map(c => {
        if (c.cand_id === id) {
          const fname = body.fname !== undefined ? body.fname : (c.fname || '');
          const mname = body.mname !== undefined ? body.mname : (c.mname || '');
          const lname = body.lname !== undefined ? body.lname : (c.lname || '');
          const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`.trim() || c.fullName;
          return {
            ...c,
            fname,
            mname,
            lname,
            fullName,
            gender: body.gender || c.gender,
            dob: body.dob || c.dob,
            edu_id: body.edu_id || c.edu_id || 'ED001',
            app_id: body.app_id || c.app_id || 'APP001',
            dep_id: body.dep_id || c.dep_id || 'D001',
            int_id: body.int_id || c.int_id || 'INT001',
            address: {
              house_no: body.house_no !== undefined ? body.house_no : (c.address?.house_no || ''),
              city: body.city !== undefined ? body.city : (c.address?.city || ''),
              street: body.street !== undefined ? body.street : (c.address?.street || '')
            },
            emails: body.email !== undefined ? (body.email ? [body.email] : []) : (c.emails || []),
            phones: body.phone !== undefined ? (body.phone ? [body.phone] : []) : (c.phones || [])
          };
        }
        return c;
      });
      logMockAudit('UPDATE_CANDIDATE', `Updated Candidate #${id} in database`);
      saveMockData();
      return { success: true, message: `Candidate #${id} updated successfully` };
    }

    if (cleanUrl.startsWith('/jobs/')) {
      const id = cleanUrl.split('/')[2];
      mockData.jobs = mockData.jobs.map(j => {
        if (String(j.job_key) === id || String(j.job_id) === id) {
          return {
            ...j,
            job_title: body.job_title !== undefined ? body.job_title : j.job_title,
            job_status: body.job_status !== undefined ? body.job_status : j.job_status,
            salary: body.salary !== undefined ? Number(body.salary) : j.salary,
            descriptive: body.descriptive !== undefined ? body.descriptive : j.descriptive,
            closing_date: body.closing_date !== undefined ? body.closing_date : j.closing_date
          };
        }
        return j;
      });
      logMockAudit('UPDATE_JOB', `Updated Job #${id} in database`);
      saveMockData();
      return { success: true, message: `Job #${id} updated successfully` };
    }

    if (cleanUrl.startsWith('/applications/')) {
      const id = cleanUrl.split('/')[2];
      const matchedCand = body.cand_id
        ? mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id))
        : null;
      const matchedJob = body.job_key
        ? mockData.jobs.find(j => String(j.job_key) === String(body.job_key))
        : null;

      mockData.applications = mockData.applications.map(a => {
        if (String(a.app_id) === id) {
          return {
            ...a,
            app_status: body.app_status !== undefined ? body.app_status : a.app_status,
            final_result: body.final_result !== undefined ? body.final_result : a.final_result,
            app_date: body.app_date !== undefined ? body.app_date : a.app_date,
            offer_letter: body.offer_letter !== undefined ? body.offer_letter : a.offer_letter,
            candidate: matchedCand
              ? { id: matchedCand.cand_id, cand_id: matchedCand.cand_id, name: matchedCand.fullName }
              : a.candidate,
            job: matchedJob
              ? { job_key: matchedJob.job_key, job_id: matchedJob.job_id, job_title: matchedJob.job_title }
              : a.job
          };
        }
        return a;
      });
      logMockAudit('UPDATE_APPLICATION_STATUS', `Updated Application #${id} to ${body.app_status} (${body.final_result})`);
      saveMockData();
      return { success: true, message: `Application #${id} updated successfully` };
    }

    if (cleanUrl.startsWith('/interviews/')) {
      const id = cleanUrl.split('/')[2];
      const matchedCand = body.cand_id
        ? mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id))
        : null;

      mockData.interviews = mockData.interviews.map(i => {
        if (String(i.int_id) === id) {
          return {
            ...i,
            int_date: body.int_date !== undefined ? body.int_date : i.int_date,
            int_time: body.int_time !== undefined ? body.int_time : i.int_time,
            int_mode: body.int_mode !== undefined ? body.int_mode : i.int_mode,
            location: body.location !== undefined ? body.location : i.location,
            int_status: body.int_status !== undefined ? body.int_status : i.int_status,
            score: body.score !== undefined && body.score !== '' && body.score !== null ? Number(body.score) : i.score,
            feedback: body.feedback !== undefined ? body.feedback : i.feedback,
            candidate: matchedCand
              ? { cand_id: matchedCand.cand_id, name: matchedCand.fullName }
              : i.candidate
          };
        }
        return i;
      });
      logMockAudit('UPDATE_INTERVIEW', `Updated Interview #${id} in database`);
      saveMockData();
      return { success: true, message: `Interview #${id} updated successfully` };
    }

    if (cleanUrl.startsWith('/employers/')) {
      const id = cleanUrl.split('/')[2];
      mockData.employers = mockData.employers.map(e => {
        if (String(e.emp_id) === id) {
          return {
            ...e,
            company_name: body.company_name !== undefined ? body.company_name : e.company_name,
            founded_year: body.founded_year !== undefined ? Number(body.founded_year) : e.founded_year,
            headquarter: body.headquarter !== undefined ? body.headquarter : e.headquarter,
            company_mail: body.company_mail !== undefined ? body.company_mail : e.company_mail,
            website: body.website !== undefined ? body.website : e.website,
            phones: body.phone_no !== undefined ? (body.phone_no ? [body.phone_no] : []) : (e.phones || [])
          };
        }
        return e;
      });
      logMockAudit('UPDATE_EMPLOYER', `Updated Employer #${id} in database`);
      saveMockData();
      return { success: true, message: `Employer #${id} updated successfully` };
    }

    if (cleanUrl.startsWith('/skills/')) {
      const id = cleanUrl.split('/')[2];
      mockData.skills = mockData.skills.map(s => {
        if (String(s.skill_id) === id) {
          return {
            ...s,
            skill_name: body.skill_name !== undefined ? body.skill_name : s.skill_name,
            skill_category: body.skill_category !== undefined ? body.skill_category : s.skill_category,
            description: body.description !== undefined ? body.description : s.description
          };
        }
        return s;
      });
      logMockAudit('UPDATE_SKILL', `Updated Skill #${id} in database`);
      saveMockData();
      return { success: true, message: `Skill #${id} updated successfully` };
    }

    if (cleanUrl.match(/\/dba\/users\/.*\/role/)) {
      const id = cleanUrl.split('/')[3];
      mockData.users = mockData.users.map(u => {
        if (String(u.user_id ?? u.USER_ID) === String(id)) {
          return { ...u, role: body.role, ROLE: body.role };
        }
        return u;
      });
      logMockAudit('UPDATE_USER_ROLE', `Updated user #${id} role to ${body.role}`, 'DBA', 'dba_admin');
      saveMockData();
      return { success: true, message: `User role updated to ${body.role}.` };
    }

    if (cleanUrl.match(/\/dba\/users\/.*\/toggle-status/)) {
      const id = cleanUrl.split('/')[3];
      let newStatus = 1;
      mockData.users = mockData.users.map(u => {
        if (String(u.user_id ?? u.USER_ID) === String(id)) {
          const cur = u.is_active ?? u.IS_ACTIVE ?? 1;
          newStatus = cur === 1 ? 0 : 1;
          return { ...u, is_active: newStatus, IS_ACTIVE: newStatus };
        }
        return u;
      });
      logMockAudit('TOGGLE_USER_STATUS', `Set user #${id} active status to ${newStatus}`, 'DBA', 'dba_admin');
      saveMockData();
      return { success: true, message: `User account ${newStatus === 1 ? 'activated' : 'deactivated'}.` };
    }

    return { success: true, message: 'Updated successfully' };
  }

  // ─── 3. POST Operations ───────────────────────────────────────────
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
        reg_date: new Date().toISOString().split('T')[0],
        edu_id: body.edu_id || 'ED001',
        app_id: body.app_id || 'APP001',
        dep_id: body.dep_id || 'D001',
        int_id: body.int_id || 'INT001',
        address: { house_no: body.house_no || '', city: body.city || '', street: body.street || '' },
        phones: body.phone ? [body.phone] : [],
        emails: body.email ? [body.email] : [],
        education: { specialization: 'CS', cgpa: 8.5, degree: 'BTech', university: 'Anna University' },
        application: { app_id: body.app_id || 'APP001', app_status: 'Shortlisted', final_result: 'Pending' },
        skills: []
      };
      mockData.candidates.push(newCand);
      logMockAudit('CREATE_CANDIDATE', `Created Candidate #${nextId} (${newCand.fullName})`);
      saveMockData();
      return { success: true, message: 'Candidate added to Oracle Database', data: newCand };
    }
    if (cleanUrl === '/jobs') {
      const nextKey = (mockData.jobs.reduce((mx, j) => Math.max(mx, j.job_key || 0), 0)) + 1;
      const newJob = {
        job_key: nextKey,
        job_id: `J${String(nextKey).padStart(3, '0')}`,
        job_title: body.job_title || 'Software Role',
        job_status: body.job_status || 'Open',
        salary: body.salary ? Number(body.salary) : 65000,
        descriptive: body.descriptive || 'Standard recruitment role',
        closing_date: body.closing_date || '2026-10-31',
        posted_date: new Date().toISOString().split('T')[0],
        applicant_count: 0,
        required_skills: []
      };
      mockData.jobs.push(newJob);
      logMockAudit('CREATE_JOB', `Created Job #${newJob.job_id} (${newJob.job_title})`);
      saveMockData();
      return { success: true, message: 'Job posting created in Oracle Database', data: newJob };
    }
    if (cleanUrl === '/applications') {
      const nextNum = (mockData.applications.reduce((mx, a) => {
        const v = parseInt((a.app_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const matchedCand = body.cand_id
        ? mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id))
        : mockData.candidates[0];
      const matchedJob = body.job_key
        ? mockData.jobs.find(j => String(j.job_key) === String(body.job_key))
        : mockData.jobs[0];
      const newApp = {
        app_id: `APP${String(nextNum).padStart(3, '0')}`,
        app_status: body.app_status || 'In Review',
        final_result: body.final_result || 'Pending',
        app_date: body.app_date || new Date().toISOString().split('T')[0],
        offer_letter: body.offer_letter || 'Standard Application',
        candidate: matchedCand
          ? { id: matchedCand.cand_id, cand_id: matchedCand.cand_id, name: matchedCand.fullName }
          : { id: 101, cand_id: 101, name: 'Applicant' },
        job: matchedJob
          ? { job_key: matchedJob.job_key, job_id: matchedJob.job_id, job_title: matchedJob.job_title }
          : { job_key: 1, job_id: 'J001', job_title: 'Software Role' }
      };
      mockData.applications.push(newApp);
      logMockAudit('CREATE_APPLICATION', `Created Application #${newApp.app_id} (${newApp.app_status})`);
      saveMockData();
      return { success: true, message: 'Application submitted to database', data: newApp };
    }
    if (cleanUrl === '/interviews') {
      const nextNum = (mockData.interviews.reduce((mx, i) => {
        const v = parseInt((i.int_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const matchedCand = body.cand_id
        ? mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id))
        : null;
      const newInt = {
        int_id: `INT${String(nextNum).padStart(3, '0')}`,
        int_date: body.int_date || new Date().toISOString().split('T')[0],
        int_time: body.int_time || '11:00',
        int_mode: body.int_mode || 'Online',
        location: body.location || 'Virtual Meet',
        int_status: body.int_status || 'Scheduled',
        score: body.score !== undefined && body.score !== '' && body.score !== null ? Number(body.score) : null,
        feedback: body.feedback || '',
        candidate: matchedCand ? { cand_id: matchedCand.cand_id, name: matchedCand.fullName } : { name: 'Candidate Pool' }
      };
      mockData.interviews.push(newInt);
      logMockAudit('SCHEDULE_INTERVIEW', `Scheduled Interview #${newInt.int_id}`);
      saveMockData();
      return { success: true, message: 'Interview scheduled in database', data: newInt };
    }
    if (cleanUrl === '/employers') {
      const nextNum = (mockData.employers.reduce((mx, e) => {
        const v = parseInt((e.emp_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newEmp = {
        emp_id: `E${String(nextNum).padStart(3, '0')}`,
        company_name: body.company_name || 'Enterprise',
        founded_year: body.founded_year ? Number(body.founded_year) : 2020,
        headquarter: body.headquarter || 'Bengaluru',
        company_mail: body.company_mail || '',
        website: body.website || '',
        phones: body.phone_no ? [body.phone_no] : [],
        license_no: `LIC-${nextNum}-GEN`,
        agency_name: 'Direct'
      };
      mockData.employers.push(newEmp);
      logMockAudit('CREATE_EMPLOYER', `Created Employer #${newEmp.emp_id} (${newEmp.company_name})`);
      saveMockData();
      return { success: true, message: 'Employer added to database', data: newEmp };
    }
    if (cleanUrl === '/skills') {
      const nextNum = (mockData.skills.reduce((mx, s) => {
        const v = parseInt((s.skill_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0)) + 1;
      const newSkill = {
        skill_id: `S${String(nextNum).padStart(3, '0')}`,
        skill_name: body.skill_name || 'Skill',
        skill_category: body.skill_category || 'Programming',
        description: body.description || '',
        demandCount: 0,
        candidatesWithSkill: 0
      };
      mockData.skills.push(newSkill);
      logMockAudit('CREATE_SKILL', `Created Skill #${newSkill.skill_id} (${newSkill.skill_name})`);
      saveMockData();
      return { success: true, message: 'Skill added to database', data: newSkill };
    }
    if (cleanUrl === '/dba/users') {
      const nextId = (mockData.users.reduce((mx, u) => Math.max(mx, u.user_id || u.USER_ID || 0), 0)) + 1;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const roleVal = body.role || 'USER';
      const fullName = body.full_name || body.username;
      const email = body.email || `${body.username}@jrms.org`;
      const newUser = {
        user_id: nextId,
        USER_ID: nextId,
        username: body.username,
        USERNAME: body.username,
        full_name: fullName,
        FULL_NAME: fullName,
        email,
        EMAIL: email,
        role: roleVal,
        ROLE: roleVal,
        is_active: 1,
        IS_ACTIVE: 1,
        created_at: now,
        CREATED_AT: now
      };
      mockData.users.push(newUser);
      logMockAudit('CREATE_USER', `Created user account: ${body.username} (${roleVal})`, 'DBA', 'dba_admin');
      saveMockData();
      return { success: true, message: `User "${body.username}" created successfully.`, data: newUser };
    }
    if (cleanUrl === '/dba/maintenance') {
      if (body.action === 'RESET_SEED_DATA') {
        resetMockData();
        logMockAudit('RESET_SEED_DATA', 'Restored academic seed dataset to clean baseline', 'DBA', 'dba_admin');
        return { success: true, message: 'Academic seed dataset restored to clean baseline.' };
      }
      if (body.action === 'RECALCULATE_STATISTICS') {
        logMockAudit('GATHER_STATS', 'Recalculated optimizer statistics across all 41 relations', 'DBA', 'dba_admin');
        saveMockData();
        return { success: true, message: 'Optimizer statistics gathered for all tables.' };
      }
      if (body.action === 'VERIFY_INTEGRITY') {
        logMockAudit('VERIFY_INTEGRITY', 'Full referential integrity check completed: 0 orphan rows', 'DBA', 'dba_admin');
        saveMockData();
        return { success: true, message: 'Integrity verified: all foreign key relations are healthy.' };
      }
      return { success: true, message: 'Maintenance task completed.' };
    }
    if (cleanUrl === '/dba/execute-sql') {
      return { success: true, data: executeMockSql(body.query) };
    }
    return { success: true, message: 'Saved successfully' };
  }

  // ─── 4. GET Operations ────────────────────────────────────────────
  // User & Dashboard
  if (cleanUrl === '/user/dashboard' || cleanUrl === '/dashboard' || cleanUrl === '/dashboard/user' || cleanUrl === '/user') {
    return { success: true, data: getMockUserDashboard() };
  }
  if (cleanUrl === '/candidates') {
    let list = [...mockData.candidates];
    const search = (urlParams.get('search') || '').toLowerCase();
    const gender = urlParams.get('gender') || '';
    if (gender && gender !== 'ALL') {
      list = list.filter(c => (c.gender || '').toLowerCase() === gender.toLowerCase());
    }
    if (search) {
      list = list.filter(c =>
        (c.fullName || '').toLowerCase().includes(search) ||
        (c.address?.city || '').toLowerCase().includes(search) ||
        String(c.cand_id).includes(search) ||
        (c.education?.specialization || '').toLowerCase().includes(search)
      );
    }
    return { success: true, data: list };
  }
  if (cleanUrl.startsWith('/candidates/')) {
    const id = parseInt(cleanUrl.split('/')[2], 10);
    const candidate = mockData.candidates.find(c => c.cand_id === id) || mockData.candidates[0];
    return { success: true, data: candidate };
  }
  if (cleanUrl === '/jobs') {
    let list = [...mockData.jobs];
    const status = urlParams.get('status') || '';
    const title = (urlParams.get('title') || '').toLowerCase();
    if (status && status !== 'ALL') {
      list = list.filter(j => (j.job_status || '').toLowerCase() === status.toLowerCase());
    }
    if (title) {
      list = list.filter(j =>
        (j.job_title || '').toLowerCase().includes(title) ||
        (j.job_id || '').toLowerCase().includes(title) ||
        (j.descriptive || '').toLowerCase().includes(title)
      );
    }
    return { success: true, data: list };
  }
  if (cleanUrl.startsWith('/jobs/')) {
    const id = cleanUrl.split('/')[2];
    const job = mockData.jobs.find(j => String(j.job_key) === id || String(j.job_id) === id) || mockData.jobs[0];
    return { success: true, data: job };
  }
  if (cleanUrl === '/applications') {
    return { success: true, data: [...mockData.applications] };
  }
  if (cleanUrl === '/interviews') {
    let list = [...mockData.interviews];
    const mode = urlParams.get('mode') || '';
    const search = (urlParams.get('search') || '').toLowerCase();
    if (mode && mode !== 'ALL') {
      list = list.filter(i => (i.int_mode || '').toLowerCase() === mode.toLowerCase());
    }
    if (search) {
      list = list.filter(i =>
        (i.int_id || '').toLowerCase().includes(search) ||
        (i.candidate?.name || '').toLowerCase().includes(search) ||
        (i.location || '').toLowerCase().includes(search) ||
        (i.feedback || '').toLowerCase().includes(search)
      );
    }
    return { success: true, data: list };
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
          jobDemandCount: s.demandCount || 0,
          candidateSupplyCount: s.candidatesWithSkill || 0,
          gap: (s.demandCount || 0) - (s.candidatesWithSkill || 0)
        })),
        salaryReport: mockData.jobs.map(j => ({
          job_id: j.job_id,
          job_title: j.job_title,
          job_status: j.job_status,
          salary: j.salary
        }))
      }
    };
  }
  if (cleanUrl === '/reports/designer') {
    return {
      success: true,
      data: {
        tableReport: getMockDbaTables().data.map(t => ({
          tableName: t.TABLE_NAME,
          columnCount: t.COLUMN_COUNT,
          primaryKey: t.PK_NAME || 'NONE',
          foreignKeyCount: t.FK_COUNT || 0,
          checkConstraintCount: 0,
          rowCount: t.ROW_COUNT
        }))
      }
    };
  }
  if (cleanUrl === '/reports/dba') {
    const userRoleCounts = {};
    mockData.users.forEach(u => {
      const r = u.role || u.ROLE;
      userRoleCounts[r] = (userRoleCounts[r] || 0) + 1;
    });
    const auditActionCounts = {};
    mockData.auditLogs.forEach(l => {
      auditActionCounts[l.ACTION] = (auditActionCounts[l.ACTION] || 0) + 1;
    });
    return { success: true, data: { userRoleCounts, auditActionCounts } };
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
  if (cleanUrl === '/designer/relationships') {
    const fks = getMockForeignKeys();
    return {
      success: true,
      data: fks.map(fk => ({
        constraintName: fk.constraintName,
        childTable: fk.tableName,
        childColumn: (fk.columns || []).join(', '),
        parentTable: fk.referencedTable,
        parentConstraint: `PK_${fk.referencedTable}`,
        cardinality: 'N : 1',
        deleteRule: fk.deleteRule || 'CASCADE',
        status: fk.status || 'ENABLED'
      }))
    };
  }
  if (cleanUrl === '/designer/normalization') {
    return {
      success: true,
      data: getMockDesignerDashboard().normalizationMetrics.decomposedRelations.map(d => ({
        originalEntity: d.original,
        decomposedTables: d.decomposedInto,
        normalForm: 'BCNF',
        functionalDependency: `${d.original}_ID -> Attributes`,
        rationale: d.reason
      }))
    };
  }
  if (cleanUrl === '/designer/columns') {
    const search = urlParams.get('search') || '';
    return { success: true, data: getMockColumns(search) };
  }
  if (cleanUrl === '/designer/constraints') {
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
    const tableName = cleanUrl.split('/')[3];
    const details = getMockTableDetails(tableName) || getMockTableDetails('CANDIDATE');
    return {
      success: true,
      data: {
        tableName: details.tableName,
        rowCount: details.rowCount,
        columns: details.columns,
        constraints: details.constraints,
        rows: details.sampleRows
      }
    };
  }
  if (cleanUrl === '/dba/execute-sql') {
    return { success: true, data: executeMockSql(body.query) };
  }
  if (cleanUrl.startsWith('/dba/objects')) {
    const typeFilter = urlParams.get('type') || 'ALL';
    const allObjects = [
      ...getMockDbaTables().data.map(t => ({
        OBJECT_NAME: t.TABLE_NAME,
        OBJECT_TYPE: 'TABLE',
        CREATED: '2026-09-01 09:00:00',
        LAST_DDL_TIME: '2026-09-03 18:30:00',
        STATUS: 'VALID'
      })),
      ...getMockPrimaryKeys().map(pk => ({
        OBJECT_NAME: pk.constraintName,
        OBJECT_TYPE: 'INDEX',
        CREATED: '2026-09-01 09:05:00',
        LAST_DDL_TIME: '2026-09-03 18:30:00',
        STATUS: 'VALID'
      }))
    ];
    const filtered = typeFilter !== 'ALL' ? allObjects.filter(o => o.OBJECT_TYPE === typeFilter) : allObjects;
    return { success: true, total: filtered.length, data: filtered };
  }
  if (cleanUrl.startsWith('/dba/users')) {
    return {
      success: true,
      data: [...mockData.users]
    };
  }
  if (cleanUrl.startsWith('/dba/indexes')) {
    return {
      success: true,
      data: getMockPrimaryKeys().map(pk => ({
        INDEX_NAME: pk.constraintName,
        TABLE_NAME: pk.tableName,
        UNIQUENESS: 'UNIQUE',
        TABLESPACE_NAME: 'USERS',
        STATUS: 'VALID'
      }))
    };
  }
  if (cleanUrl.startsWith('/dba/constraints-health')) {
    const fks = getMockForeignKeys();
    return {
      success: true,
      data: {
        summary: {
          totalConstraints: fks.length,
          enabledCount: fks.length,
          disabledCount: 0
        },
        integrityChecks: fks.slice(0, 15).map(fk => ({
          constraintName: fk.constraintName,
          childTable: fk.tableName,
          parentTable: fk.referencedTable,
          orphanCount: 0,
          status: 'VALID'
        }))
      }
    };
  }
  if (cleanUrl.startsWith('/dba/statistics')) {
    return {
      success: true,
      data: getMockDbaTables().data.map(t => ({
        tableName: t.TABLE_NAME,
        rowCount: t.ROW_COUNT,
        avgRowLengthBytes: t.COLUMN_COUNT * 45,
        estimatedSizeKB: ((t.ROW_COUNT * t.COLUMN_COUNT * 45) / 1024).toFixed(2),
        lastAnalyzed: '2026-09-04'
      }))
    };
  }
  if (cleanUrl.startsWith('/dba/audit-log') || cleanUrl.startsWith('/dba/audit')) {
    return { success: true, data: [...mockData.auditLogs] };
  }

  // Fallback generic
  return { success: true, data: [] };
}

// Response Interceptor: Enforce real backend response processing and clean error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Handle 401 Unauthorized: token expired or invalid (except when attempting initial login)
    if (status === 401 && !url.includes('/auth/login')) {
      console.warn('[API Auth] Session expired or unverified token. Clearing credentials.');
      localStorage.removeItem('jrms_token');
      localStorage.removeItem('jrms_user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Enhance error message for connection / service unavailable
    if (status === 503 || !error.response) {
      const serverMsg = error.response?.data?.message;
      const genericMsg = serverMsg || 'Database service unavailable. Please check the graph database connection.';
      console.error(`[API 503 Service Unavailable] ${url}: ${genericMsg}`);
    }

    return Promise.reject(error);
  }
);

export default api;
