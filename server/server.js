const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler"); // Corrected file name
const statusRoutes = require("./routes/StatusRoutes");
const reportRoutes = require("./routes/ReportRoutes");
const outageRoutes = require("./routes/OutageRoutes");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB Connected: ${process.env.MONGO_URI}`))
  .catch((err) => console.error(err));

app.use("/api/status", statusRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/outages", outageRoutes);

app.use(notFound); // Ensure these are valid middleware functions
app.use(errorHandler); // Ensure these are valid middleware functions

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
