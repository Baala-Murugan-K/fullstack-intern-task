require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db/connection");
const authRoutes = require("./routes/auth");
const templatesRoutes = require("./routes/templates");
const favoritesRoutes = require("./routes/favorites");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logging middleware in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root & Health check
app.get("/", (req, res) => {
  res.json({
    name: "Mini SaaS Template Store API",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      templates: "/api/templates",
      favorites: "/api/favorites",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/favorites", favoritesRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred.",
  });
});

// Start Server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Mini SaaS Template Store API running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`📦 Database: ${process.env.DATABASE_URL ? "Supabase PostgreSQL" : "Local SQLite"}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
