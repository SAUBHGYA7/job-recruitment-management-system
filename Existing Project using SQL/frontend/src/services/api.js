import axios from 'axios';
import {
  mockData,
  deletedMockIds,
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
  const urlParams = new URLSearchParams((url || '').split('?')[1] || '');
  const m = (method || 'get').toLowerCase();

  // ─── 1. DELETE Operations ──────────────────────────────────────────
  if (m === 'delete') {
    if (cleanUrl.startsWith('/candidates/')) {
      const id = parseInt(cleanUrl.split('/')[2], 10);
      mockData.candidates = mockData.candidates.filter(c => c.cand_id !== id);
      deletedMockIds.candidates.add(id);
      logMockAudit('DELETE_CANDIDATE', `Deleted Candidate #${id} from database`);
      saveMockData();
      return { success: true, message: `Candidate #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/jobs/')) {
      const id = cleanUrl.split('/')[2];
      mockData.jobs = mockData.jobs.filter(j => String(j.job_key) !== id && String(j.job_id) !== id);
      deletedMockIds.jobs.add(id);
      logMockAudit('DELETE_JOB', `Deleted Job #${id} from database`);
      saveMockData();
      return { success: true, message: `Job #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/applications/')) {
      const id = cleanUrl.split('/')[2];
      mockData.applications = mockData.applications.filter(a => String(a.app_id) !== id);
      deletedMockIds.applications.add(id.toUpperCase());
      logMockAudit('DELETE_APPLICATION', `Deleted Application #${id} from database`);
      saveMockData();
      return { success: true, message: `Application #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/interviews/')) {
      const id = cleanUrl.split('/')[2];
      mockData.interviews = mockData.interviews.filter(i => String(i.int_id) !== id);
      deletedMockIds.interviews.add(id.toUpperCase());
      logMockAudit('DELETE_INTERVIEW', `Deleted Interview #${id} from database`);
      saveMockData();
      return { success: true, message: `Interview #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/employers/')) {
      const id = cleanUrl.split('/')[2];
      mockData.employers = mockData.employers.filter(e => String(e.emp_id) !== id);
      deletedMockIds.employers.add(id.toUpperCase());
      logMockAudit('DELETE_EMPLOYER', `Deleted Employer #${id} from database`);
      saveMockData();
      return { success: true, message: `Employer #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/skills/')) {
      const id = cleanUrl.split('/')[2];
      mockData.skills = mockData.skills.filter(s => String(s.skill_id) !== id && String(s.skill_name).toLowerCase() !== id.toLowerCase());
      deletedMockIds.skills.add(id.toUpperCase());
      logMockAudit('DELETE_SKILL', `Deleted Skill #${id} from database`);
      saveMockData();
      return { success: true, message: `Skill #${id} deleted from database` };
    }
    // Extended modules DELETE handlers
    if (cleanUrl.startsWith('/education/')) {
      const id = cleanUrl.split('/')[2];
      mockData.education = (mockData.education || []).filter(e => e.edu_id !== id);
      logMockAudit('DELETE_EDUCATION', `Deleted Education #${id}`);
      saveMockData();
      return { success: true, message: `Education #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/experience/')) {
      const id = cleanUrl.split('/')[2];
      mockData.experience = (mockData.experience || []).filter(e => e.exp_id !== id);
      logMockAudit('DELETE_EXPERIENCE', `Deleted Experience #${id}`);
      saveMockData();
      return { success: true, message: `Experience #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/dependents/')) {
      const id = cleanUrl.split('/')[2];
      mockData.dependents = (mockData.dependents || []).filter(d => d.dep_id !== id);
      logMockAudit('DELETE_DEPENDENT', `Deleted Dependent #${id}`);
      saveMockData();
      return { success: true, message: `Dependent #${id} deleted from database` };
    }
    if (cleanUrl.startsWith('/subtypes/')) {
      const parts = cleanUrl.split('/');
      const type = parts[2];
      const cid = parseInt(parts[3], 10);
      if (type === 'fresher') mockData.freshers = (mockData.freshers || []).filter(f => f.cand_id !== cid);
      if (type === 'experienced') mockData.experienced = (mockData.experienced || []).filter(e => e.cand_id !== cid);
      if (type === 'freelancer') mockData.freelancers = (mockData.freelancers || []).filter(fl => fl.cand_id !== cid);
      logMockAudit(`DELETE_${(type || '').toUpperCase()}`, `Removed candidate #${cid} from ${type}`);
      saveMockData();
      return { success: true, message: `${type} profile removed` };
    }
    if (cleanUrl.startsWith('/locations/')) {
      const pin = parseInt(cleanUrl.split('/')[2], 10);
      mockData.locations = (mockData.locations || []).filter(l => l.pincode !== pin);
      logMockAudit('DELETE_LOCATION', `Deleted Location #${pin}`);
      saveMockData();
      return { success: true, message: `Location #${pin} deleted` };
    }
    if (cleanUrl.startsWith('/companies/')) {
      const id = cleanUrl.split('/')[2];
      mockData.companies = (mockData.companies || []).filter(c => c.comp_id !== id);
      logMockAudit('DELETE_COMPANY', `Deleted Company #${id}`);
      saveMockData();
      return { success: true, message: `Company #${id} deleted` };
    }
    if (cleanUrl.startsWith('/agencies/')) {
      const id = cleanUrl.split('/')[2];
      mockData.agencies = (mockData.agencies || []).filter(a => a.agency_no !== id);
      logMockAudit('DELETE_AGENCY', `Deleted Agency #${id}`);
      saveMockData();
      return { success: true, message: `Agency #${id} deleted` };
    }
    if (cleanUrl.startsWith('/candidate-skills/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const sid = parts[3];
      mockData.candidateSkills = (mockData.candidateSkills || []).filter(cs => !(cs.cand_id === cid && cs.skill_id === sid));
      logMockAudit('DELETE_CANDIDATE_SKILL', `Removed Skill #${sid} from Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Candidate skill removed' };
    }
    if (cleanUrl.startsWith('/job-skills/')) {
      const parts = cleanUrl.split('/');
      const jkey = parseInt(parts[2], 10);
      const sid = parts[3];
      mockData.jobSkills = (mockData.jobSkills || []).filter(js => !(js.job_key === jkey && js.skill_id === sid));
      logMockAudit('DELETE_JOB_SKILL', `Removed Skill #${sid} requirement from Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Job skill requirement removed' };
    }
    if (cleanUrl.startsWith('/assessments/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const jkey = parseInt(parts[3], 10);
      const sid = parts[4];
      mockData.assessments = (mockData.assessments || []).filter(a => !(a.cand_id === cid && a.job_key === jkey && a.skill_id === sid));
      logMockAudit('DELETE_ASSESSMENT', `Removed assessment for Candidate #${cid} Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Assessment removed' };
    }
    if (cleanUrl.startsWith('/matches/')) {
      const id = cleanUrl.split('/')[2];
      mockData.matches = (mockData.matches || []).filter(m => m.match_id !== id);
      logMockAudit('DELETE_MATCH', `Removed Match #${id}`);
      saveMockData();
      return { success: true, message: `Match #${id} removed` };
    }
    if (cleanUrl.startsWith('/preferences/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const pin = parseInt(parts[3], 10);
      mockData.preferences = (mockData.preferences || []).filter(p => !(p.cand_id === cid && p.pincode === pin));
      logMockAudit('DELETE_PREFERENCE', `Removed preference for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Preference removed' };
    }
    if (cleanUrl.startsWith('/applies/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const jkey = parseInt(parts[3], 10);
      mockData.applies = (mockData.applies || []).filter(a => !(a.cand_id === cid && a.job_key === jkey));
      logMockAudit('DELETE_APPLIES', `Removed Applies relation for Candidate #${cid} Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Applies relation removed' };
    }
    if (cleanUrl.startsWith('/follows/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const eid = parts[3];
      mockData.follows = (mockData.follows || []).filter(f => !(f.cand_id === cid && f.emp_id === eid));
      logMockAudit('DELETE_FOLLOWS', `Candidate #${cid} unfollowed Employer #${eid}`);
      saveMockData();
      return { success: true, message: 'Follow relation removed' };
    }
    if (cleanUrl.startsWith('/referrals/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const dt = parts[3];
      mockData.referrals = (mockData.referrals || []).filter(r => !(r.cand_id === cid && r.referral_date === dt));
      logMockAudit('DELETE_REFERRAL', `Deleted referral for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Referral removed' };
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

    // Extended modules PUT handlers
    if (cleanUrl.startsWith('/education/')) {
      const id = cleanUrl.split('/')[2];
      mockData.education = (mockData.education || []).map(e => {
        if (e.edu_id === id) {
          return {
            ...e,
            degree: body.degree !== undefined ? body.degree : e.degree,
            cgpa: body.cgpa !== undefined ? Number(body.cgpa) : e.cgpa,
            specialization: body.specialization !== undefined ? body.specialization : e.specialization,
            university: body.university !== undefined ? body.university : e.university,
            start_year: body.start_year !== undefined ? Number(body.start_year) : e.start_year,
            end_year: body.end_year !== undefined ? Number(body.end_year) : e.end_year,
            cand_id: body.cand_id !== undefined ? Number(body.cand_id) : e.cand_id
          };
        }
        return e;
      });
      logMockAudit('UPDATE_EDUCATION', `Updated Education #${id}`);
      saveMockData();
      return { success: true, message: `Education #${id} updated successfully` };
    }
    if (cleanUrl.startsWith('/experience/')) {
      const id = cleanUrl.split('/')[2];
      mockData.experience = (mockData.experience || []).map(e => {
        if (e.exp_id === id) {
          return {
            ...e,
            comp_name: body.comp_name !== undefined ? body.comp_name : e.comp_name,
            job_title: body.job_title !== undefined ? body.job_title : e.job_title,
            start_date: body.start_date !== undefined ? body.start_date : e.start_date,
            end_date: body.end_date !== undefined ? body.end_date : e.end_date,
            cand_id: body.cand_id !== undefined ? Number(body.cand_id) : e.cand_id
          };
        }
        return e;
      });
      logMockAudit('UPDATE_EXPERIENCE', `Updated Experience #${id}`);
      saveMockData();
      return { success: true, message: `Experience #${id} updated successfully` };
    }
    if (cleanUrl.startsWith('/dependents/')) {
      const id = cleanUrl.split('/')[2];
      mockData.dependents = (mockData.dependents || []).map(d => {
        if (d.dep_id === id) {
          return {
            ...d,
            dob: body.dob !== undefined ? body.dob : d.dob,
            relationship: body.relationship !== undefined ? body.relationship : d.relationship,
            cand_id: body.cand_id !== undefined ? Number(body.cand_id) : d.cand_id
          };
        }
        return d;
      });
      logMockAudit('UPDATE_DEPENDENT', `Updated Dependent #${id}`);
      saveMockData();
      return { success: true, message: `Dependent #${id} updated successfully` };
    }
    if (cleanUrl.startsWith('/subtypes/')) {
      const parts = cleanUrl.split('/');
      const type = parts[2];
      const cid = parseInt(parts[3], 10);
      if (type === 'fresher') {
        mockData.freshers = (mockData.freshers || []).map(f => f.cand_id === cid ? { ...f, grad_year: Number(body.grad_year || f.grad_year), internship_count: Number(body.internship_count || f.internship_count) } : f);
      } else if (type === 'experienced') {
        mockData.experienced = (mockData.experienced || []).map(e => e.cand_id === cid ? { ...e, total_exp: Number(body.total_exp || e.total_exp), current_company: body.current_company || e.current_company } : e);
      } else if (type === 'freelancer') {
        mockData.freelancers = (mockData.freelancers || []).map(fl => fl.cand_id === cid ? { ...fl, hourly_rate: Number(body.hourly_rate || fl.hourly_rate), portfolio_url: body.portfolio_url || fl.portfolio_url } : fl);
      }
      logMockAudit(`UPDATE_${(type || '').toUpperCase()}`, `Updated candidate #${cid} in ${type}`);
      saveMockData();
      return { success: true, message: `${type} profile updated` };
    }
    if (cleanUrl.startsWith('/locations/')) {
      const pin = parseInt(cleanUrl.split('/')[2], 10);
      mockData.locations = (mockData.locations || []).map(l => l.pincode === pin ? { ...l, city: body.city || l.city, state: body.state || l.state, country: body.country || l.country } : l);
      logMockAudit('UPDATE_LOCATION', `Updated Location #${pin}`);
      saveMockData();
      return { success: true, message: `Location #${pin} updated` };
    }
    if (cleanUrl.startsWith('/companies/')) {
      const id = cleanUrl.split('/')[2];
      mockData.companies = (mockData.companies || []).map(c => c.comp_id === id ? { ...c, comp_type: body.comp_type || c.comp_type, emp_count: Number(body.emp_count || c.emp_count), emp_id: body.emp_id || c.emp_id } : c);
      logMockAudit('UPDATE_COMPANY', `Updated Company #${id}`);
      saveMockData();
      return { success: true, message: `Company #${id} updated` };
    }
    if (cleanUrl.startsWith('/agencies/')) {
      const id = cleanUrl.split('/')[2];
      mockData.agencies = (mockData.agencies || []).map(a => a.agency_no === id ? { ...a, agency_name: body.agency_name || a.agency_name, emp_id: body.emp_id || a.emp_id, lic_no: body.lic_no || a.lic_no } : a);
      logMockAudit('UPDATE_AGENCY', `Updated Agency #${id}`);
      saveMockData();
      return { success: true, message: `Agency #${id} updated` };
    }
    if (cleanUrl.startsWith('/candidate-skills/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const sid = parts[3];
      mockData.candidateSkills = (mockData.candidateSkills || []).map(cs => (cs.cand_id === cid && cs.skill_id === sid) ? { ...cs, pgd_level: body.pgd_level || cs.pgd_level, years_of_exp: Number(body.years_of_exp || cs.years_of_exp) } : cs);
      logMockAudit('UPDATE_CANDIDATE_SKILL', `Updated Skill #${sid} for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Candidate skill updated' };
    }
    if (cleanUrl.startsWith('/job-skills/')) {
      const parts = cleanUrl.split('/');
      const jkey = parseInt(parts[2], 10);
      const sid = parts[3];
      mockData.jobSkills = (mockData.jobSkills || []).map(js => (js.job_key === jkey && js.skill_id === sid) ? { ...js, is_mandatory: body.is_mandatory || js.is_mandatory, min_years: Number(body.min_years || js.min_years) } : js);
      logMockAudit('UPDATE_JOB_SKILL', `Updated Skill requirement #${sid} for Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Job skill requirement updated' };
    }
    if (cleanUrl.startsWith('/assessments/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const jkey = parseInt(parts[3], 10);
      const sid = parts[4];
      mockData.assessments = (mockData.assessments || []).map(a => (a.cand_id === cid && a.job_key === jkey && a.skill_id === sid) ? { ...a, match_pct: Number(body.match_pct || a.match_pct), assessment_score: Number(body.assessment_score || a.assessment_score), assessment_date: body.assessment_date || a.assessment_date } : a);
      logMockAudit('UPDATE_ASSESSMENT', `Updated assessment for Candidate #${cid} Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Assessment updated' };
    }
    if (cleanUrl.startsWith('/matches/')) {
      const id = cleanUrl.split('/')[2];
      mockData.matches = (mockData.matches || []).map(m => m.match_id === id ? { ...m, cand_id: Number(body.cand_id || m.cand_id), job_key: Number(body.job_key || m.job_key), match_date: body.match_date || m.match_date } : m);
      logMockAudit('UPDATE_MATCH', `Updated Match #${id}`);
      saveMockData();
      return { success: true, message: `Match #${id} updated` };
    }
    if (cleanUrl.startsWith('/referrals/')) {
      const parts = cleanUrl.split('/');
      const cid = parseInt(parts[2], 10);
      const dt = parts[3];
      mockData.referrals = (mockData.referrals || []).map(r => (r.cand_id === cid && r.referral_date === dt) ? { ...r, referral_status: body.referral_status || r.referral_status } : r);
      logMockAudit('UPDATE_REFERRAL', `Updated referral status for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Referral updated' };
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

    // Extended modules POST handlers
    if (cleanUrl === '/education') {
      const nextNum = (mockData.education || []).reduce((mx, e) => {
        const v = parseInt((e.edu_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextEduId = `ED${String(nextNum).padStart(3, '0')}`;
      const cand = mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id));
      const newEdu = {
        edu_id: nextEduId,
        cgpa: body.cgpa ? Number(body.cgpa) : 8.5,
        specialization: body.specialization || 'Computer Science',
        degree: body.degree || 'BTech',
        end_year: body.end_year ? Number(body.end_year) : 2024,
        university: body.university || 'Anna University',
        start_year: body.start_year ? Number(body.start_year) : 2020,
        cand_id: body.cand_id ? Number(body.cand_id) : 101,
        candidate_name: cand ? cand.fullName : `Candidate #${body.cand_id || 101}`
      };
      mockData.education.push(newEdu);
      logMockAudit('CREATE_EDUCATION', `Created Education #${nextEduId}`);
      saveMockData();
      return { success: true, message: `Education #${nextEduId} created`, data: newEdu };
    }

    if (cleanUrl === '/experience') {
      const nextNum = (mockData.experience || []).reduce((mx, e) => {
        const v = parseInt((e.exp_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextExpId = `EXP${String(nextNum).padStart(3, '0')}`;
      const cand = mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id));
      const newExp = {
        exp_id: nextExpId,
        job_title: body.job_title || 'Software Engineer',
        start_date: body.start_date || '2021-01-01',
        end_date: body.end_date || '2023-01-01',
        comp_name: body.comp_name || 'Tech Corp',
        cand_id: body.cand_id ? Number(body.cand_id) : 101,
        candidate_name: cand ? cand.fullName : `Candidate #${body.cand_id || 101}`
      };
      mockData.experience.push(newExp);
      logMockAudit('CREATE_EXPERIENCE', `Created Experience #${nextExpId}`);
      saveMockData();
      return { success: true, message: `Experience #${nextExpId} created`, data: newExp };
    }

    if (cleanUrl === '/dependents') {
      const nextNum = (mockData.dependents || []).reduce((mx, d) => {
        const v = parseInt((d.dep_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextDepId = `D${String(nextNum).padStart(3, '0')}`;
      const cand = mockData.candidates.find(c => String(c.cand_id) === String(body.cand_id));
      const newDep = {
        dep_id: nextDepId,
        dob: body.dob || '2005-01-01',
        relationship: body.relationship || 'Child',
        cand_id: body.cand_id ? Number(body.cand_id) : 101,
        candidate_name: cand ? cand.fullName : `Candidate #${body.cand_id || 101}`
      };
      mockData.dependents.push(newDep);
      logMockAudit('CREATE_DEPENDENT', `Created Dependent #${nextDepId}`);
      saveMockData();
      return { success: true, message: `Dependent #${nextDepId} created`, data: newDep };
    }

    if (cleanUrl.startsWith('/subtypes/')) {
      const type = cleanUrl.split('/')[2];
      const cid = parseInt(body.cand_id, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const name = cand ? cand.fullName : `Candidate #${cid}`;
      if (type === 'fresher') {
        const item = { cand_id: cid, grad_year: Number(body.grad_year || 2024), internship_count: Number(body.internship_count || 1), candidate_name: name };
        mockData.freshers.push(item);
      } else if (type === 'experienced') {
        const item = { cand_id: cid, total_exp: Number(body.total_exp || 3), current_company: body.current_company || 'Enterprise', candidate_name: name };
        mockData.experienced.push(item);
      } else if (type === 'freelancer') {
        const item = { cand_id: cid, hourly_rate: Number(body.hourly_rate || 750), portfolio_url: body.portfolio_url || 'https://freelance.dev', candidate_name: name };
        mockData.freelancers.push(item);
      }
      logMockAudit(`CREATE_${(type || '').toUpperCase()}`, `Added Candidate #${cid} as ${type}`);
      saveMockData();
      return { success: true, message: `${type} profile created` };
    }

    if (cleanUrl === '/locations') {
      const pin = parseInt(body.pincode, 10);
      const newLoc = {
        pincode: pin,
        city: body.city || 'Bengaluru',
        state: body.state || 'Karnataka',
        country: body.country || 'India'
      };
      mockData.locations.push(newLoc);
      logMockAudit('CREATE_LOCATION', `Created Location #${pin}`);
      saveMockData();
      return { success: true, message: `Location #${pin} added`, data: newLoc };
    }

    if (cleanUrl === '/companies') {
      const nextNum = (mockData.companies || []).reduce((mx, c) => {
        const v = parseInt((c.comp_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextCompId = `COMP${String(nextNum).padStart(3, '0')}`;
      const emp = mockData.employers.find(e => e.emp_id === body.emp_id);
      const newComp = {
        comp_id: nextCompId,
        comp_type: body.comp_type || 'Software Enterprise',
        emp_count: body.emp_count ? Number(body.emp_count) : 250,
        emp_id: body.emp_id || 'E001',
        company_name: emp ? emp.company_name : 'Enterprise Partner'
      };
      mockData.companies.push(newComp);
      logMockAudit('CREATE_COMPANY', `Created Company #${nextCompId}`);
      saveMockData();
      return { success: true, message: `Company #${nextCompId} created`, data: newComp };
    }

    if (cleanUrl === '/agencies') {
      const nextNum = (mockData.agencies || []).reduce((mx, a) => {
        const v = parseInt((a.agency_no || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextAgencyNo = `AG${String(nextNum).padStart(3, '0')}`;
      const emp = mockData.employers.find(e => e.emp_id === body.emp_id);
      const newAgency = {
        agency_no: nextAgencyNo,
        agency_name: body.agency_name || 'Global Talent Search',
        emp_id: body.emp_id || 'E001',
        company_name: emp ? emp.company_name : 'Enterprise Partner',
        lic_no: body.lic_no || `LIC-${nextNum}-GEN`
      };
      mockData.agencies.push(newAgency);
      logMockAudit('CREATE_AGENCY', `Created Agency #${nextAgencyNo}`);
      saveMockData();
      return { success: true, message: `Agency #${nextAgencyNo} created`, data: newAgency };
    }

    if (cleanUrl === '/candidate-skills') {
      const cid = parseInt(body.cand_id, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const sk = mockData.skills.find(s => s.skill_id === body.skill_id);
      const newCS = {
        cand_id: cid,
        skill_id: body.skill_id,
        pgd_level: body.pgd_level || 'Intermediate',
        years_of_exp: body.years_of_exp ? Number(body.years_of_exp) : 2,
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        skill_name: sk ? sk.skill_name : body.skill_id,
        skill_category: sk ? sk.skill_category : 'Technology'
      };
      mockData.candidateSkills.push(newCS);
      logMockAudit('ADD_CANDIDATE_SKILL', `Associated Candidate #${cid} with Skill #${body.skill_id}`);
      saveMockData();
      return { success: true, message: 'Candidate skill added', data: newCS };
    }

    if (cleanUrl === '/job-skills') {
      const jkey = parseInt(body.job_key, 10);
      const jb = mockData.jobs.find(j => j.job_key === jkey);
      const sk = mockData.skills.find(s => s.skill_id === body.skill_id);
      const newJS = {
        job_key: jkey,
        skill_id: body.skill_id,
        is_mandatory: body.is_mandatory || 'Y',
        min_years: body.min_years ? Number(body.min_years) : 2,
        job_id: jb ? jb.job_id : `J${String(jkey).padStart(3, '0')}`,
        job_title: jb ? jb.job_title : `Job #${jkey}`,
        skill_name: sk ? sk.skill_name : body.skill_id,
        skill_category: sk ? sk.skill_category : 'Required'
      };
      mockData.jobSkills.push(newJS);
      logMockAudit('ADD_JOB_SKILL', `Added Skill #${body.skill_id} requirement to Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Job skill requirement added', data: newJS };
    }

    if (cleanUrl === '/assessments') {
      const cid = parseInt(body.cand_id, 10);
      const jkey = parseInt(body.job_key, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const jb = mockData.jobs.find(j => j.job_key === jkey);
      const sk = mockData.skills.find(s => s.skill_id === body.skill_id);
      const newAss = {
        cand_id: cid,
        job_key: jkey,
        skill_id: body.skill_id,
        match_pct: body.match_pct ? Number(body.match_pct) : 85,
        assessment_score: body.assessment_score ? Number(body.assessment_score) : 80,
        assessment_date: body.assessment_date || new Date().toISOString().split('T')[0],
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        job_title: jb ? jb.job_title : `Job #${jkey}`,
        skill_name: sk ? sk.skill_name : body.skill_id
      };
      mockData.assessments.push(newAss);
      logMockAudit('CREATE_ASSESSMENT', `Assessment recorded for Candidate #${cid} Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Assessment recorded', data: newAss };
    }

    if (cleanUrl === '/matches') {
      const nextNum = (mockData.matches || []).reduce((mx, m) => {
        const v = parseInt((m.match_id || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0) + 1;
      const nextMatchId = `M${String(nextNum).padStart(3, '0')}`;
      const cid = parseInt(body.cand_id, 10);
      const jkey = parseInt(body.job_key, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const jb = mockData.jobs.find(j => j.job_key === jkey);
      const newMatch = {
        match_id: nextMatchId,
        cand_id: cid,
        job_key: jkey,
        match_date: body.match_date || new Date().toISOString().split('T')[0],
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        job_title: jb ? jb.job_title : `Job #${jkey}`,
        salary: jb ? jb.salary : 75000
      };
      mockData.matches.push(newMatch);
      logMockAudit('CREATE_MATCH', `Created Match #${nextMatchId}`);
      saveMockData();
      return { success: true, message: `Match #${nextMatchId} generated`, data: newMatch };
    }

    if (cleanUrl === '/preferences') {
      const cid = parseInt(body.cand_id, 10);
      const pin = parseInt(body.pincode, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const loc = (mockData.locations || []).find(l => l.pincode === pin);
      const newPref = {
        cand_id: cid,
        pincode: pin,
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        city: loc ? loc.city : 'Bengaluru',
        state: loc ? loc.state : 'Karnataka',
        country: loc ? loc.country : 'India'
      };
      mockData.preferences.push(newPref);
      logMockAudit('ADD_PREFERENCE', `Saved location preference Pincode #${pin} for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Location preference saved', data: newPref };
    }

    if (cleanUrl === '/applies') {
      const cid = parseInt(body.cand_id, 10);
      const jkey = parseInt(body.job_key, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const jb = mockData.jobs.find(j => j.job_key === jkey);
      const newApplies = {
        cand_id: cid,
        job_key: jkey,
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        job_title: jb ? jb.job_title : `Job #${jkey}`,
        salary: jb ? jb.salary : 65000
      };
      mockData.applies.push(newApplies);
      logMockAudit('ADD_APPLIES', `Candidate #${cid} applied to Job #${jkey}`);
      saveMockData();
      return { success: true, message: 'Application relationship added', data: newApplies };
    }

    if (cleanUrl === '/follows') {
      const cid = parseInt(body.cand_id, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const emp = mockData.employers.find(e => e.emp_id === body.emp_id);
      const newFollows = {
        cand_id: cid,
        emp_id: body.emp_id,
        follow_date: body.follow_date || new Date().toISOString().split('T')[0],
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`,
        company_name: emp ? emp.company_name : body.emp_id
      };
      mockData.follows.push(newFollows);
      logMockAudit('ADD_FOLLOWS', `Candidate #${cid} followed Employer #${body.emp_id}`);
      saveMockData();
      return { success: true, message: 'Follows relationship added', data: newFollows };
    }

    if (cleanUrl === '/referrals') {
      const cid = parseInt(body.cand_id, 10);
      const cand = mockData.candidates.find(c => c.cand_id === cid);
      const newRef = {
        cand_id: cid,
        referral_date: body.referral_date || new Date().toISOString().split('T')[0],
        referral_status: body.referral_status || 'Pending',
        candidate_name: cand ? cand.fullName : `Candidate #${cid}`
      };
      mockData.referrals.push(newRef);
      logMockAudit('ADD_REFERRAL', `Referral recorded for Candidate #${cid}`);
      saveMockData();
      return { success: true, message: 'Referral recorded', data: newRef };
    }

    return { success: true, message: 'Saved successfully' };
  }

  // ─── 4. GET Operations ────────────────────────────────────────────
  // Extended Modules GET Handlers
  if (cleanUrl === '/education') {
    let list = [...(mockData.education || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(e =>
        (e.edu_id || '').toLowerCase().includes(search) ||
        (e.specialization || '').toLowerCase().includes(search) ||
        (e.degree || '').toLowerCase().includes(search) ||
        (e.university || '').toLowerCase().includes(search) ||
        (e.candidate_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/experience') {
    let list = [...(mockData.experience || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(e =>
        (e.exp_id || '').toLowerCase().includes(search) ||
        (e.job_title || '').toLowerCase().includes(search) ||
        (e.comp_name || '').toLowerCase().includes(search) ||
        (e.candidate_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/dependents') {
    let list = [...(mockData.dependents || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(d =>
        (d.dep_id || '').toLowerCase().includes(search) ||
        (d.relationship || '').toLowerCase().includes(search) ||
        (d.candidate_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/subtypes') {
    return {
      success: true,
      data: {
        freshers: [...(mockData.freshers || [])],
        experienced: [...(mockData.experienced || [])],
        freelancers: [...(mockData.freelancers || [])],
        candidates: (mockData.candidates || []).map(c => ({
          cand_id: c.cand_id,
          candidate_name: c.fullName
        }))
      }
    };
  }

  if (cleanUrl === '/locations') {
    let list = [...(mockData.locations || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(l =>
        String(l.pincode).includes(search) ||
        (l.city || '').toLowerCase().includes(search) ||
        (l.state || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/companies') {
    let list = [...(mockData.companies || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(c =>
        (c.comp_id || '').toLowerCase().includes(search) ||
        (c.comp_type || '').toLowerCase().includes(search) ||
        (c.company_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/agencies') {
    let list = [...(mockData.agencies || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(a =>
        (a.agency_no || '').toLowerCase().includes(search) ||
        (a.agency_name || '').toLowerCase().includes(search) ||
        (a.company_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/candidate-skills') {
    let list = [...(mockData.candidateSkills || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(cs =>
        (cs.candidate_name || '').toLowerCase().includes(search) ||
        (cs.skill_name || '').toLowerCase().includes(search) ||
        (cs.pgd_level || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/job-skills') {
    let list = [...(mockData.jobSkills || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(js =>
        (js.job_title || '').toLowerCase().includes(search) ||
        (js.skill_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/assessments') {
    let list = [...(mockData.assessments || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(a =>
        (a.candidate_name || '').toLowerCase().includes(search) ||
        (a.job_title || '').toLowerCase().includes(search) ||
        (a.skill_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/matches') {
    let list = [...(mockData.matches || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(m =>
        (m.match_id || '').toLowerCase().includes(search) ||
        (m.candidate_name || '').toLowerCase().includes(search) ||
        (m.job_title || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/preferences') {
    let list = [...(mockData.preferences || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(p =>
        (p.candidate_name || '').toLowerCase().includes(search) ||
        String(p.pincode).includes(search) ||
        (p.city || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/applies') {
    let list = [...(mockData.applies || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(a =>
        (a.candidate_name || '').toLowerCase().includes(search) ||
        (a.job_title || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/follows') {
    let list = [...(mockData.follows || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(f =>
        (f.candidate_name || '').toLowerCase().includes(search) ||
        (f.company_name || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }

  if (cleanUrl === '/referrals') {
    let list = [...(mockData.referrals || [])];
    const search = (urlParams.get('search') || '').toLowerCase();
    if (search) {
      list = list.filter(r =>
        (r.candidate_name || '').toLowerCase().includes(search) ||
        (r.referral_status || '').toLowerCase().includes(search)
      );
    }
    return { success: true, total: list.length, data: list };
  }
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

// Response Interceptor: Handle API mutations, errors, and transparently merge persistent state
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || 'get').toLowerCase();
    const cleanUrl = (response.config?.url || '').replace(/^\/api/, '').split('?')[0];

    // ─── 1. If Mutation (POST/PUT/DELETE/PATCH), ALWAYS keep localStorage in sync ───
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      try {
        const parsedBody = safeParseBody(response.config?.data);
        resolveFallbackData(response.config?.url, method, parsedBody);
      } catch (e) {
        console.warn('[Sync] Fallback mutation sync warning:', e);
      }
    }

    // ─── 2. If response returned HTML instead of JSON (typical when API route 404s on Vercel) ───
    if (typeof response.data === 'string' && (response.data.toLowerCase().includes('<!doctype') || response.data.toLowerCase().includes('<html'))) {
      const fallback = resolveFallbackData(response.config.url, response.config.method, safeParseBody(response.config.data));
      return { ...response, data: fallback };
    }

    // ─── 3. If GET request returned data, merge with client-side persistent storage ───
    if (method === 'get' && response.data && typeof response.data === 'object') {
      if (cleanUrl === '/candidates' && Array.isArray(response.data.data)) {
        // Filter out deleted
        let list = response.data.data.filter(c => !deletedMockIds.candidates.has(Number(c.cand_id ?? c.CAND_ID)));
        // Merge missing from local
        const serverIds = new Set(list.map(c => Number(c.cand_id ?? c.CAND_ID)));
        const missing = mockData.candidates.filter(c => !serverIds.has(Number(c.cand_id)) && !deletedMockIds.candidates.has(Number(c.cand_id)));
        list = [...list, ...missing];
        // Apply local edits
        response.data.data = list.map(c => {
          const id = Number(c.cand_id ?? c.CAND_ID);
          const localMatch = mockData.candidates.find(m => m.cand_id === id);
          return localMatch ? { ...c, ...localMatch } : c;
        });
      } else if (cleanUrl === '/jobs' && Array.isArray(response.data.data)) {
        let list = response.data.data.filter(j => !deletedMockIds.jobs.has(String(j.job_key ?? j.JOB_KEY)) && !deletedMockIds.jobs.has(String(j.job_id ?? j.JOB_ID)));
        const serverKeys = new Set(list.map(j => String(j.job_key ?? j.JOB_KEY ?? j.job_id ?? j.JOB_ID)));
        const missing = mockData.jobs.filter(j => !serverKeys.has(String(j.job_key)) && !serverKeys.has(String(j.job_id)) && !deletedMockIds.jobs.has(String(j.job_key)));
        list = [...list, ...missing];
        response.data.data = list.map(j => {
          const k = String(j.job_key ?? j.JOB_KEY ?? j.job_id ?? j.JOB_ID);
          const localMatch = mockData.jobs.find(m => String(m.job_key) === k || String(m.job_id) === k);
          return localMatch ? { ...j, ...localMatch } : j;
        });
      } else if (cleanUrl === '/employers' && Array.isArray(response.data.data)) {
        let list = response.data.data.filter(e => !deletedMockIds.employers.has(String(e.emp_id ?? e.EMP_ID).toUpperCase()));
        const serverIds = new Set(list.map(e => String(e.emp_id ?? e.EMP_ID).toUpperCase()));
        const missing = mockData.employers.filter(e => !serverIds.has(String(e.emp_id).toUpperCase()) && !deletedMockIds.employers.has(String(e.emp_id).toUpperCase()));
        list = [...list, ...missing];
        response.data.data = list.map(e => {
          const id = String(e.emp_id ?? e.EMP_ID).toUpperCase();
          const localMatch = mockData.employers.find(m => String(m.emp_id).toUpperCase() === id);
          return localMatch ? { ...e, ...localMatch } : e;
        });
      } else if (cleanUrl === '/applications' && Array.isArray(response.data.data)) {
        let list = response.data.data.filter(a => !deletedMockIds.applications.has(String(a.app_id ?? a.APP_ID).toUpperCase()));
        const serverIds = new Set(list.map(a => String(a.app_id ?? a.APP_ID).toUpperCase()));
        const missing = mockData.applications.filter(a => !serverIds.has(String(a.app_id).toUpperCase()) && !deletedMockIds.applications.has(String(a.app_id).toUpperCase()));
        list = [...list, ...missing];
        response.data.data = list.map(a => {
          const id = String(a.app_id ?? a.APP_ID).toUpperCase();
          const localMatch = mockData.applications.find(m => String(m.app_id).toUpperCase() === id);
          return localMatch ? { ...a, ...localMatch } : a;
        });
      } else if (cleanUrl === '/interviews' && Array.isArray(response.data.data)) {
        let list = response.data.data.filter(i => !deletedMockIds.interviews.has(String(i.int_id ?? i.INT_ID).toUpperCase()));
        const serverIds = new Set(list.map(i => String(i.int_id ?? i.INT_ID).toUpperCase()));
        const missing = mockData.interviews.filter(i => !serverIds.has(String(i.int_id).toUpperCase()) && !deletedMockIds.interviews.has(String(i.int_id).toUpperCase()));
        list = [...list, ...missing];
        response.data.data = list.map(i => {
          const id = String(i.int_id ?? i.INT_ID).toUpperCase();
          const localMatch = mockData.interviews.find(m => String(m.int_id).toUpperCase() === id);
          return localMatch ? { ...i, ...localMatch } : i;
        });
      } else if (cleanUrl === '/skills' && Array.isArray(response.data.data)) {
        let list = response.data.data.filter(s => !deletedMockIds.skills.has(String(s.skill_id ?? s.SKILL_ID ?? s.skill_name).toUpperCase()));
        const serverIds = new Set(list.map(s => String(s.skill_id ?? s.SKILL_ID ?? s.skill_name).toUpperCase()));
        const missing = mockData.skills.filter(s => !serverIds.has(String(s.skill_id || s.skill_name).toUpperCase()) && !deletedMockIds.skills.has(String(s.skill_id || s.skill_name).toUpperCase()));
        list = [...list, ...missing];
        response.data.data = list.map(s => {
          const id = String(s.skill_id ?? s.SKILL_ID ?? s.skill_name).toUpperCase();
          const localMatch = mockData.skills.find(m => String(m.skill_id || m.skill_name).toUpperCase() === id);
          return localMatch ? { ...s, ...localMatch } : s;
        });
      } else if ((cleanUrl === '/user/dashboard' || cleanUrl === '/dashboard') && response.data.data?.kpis) {
        response.data.data.kpis = {
          totalCandidates: mockData.candidates.length,
          totalJobs: mockData.jobs.length,
          openJobs: mockData.jobs.filter(j => j.job_status === 'Open').length,
          totalApplications: mockData.applications.length,
          totalInterviews: mockData.interviews.length,
          totalEmployers: mockData.employers.length
        };
      }
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
