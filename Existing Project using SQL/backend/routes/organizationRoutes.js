import express from 'express';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getAgencies,
  createAgency,
  updateAgency,
  deleteAgency
} from '../controllers/organizationController.js';

export const locationRouter = express.Router();
locationRouter.get('/', getLocations);
locationRouter.post('/', createLocation);
locationRouter.put('/:pincode', updateLocation);
locationRouter.delete('/:pincode', deleteLocation);

export const companyRouter = express.Router();
companyRouter.get('/', getCompanies);
companyRouter.post('/', createCompany);
companyRouter.put('/:id', updateCompany);
companyRouter.delete('/:id', deleteCompany);

export const agencyRouter = express.Router();
agencyRouter.get('/', getAgencies);
agencyRouter.post('/', createAgency);
agencyRouter.put('/:id', updateAgency);
agencyRouter.delete('/:id', deleteAgency);
