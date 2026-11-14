const notFound = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: "Short code already exists, try again" });
  }

  console.error(err);

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
};

module.exports = { notFound, errorHandler };