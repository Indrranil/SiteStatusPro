// middleware/urlValidator.js

const { URL } = require("url");

// List of allowed protocols
const ALLOWED_PROTOCOLS = ["http:", "https:"];

// List of blocked domains (example)
const BLOCKED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "example.com",
];

// Maximum URL length
const MAX_URL_LENGTH = 2048;

// Regex for valid domain names
const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;

class URLValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "URLValidationError";
    this.code = code;
  }
}

const validateSingleUrl = (urlString) => {
  // Check URL length
  if (urlString.length > MAX_URL_LENGTH) {
    throw new URLValidationError(
      "URL exceeds maximum allowed length",
      "URL_TOO_LONG",
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw new URLValidationError("Invalid URL format", "INVALID_URL_FORMAT");
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    throw new URLValidationError(
      "Invalid or unsupported protocol",
      "INVALID_PROTOCOL",
    );
  }

  // Check for blocked domains
  if (BLOCKED_DOMAINS.some((domain) => parsedUrl.hostname.includes(domain))) {
    throw new URLValidationError("Domain not allowed", "BLOCKED_DOMAIN");
  }

  // Validate domain format
  if (!DOMAIN_REGEX.test(parsedUrl.hostname)) {
    throw new URLValidationError("Invalid domain format", "INVALID_DOMAIN");
  }

  return true;
};

/**
 * Middleware to validate URLs in requests
 */
const validateUrls = (req, res, next) => {
  try {
    // Handle single URL in body
    if (req.body.url) {
      validateSingleUrl(req.body.url);
    }

    // Handle array of URLs in body
    if (req.body.urls && Array.isArray(req.body.urls)) {
      if (req.body.urls.length === 0) {
        throw new URLValidationError("URLs array is empty", "EMPTY_URLS_ARRAY");
      }

      if (req.body.urls.length > 50) {
        throw new URLValidationError(
          "Too many URLs in request",
          "TOO_MANY_URLS",
        );
      }

      req.body.urls.forEach((url, index) => {
        try {
          validateSingleUrl(url);
        } catch (error) {
          error.message = `URL at index ${index}: ${error.message}`;
          throw error;
        }
      });
    }

    // Handle URL in query parameters
    if (req.query.url) {
      validateSingleUrl(req.query.url);
    }

    next();
  } catch (error) {
    if (error.name === "URLValidationError") {
      res.status(400).json({
        error: "URL Validation Error",
        message: error.message,
        code: error.code,
      });
    } else {
      next(error);
    }
  }
};

/**
 * Helper function to sanitize URLs
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
const sanitizeUrl = (url) => {
  const parsedUrl = new URL(url);

  // Remove sensitive query parameters
  const sensitiveParams = ["token", "key", "password", "auth"];
  sensitiveParams.forEach((param) => {
    parsedUrl.searchParams.delete(param);
  });

  // Remove fragments
  parsedUrl.hash = "";

  return parsedUrl.toString();
};

/**
 * Middleware to sanitize URLs in requests
 */
const sanitizeUrls = (req, res, next) => {
  try {
    if (req.body.url) {
      req.body.url = sanitizeUrl(req.body.url);
    }

    if (req.body.urls && Array.isArray(req.body.urls)) {
      req.body.urls = req.body.urls.map((url) => sanitizeUrl(url));
    }

    if (req.query.url) {
      req.query.url = sanitizeUrl(req.query.url);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting configuration for URL validation
const urlValidationLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many URL validation requests",
    code: "RATE_LIMIT_EXCEEDED",
  },
};

module.exports = {
  validateUrls,
  sanitizeUrls,
  urlValidationLimiter,
  URLValidationError,
  // Export for testing
  validateSingleUrl,
  sanitizeUrl,
  ALLOWED_PROTOCOLS,
  BLOCKED_DOMAINS,
  MAX_URL_LENGTH,
  DOMAIN_REGEX,
};
