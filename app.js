require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const urlRouter = require("./routers/url.router");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "URL shortener API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", urlRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});