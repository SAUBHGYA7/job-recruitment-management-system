export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  let statusCode = 500;
  let userMessage = 'An unexpected server error occurred.';

  // 1. Neo4j & Network Connectivity Errors
  if (
    (err.name === 'Neo4jError' &&
      (err.code === 'ServiceUnavailable' ||
       err.code === 'SessionExpired' ||
       err.message?.includes('Failed to connect') ||
       err.message?.includes('Connection lost') ||
       err.message?.includes('closed') ||
       err.message?.includes('unavailable'))) ||
    err.message?.includes('Driver is closed') ||
    err.message?.includes('Database service unavailable') ||
    err.message?.includes('Cannot run query') ||
    err.message?.includes('pool is closed') ||
    err.message?.includes('connect ECONNREFUSED')
  ) {
    statusCode = 503;
    userMessage = 'Database service unavailable. Please check the graph database connection.';
  }
  // 2. Neo4j Constraint Validation Errors
  else if (
    err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed' ||
    err.message?.includes('already exists with label') ||
    err.message?.includes('ConstraintValidationFailed')
  ) {
    statusCode = 409;
    userMessage = 'Unique constraint violation: A record with this unique identifier already exists in the graph database.';
  }
  // 3. Oracle Legacy Compatibility Errors (if triggered by legacy schema controllers)
  else if (err.message && err.message.includes('ORA-00001')) {
    statusCode = 409;
    userMessage = 'Unique constraint violation: Record with this key already exists.';
  } else if (err.message && (err.message.includes('ORA-02291') || err.message.includes('ORA-02292'))) {
    statusCode = 400;
    userMessage = 'Referential integrity violation: Operation rejected due to foreign key constraints.';
  } else if (err.status && typeof err.status === 'number') {
    statusCode = err.status;
    userMessage = err.message || userMessage;
  } else if (statusCode === 500 && process.env.NODE_ENV !== 'production' && !err.message?.toLowerCase().includes('password')) {
    // Sanitize message to prevent credential leakage
    userMessage = err.message || userMessage;
  }

  // Prevent leaking credentials or sensitive internal paths in API responses
  const sanitizedMessage = typeof userMessage === 'string'
    ? userMessage.replace(/(password|pwd|pass|secret)=[^&;\s]+/gi, '$1=***')
    : 'An error occurred processing the request.';

  res.status(statusCode).json({
    success: false,
    message: sanitizedMessage
  });
}
