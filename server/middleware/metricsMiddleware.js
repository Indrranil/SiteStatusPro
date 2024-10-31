// middleware/metricsMiddleware.js
const trackRequestMetrics = (req, res, next) => {
  // Add timestamp when request started
  req.startTime = Date.now();

  // Track response metrics
  res.on("finish", () => {
    const duration = Date.now() - req.startTime;

    // Log request metrics
    console.log({
      type: "request_metrics",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    // You could expand this to store metrics in a database or monitoring service
  });

  next();
};

module.exports = {
  trackRequestMetrics,
};
