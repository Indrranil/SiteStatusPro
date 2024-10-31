const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { monitorPerformance } = require("./services/performanceMonitor");
const SSLCertificateMonitor = require("./services/SSLCertificateMonitor");
const domainMonitorService = require("./services/domainMonitorService");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

// Load environment variables
dotenv.config();

// Server Configuration
const SERVER_CONFIG = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/appdb",
  env: process.env.NODE_ENV || "development",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  performanceMonitoringInterval:
    process.env.PERF_MONITOR_INTERVAL || 5 * 60 * 1000, // 5 minutes
  sslCheckInterval: process.env.SSL_CHECK_INTERVAL || "0 */12 * * *", // Twice daily
  domainCheckInterval: process.env.DOMAIN_CHECK_INTERVAL || "0 0 * * *", // Daily
};

// Initialize express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || SERVER_CONFIG.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count"],
  }),
);

// Logging
if (SERVER_CONFIG.env !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// Health check endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    env: SERVER_CONFIG.env,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongo: {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    monitors: {
      performance: true,
      ssl: true,
      domain: true,
    },
  };

  const isHealthy = health.mongo.connected;
  res.status(isHealthy ? 200 : 503).json(health);
});

// Import routes
const routes = {
  status: require("./routes/StatusRoutes"),
  websites: require("./routes/websitesRoutes"),
  reports: require("./routes/ReportRoutes"),
  outages: require("./routes/OutageRoutes"),
  notifications: require("./routes/NotificationRoutes"),
  performance: require("./routes/PerformanceRoutes"),
  analytics: require("./routes/AnalyticsRoutes"),
  ssl: require("./routes/SSLRoutes"),
  domains: require("./routes/DomainRoutes"), // New domain routes
};

// API Router with versioning
const apiRouter = express.Router();

// Mount routes with error handling
Object.entries(routes).forEach(([name, router]) => {
  if (router && typeof router === "function") {
    apiRouter.use(`/${name}`, router);
    console.log(`Mounted ${name} routes on /api/v1/${name}`);
  } else {
    console.warn(`Failed to mount ${name} routes - invalid router`);
  }
});

// Mount API router
app.use("/api/v1", apiRouter);

// Global error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: Object.keys(routes).map((name) => `/api/v1/${name}`),
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: SERVER_CONFIG.env === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    });
  }

  if (err.name === "MongoError" || err.name === "MongoServerError") {
    return res.status(503).json({
      error: "Database Error",
      message: "A database error occurred",
    });
  }

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message:
      SERVER_CONFIG.env === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Initialize monitors function
const initializeMonitors = () => {
  const monitors = {
    intervals: {},
    jobs: {},
  };

  // Initialize performance monitoring
  monitors.intervals.performance = setInterval(async () => {
    try {
      await monitorPerformance();
    } catch (error) {
      console.error("Performance monitoring failed:", error);
    }
  }, SERVER_CONFIG.performanceMonitoringInterval);

  // Initialize SSL certificate monitoring
  monitors.jobs.ssl = cron.schedule(
    SERVER_CONFIG.sslCheckInterval,
    async () => {
      try {
        console.log("Starting scheduled SSL certificate check...");
        const websitesToMonitor = require("./config/websitesToMonitor");
        await SSLCertificateMonitor.bulkCheckCertificates(websitesToMonitor);
        console.log("SSL certificate check completed");
      } catch (error) {
        console.error("SSL certificate monitoring failed:", error);
      }
    },
  );

  // Initialize domain monitoring
  monitors.jobs.domain = cron.schedule(
    SERVER_CONFIG.domainCheckInterval,
    async () => {
      try {
        console.log("Starting scheduled domain expiration check...");
        const websitesToMonitor = require("./config/websitesToMonitor");

        for (const website of websitesToMonitor) {
          try {
            const domain = new URL(website.url).hostname;
            await domainMonitorService.monitorDomain(website.name, domain);
          } catch (error) {
            console.error(`Failed to check domain for ${website.name}:`, error);
          }
        }

        console.log("Domain expiration check completed");
      } catch (error) {
        console.error("Domain monitoring failed:", error);
      }
    },
  );

  return monitors;
};

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB with enhanced options
    await mongoose.connect(SERVER_CONFIG.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Start the server
    const server = app.listen(SERVER_CONFIG.port, () => {
      console.log(
        `Server running in ${SERVER_CONFIG.env} mode on port ${SERVER_CONFIG.port}`,
      );
    });

    // Initialize monitoring systems
    const monitors = initializeMonitors();

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      // Clear all monitoring intervals
      clearInterval(monitors.intervals.performance);

      // Stop all cron jobs
      Object.values(monitors.jobs).forEach((job) => job.stop());

      try {
        await server.close();
        console.log("HTTP server closed");
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      shutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    // Production memory monitoring
    if (SERVER_CONFIG.env === "production") {
      setInterval(() => {
        const used = process.memoryUsage();
        console.log("Memory usage:", {
          rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(used.external / 1024 / 1024)} MB`,
        });
      }, 300000); // Every 5 minutes
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = app;
