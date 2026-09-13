import app from '../backend/app.js';
import { initOraclePool } from '../backend/db/oracle.js';

let poolInitPromise = null;

export default async function handler(req, res) {
  // Lazily attempt Oracle connection on first serverless invocation
  if (!poolInitPromise) {
    poolInitPromise = initOraclePool().catch((err) => {
      console.warn('[Vercel Serverless] Oracle connection notice:', err.message);
    });
  }
  await poolInitPromise;

  // Pass request to Express app
  return app(req, res);
}
