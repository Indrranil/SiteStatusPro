const validateWebsiteParam = (req, res, next) => {
  const { website } = req.params;
  if (!website) {
    return res.status(400).json({
      error: "Website parameter is required",
    });
  }
  next();
};

const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && !isValidDate(startDate)) {
    return res.status(400).json({
      error: "Invalid startDate format",
    });
  }

  if (endDate && !isValidDate(endDate)) {
    return res.status(400).json({
      error: "Invalid endDate format",
    });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      error: "startDate cannot be later than endDate",
    });
  }

  next();
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  validateWebsiteParam,
  validateDateRange,
};
