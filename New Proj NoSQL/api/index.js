export default async function handler(req, res) {
  if (req.url === '/api/health' || req.url === '/health') {
    return res.status(200).json({
      status: 'ONLINE',
      system: 'Job Recruitment Management System',
      timestamp: new Date().toISOString(),
      database: { mode: 'TEST_MODE' }
    });
  }
  
  // Import app only for other routes
  try {
    const { default: app } = await import('../backend/app.js');
    return app(req, res);
  } catch (err) {
    console.error('App import error:', err);
    return res.status(500).json({ error: 'App import failed', details: err.message });
  }
}