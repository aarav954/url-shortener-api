const MAX_URL_LENGTH = 2048;

const validateShortenRequest = (req, res, next) => {
  const { originalUrl } = req.body || {};

  if (!originalUrl || typeof originalUrl !== "string") {
    return res.status(400).json({ error: "originalUrl is required" });
  }

  const trimmed = originalUrl.trim();

  if (trimmed.length > MAX_URL_LENGTH) {
    return res.status(400).json({ error: "URL is too long" });
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http and https URLs are allowed" });
  }

  req.body.originalUrl = trimmed;
  next();
};

module.exports = { validateShortenRequest };