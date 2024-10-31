/**
 * Wraps async route handlers to handle rejected promises
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  if (typeof fn !== "function") {
    throw new Error("asyncHandler requires a function parameter");
  }

  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("AsyncHandler Error:", {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });

      // If headers have already been sent, delegate to the default error handler
      if (res.headersSent) {
        return next(error);
      }

      // Handle specific error types
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          details: error.details || error.message,
          code: "VALIDATION_ERROR",
        });
      }

      if (error.name === "MongoError" || error.name === "MongoServerError") {
        return res.status(503).json({
          error: "Database Error",
          message: "A database error occurred",
          code: "DATABASE_ERROR",
        });
      }

      // Handle rate limit errors
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: error.message,
          code: "RATE_LIMIT_EXCEEDED",
        });
      }

      // Default error response
      res.status(error.status || 500).json({
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal Server Error",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    });
  };
};

module.exports = asyncHandler;
