import express from 'express';
import {
  getCandidateSkills,
  createCandidateSkill,
  updateCandidateSkill,
  deleteCandidateSkill,
  getJobSkills,
  createJobSkill,
  updateJobSkill,
  deleteJobSkill,
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getPreferences,
  createPreference,
  deletePreference
} from '../controllers/matchingController.js';

export const candidateSkillRouter = express.Router();
candidateSkillRouter.get('/', getCandidateSkills);
candidateSkillRouter.post('/', createCandidateSkill);
candidateSkillRouter.put('/:cand_id/:skill_id', updateCandidateSkill);
candidateSkillRouter.delete('/:cand_id/:skill_id', deleteCandidateSkill);

export const jobSkillRouter = express.Router();
jobSkillRouter.get('/', getJobSkills);
jobSkillRouter.post('/', createJobSkill);
jobSkillRouter.put('/:job_key/:skill_id', updateJobSkill);
jobSkillRouter.delete('/:job_key/:skill_id', deleteJobSkill);

export const assessmentRouter = express.Router();
assessmentRouter.get('/', getAssessments);
assessmentRouter.post('/', createAssessment);
assessmentRouter.put('/:cand_id/:job_key/:skill_id', updateAssessment);
assessmentRouter.delete('/:cand_id/:job_key/:skill_id', deleteAssessment);

export const matchRouter = express.Router();
matchRouter.get('/', getMatches);
matchRouter.post('/', createMatch);
matchRouter.put('/:id', updateMatch);
matchRouter.delete('/:id', deleteMatch);

export const preferenceRouter = express.Router();
preferenceRouter.get('/', getPreferences);
preferenceRouter.post('/', createPreference);
preferenceRouter.delete('/:cand_id/:pincode', deletePreference);
