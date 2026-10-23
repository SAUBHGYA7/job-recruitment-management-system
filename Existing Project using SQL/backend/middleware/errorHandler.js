export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle common Oracle errors
  let statusCode = 500;
  let userMessage = 'An unexpected server error occurred.';

  if (err.message && err.message.includes('ORA-00001')) {
    statusCode = 409;
    userMessage = 'Unique constraint violation: Record with this key already exists in Oracle.';
  } else if (err.message && err.message.includes('ORA-02291')) {
    statusCode = 400;
    userMessage = 'Foreign key integrity violation: Referenced parent record does not exist in Oracle.';
  } else if (err.message && err.message.includes('ORA-02292')) {
    statusCode = 400;
    userMessage = 'Foreign key integrity violation: Child record exists preventing deletion.';
  } else if (err.message && err.message.includes('ORA-01400')) {
    statusCode = 400;
    userMessage = 'Mandatory column cannot be null.';
  } else if (err.message) {
    userMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
