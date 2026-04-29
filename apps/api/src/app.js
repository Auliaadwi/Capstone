import express from "express";
import cors from "cors";
import cvRoutes from "./routes/cv.js";
import quizRoutes from "./routes/quiz.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "skillmap-api" });
});

app.use("/api/cv", cvRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
