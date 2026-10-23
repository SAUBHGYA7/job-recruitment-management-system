import app from './app.js';
import { initNeo4jDriver, closeNeo4jDriver } from './db/neo4j.js';

const PORT = process.env.PORT || 5001;

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

// Start Unified Local Server with Neo4j Graph Database
async function startServer() {
  console.log('============================================================');
  console.log('🚀 JOB RECRUITMENT MANAGEMENT SYSTEM - NEO4J BACKEND');
  console.log('============================================================');

  // Initialize Neo4j Driver Connection
  try {
    await initNeo4jDriver();
    console.log('[Neo4j] Driver initialized and verified successfully.');
  } catch (err) {
    console.error('[Neo4j] Warning: Failed to initialize driver on startup:', err.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Local URL:   http://localhost:${PORT}`);
    console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
    console.log('============================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Error]: Port ${PORT} is already in use.`);
      console.error(`If on macOS, port 5000 is occupied by Apple AirPlay Receiver (ControlCenter).`);
      console.error(`To use port 5000: Turn off AirPlay Receiver in System Settings > General > AirDrop & AirPlay.`);
      console.error(`Or run on another port: PORT=5001 npm start\n`);
      process.exit(1);
    }
    console.error('[Server Error]:', err);
  });

  server.on('listening', () => {
    console.log('[Server] Event: listening');
    const addr = server.address();
    console.log('[Server] Bound to:', addr);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closeNeo4jDriver();
      console.log('[Neo4j] Driver closed.');
      process.exit(0);
    });

    // Force shutdown after 5 seconds if hanging
    setTimeout(() => {
      console.error('[Server] Forcing shutdown after timeout.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
