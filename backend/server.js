import app from './app.js';
import { initOraclePool } from './db/oracle.js';

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

// Keep event loop active
setInterval(() => {}, 60000);

// Start Unified Local Server
async function startServer() {
  console.log('============================================================');
  console.log('🚀 JOB RECRUITMENT MANAGEMENT SYSTEM - LOCAL SERVER');
  console.log('============================================================');

  // Attempt Oracle DB connection
  await initOraclePool();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Local URL:   http://localhost:${PORT}`);
    console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
    console.log('============================================================');
  });
}

startServer();
