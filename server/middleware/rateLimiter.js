const rateLimit = require("express-rate-limit");

// Common configuration for all limiters
const commonConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    return (
      req.ip === "127.0.0.1" ||
      req.headers["x-api-key"] === process.env.ADMIN_API_KEY
    );
  },
  keyGenerator: (req) => {
    return req.headers["x-api-key"] || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000),
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining,
    });
  },
};

// Status check rate limiter
const statusCheckLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (req.headers["x-api-key"]) {
      return 1000; // Authenticated users
    }
    return 100; // Default limit
  },
  message: {
    error: "Too many status check requests. Please try again after 15 minutes.",
    code: "STATUS_CHECK_LIMIT_EXCEEDED",
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.headers["x-api-key"]) {
      return 5000; // Authenticated users
    }
    return 1000; // Default limit
  },
  message: {
    error: "Too many requests. Please try again after an hour.",
    code: "API_LIMIT_EXCEEDED",
  },
});

// Report submission rate limiter
const reportLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.headers["x-api-key"]) {
      return 200; // Authenticated users
    }
    return 50; // Default limit
  },
  message: {
    error: "Too many report submissions. Please try again after an hour.",
    code: "REPORT_LIMIT_EXCEEDED",
  },
});

// Heavy operations rate limiter
const heavyOpLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.headers["x-api-key"]) {
      return 100; // Authenticated users
    }
    return 20; // Default limit
  },
  message: {
    error: "Too many heavy operations. Please try again after an hour.",
    code: "HEAVY_OP_LIMIT_EXCEEDED",
  },
});

module.exports = {
  statusCheckLimiter,
  apiLimiter,
  reportLimiter,
  heavyOpLimiter,
};
