import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbStatus } from './db/oracle.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import employerRoutes from './routes/employerRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import userDashboardRoutes from './routes/userDashboardRoutes.js';
import designerRoutes from './routes/designerRoutes.js';
import dbaRoutes from './routes/dbaRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// API health and DB status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Job Recruitment Management System (DBMS DA1/DA2)',
    timestamp: new Date().toISOString(),
    database: getDbStatus()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/user', userDashboardRoutes);
app.use('/api/dashboard', userDashboardRoutes);
app.use('/api/designer', designerRoutes);
app.use('/api/database', designerRoutes);
app.use('/api/dba', dbaRoutes);
app.use('/api/reports', reportsRoutes);

// Global Error Handler for API routes
app.use('/api', errorHandler);

// Serve Frontend Static Production Build if it exists locally
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback to index.html for React SPA Routing (non-API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // In serverless environments where static is handled by Vercel
      res.status(404).send('Not Found');
    }
  });
});

// General Error Handler
app.use(errorHandler);

export default app;
