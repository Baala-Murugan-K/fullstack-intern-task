const dns = require("dns");
// Force IPv4 DNS resolution first to prevent ENETUNREACH on IPv4-only hosting providers like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db/connection");
const authRoutes = require("./routes/auth");
const templatesRoutes = require("./routes/templates");
const favoritesRoutes = require("./routes/favorites");

const app = express();
const PORT = process.env.PORT || 5000;

let isDbReady = false;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root & Health check (Always responds 200 so Render health checks pass)
app.get("/", (req, res) => {
  res.json({
    name: "Mini SaaS Template Store API",
    status: "online",
    database: isDbReady ? "connected" : "connecting_or_offline",
    endpoints: {
      auth: "/api/auth",
      templates: "/api/templates",
      favorites: "/api/favorites",
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDbReady ? "connected" : "reconnecting",
    timestamp: new Date().toISOString(),
  });
});

// Middleware to check database readiness
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/api/health") {
    return next();
  }
  if (!isDbReady) {
    // If DB is still connecting or failed to reach IPv6 Supabase
    return res.status(503).json({
      success: false,
      message: "Database is initializing or reconnecting. Please check connection string in Render settings.",
    });
  }
  next();
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

// Asynchronous DB connection with retry and clear diagnostics
async function connectDatabase(retries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Connecting to database (attempt ${attempt}/${retries})...`);
      await initDb();
      isDbReady = true;
      console.log("✅ Database initialized and connected successfully!");
      return;
    } catch (error) {
      console.error(`❌ Database connection error (attempt ${attempt}/${retries}):`, error.message);
      
      if (error.code === "ENETUNREACH" || error.message.includes("ENETUNREACH")) {
        console.warn("\n================================================================================");
        console.warn("⚠️  RENDER IPv6 ISSUE DETECTED:");
        console.warn("   Render does not support IPv6 outbound traffic.");
        console.warn("   You are likely using the Supabase direct URL (db.*.supabase.co:5432).");
        console.warn("   👉 FIX: Use the Supabase Connection Pooler URL instead:");
        console.warn("   In Supabase Dashboard -> Database -> Connection String -> select 'Transaction' or 'Session' Pooler.");
        console.warn("   Format: postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require");
        console.warn("================================================================================\n");
      }

      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("⚠️ Server running in degraded mode: Database connection could not be established.");
}

// Start HTTP Server immediately so Render health checks succeed!
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Mini SaaS Template Store API running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📦 Database Mode: ${process.env.DATABASE_URL ? "Supabase PostgreSQL" : "Local SQLite"}`);
  console.log(`===============================================`);

  // Connect database in background
  connectDatabase();
});
