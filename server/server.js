// server/server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Import routes
const outageRoutes = require("./routes/OutageRoutes");
const reportRoutes = require("./routes/ReportRoutes");
const statusRoutes = require("./routes/StatusRoutes");

// Use routes
app.use("/api/outages", outageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/status", statusRoutes);

// Error handling middleware
const { errorHandler } = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
