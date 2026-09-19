import app from '../backend/app.js';
import { initOraclePool } from '../backend/db/oracle.js';

let poolInitPromise = null;

export default async function handler(req, res) {
  // Lazily attempt Oracle connection on first serverless invocation (non-blocking)
  if (!poolInitPromise) {
    poolInitPromise = initOraclePool().catch((err) => {
      console.warn('[Vercel Serverless] Oracle connection notice:', err.message);
    });
  }

  // Don't await the pool initialization - let it run in background
  // This prevents blocking the serverless function startup
  poolInitPromise.catch(() => {}); // Suppress unhandled rejection

  // Pass request to Express app immediately
  return app(req, res);
}
