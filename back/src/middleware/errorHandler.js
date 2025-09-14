const winston = require('winston');

const errorHandler = (err, req, res, next) => {
  // Log the error
  const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log' })
    ]
  });

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine error response based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Don't leak error details
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } else {
    // Development: Include error details
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = errorHandler;