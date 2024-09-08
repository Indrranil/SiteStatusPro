const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler"); // Ensure these are correctly implemented
const statusRoutes = require("./routes/StatusRoutes");
const reportRoutes = require("./routes/ReportRoutes");
const outageRoutes = require("./routes/OutageRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB Connected: ${process.env.MONGO_URI}`))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/status", statusRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/outages", outageRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const cron = require("node-cron");
const monitorWebsites = require("./services/monitorWebsites");

// Run every 5 minutes
cron.schedule("*/5 * * * *", monitorWebsites);

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
