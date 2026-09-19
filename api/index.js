import app from '../backend/app.js';

export default async function handler(req, res) {
  // Pass request to Express app immediately - no Oracle initialization
  // Oracle connection is handled lazily within the app routes
  return app(req, res);
}
