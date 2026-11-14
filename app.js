require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const urlRouter = require("./routers/url.router");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();

app.use(express.json());

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