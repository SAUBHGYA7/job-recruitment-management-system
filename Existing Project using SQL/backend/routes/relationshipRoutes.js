import express from 'express';
import {
  getApplies,
  createApplies,
  deleteApplies,
  getFollows,
  createFollows,
  deleteFollows,
  getReferrals,
  createReferral,
  updateReferral,
  deleteReferral
} from '../controllers/relationshipController.js';

export const appliesRouter = express.Router();
appliesRouter.get('/', getApplies);
appliesRouter.post('/', createApplies);
appliesRouter.delete('/:cand_id/:job_key', deleteApplies);

export const followsRouter = express.Router();
followsRouter.get('/', getFollows);
followsRouter.post('/', createFollows);
followsRouter.delete('/:cand_id/:emp_id', deleteFollows);

export const referralRouter = express.Router();
referralRouter.get('/', getReferrals);
referralRouter.post('/', createReferral);
referralRouter.put('/:cand_id/:date', updateReferral);
referralRouter.delete('/:cand_id/:date', deleteReferral);
