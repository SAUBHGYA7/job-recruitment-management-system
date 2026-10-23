import express from 'express';
import {
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  getDependents,
  createDependent,
  updateDependent,
  deleteDependent,
  getSubtypes,
  createSubtype,
  updateSubtype,
  deleteSubtype
} from '../controllers/profileController.js';

export const educationRouter = express.Router();
educationRouter.get('/', getEducation);
educationRouter.post('/', createEducation);
educationRouter.put('/:id', updateEducation);
educationRouter.delete('/:id', deleteEducation);

export const experienceRouter = express.Router();
experienceRouter.get('/', getExperience);
experienceRouter.post('/', createExperience);
experienceRouter.put('/:id', updateExperience);
experienceRouter.delete('/:id', deleteExperience);

export const dependentRouter = express.Router();
dependentRouter.get('/', getDependents);
dependentRouter.post('/', createDependent);
dependentRouter.put('/:id', updateDependent);
dependentRouter.delete('/:id', deleteDependent);

export const subtypeRouter = express.Router();
subtypeRouter.get('/', getSubtypes);
subtypeRouter.post('/:type', createSubtype);
subtypeRouter.put('/:type/:cand_id', updateSubtype);
subtypeRouter.delete('/:type/:cand_id', deleteSubtype);
