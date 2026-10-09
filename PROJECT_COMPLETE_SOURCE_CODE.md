# Mini SaaS Template Store - Complete Project Source Code

## Candidate Information & Submission Profile
- **Candidate Name**: Baala Murugan K
- **Email**: baalamurugan.k25@gmail.com
- **Portfolio**: [Baala Murugan K — Full Stack Developer](https://baala-murugan-k.github.io/KBM-Portfolio/)
- **Relevant Work 1**: [MockMind - AI Mock Interview Platform](https://mock-mind-ten.vercel.app/)
- **Relevant Work 2**: [Personal Finance Tracker](https://finance-tracker-gamma-lemon.vercel.app/)
- **GitHub Repository**: [https://github.com/Baala-Murugan-K/fullstack-intern-task](https://github.com/Baala-Murugan-K/fullstack-intern-task)
- **Live Frontend (Vercel)**: [https://fullstack-intern-task-six.vercel.app/templates](https://fullstack-intern-task-six.vercel.app/templates)
- **Live Backend API (Render)**: [https://fullstack-intern-task-te6m.onrender.com](https://fullstack-intern-task-te6m.onrender.com)
- **Database**: Supabase PostgreSQL (Cloud Database)

## Project File Tree
`	ext
fullstack-intern-task/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── src/
    │   ├── db/
    │   ├── middleware/
    │   └── routes/
    ├── knexfile.js
    ├── package.json
    └── test-api.js
`

---

### File: server/package.json

`json
{
  "name": "mini-saas-template-store-server",
  "version": "1.0.0",
  "description": "Backend API for Mini SaaS Template Store with Supabase PostgreSQL and Knex.js",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "seed": "node src/db/seed-runner.js",
    "test": "node test-api.js"
  },
  "keywords": ["express", "knex", "postgresql", "supabase", "jwt", "saas"],
  "author": "Full Stack Intern Candidate",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "knex": "^3.1.0",
    "pg": "^8.13.1",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}

`

---

### File: server/knexfile.js

`javascript
﻿require("dotenv").config();
const path = require("path");
const { parse } = require("pg-connection-string");

const hasPostgres = Boolean(process.env.DATABASE_URL);

let connectionConfig;

if (hasPostgres) {
  try {
    // Safely parse URL and ensure ssl.rejectUnauthorized = false for Supabase
    const parsed = parse(process.env.DATABASE_URL);
    connectionConfig = {
      user: parsed.user,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.database,
      ssl: { rejectUnauthorized: false },
    };
  } catch (e) {
    connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
} else {
  connectionConfig = {
    filename: path.resolve(__dirname, "database.sqlite"),
  };
}

module.exports = {
  client: hasPostgres ? "pg" : "sqlite3",
  connection: connectionConfig,
  useNullAsDefault: !hasPostgres,
  pool: hasPostgres
    ? {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 15000,
        createTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      }
    : undefined,
};

`

---

### File: server/src/index.js

`javascript
﻿const dns = require("dns");
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

`

---

### File: server/src/db/connection.js

`javascript
﻿const knex = require("knex");
const knexConfig = require("../../knexfile");
const { sampleTemplates } = require("./seeds");

const db = knex(knexConfig);

async function initDb() {
  try {
    const hasUsersTable = await db.schema.hasTable("users");
    if (!hasUsersTable) {
      await db.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").unique().notNullable();
        table.string("password").notNullable();
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Created users table");
    }

    const hasTemplatesTable = await db.schema.hasTable("templates");
    if (!hasTemplatesTable) {
      await db.schema.createTable("templates", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.text("description").notNullable();
        table.string("thumbnail_url").notNullable();
        table.string("category").notNullable();
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Created templates table");
    }

    const hasFavoritesTable = await db.schema.hasTable("favorites");
    if (!hasFavoritesTable) {
      await db.schema.createTable("favorites", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.integer("template_id").unsigned().notNullable().references("id").inTable("templates").onDelete("CASCADE");
        table.timestamp("created_at").defaultTo(db.fn.now());
        table.unique(["user_id", "template_id"]);
      });
      console.log("Created favorites table");
    }

    // Auto-seed if templates is empty
    const templateCount = await db("templates").count("id as count").first();
    const count = parseInt(templateCount.count || 0, 10);
    if (count === 0) {
      console.log("Seeding initial SaaS templates...");
      await db("templates").insert(sampleTemplates);
      console.log(`Seeded ${sampleTemplates.length} templates successfully`);
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = { db, initDb };

`

---

### File: server/src/db/seeds.js

`javascript
﻿const sampleTemplates = [
  {
    name: "NexusCRM Pro Suite",
    category: "CRM",
    description: "Enterprise-grade customer relationship management dashboard with deal tracking, automated sales funnels, and customer communication history.",
    thumbnail_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "PulseMetrics Realtime Analytics",
    category: "Analytics",
    description: "Comprehensive analytics suite with real-time visitor tracking, custom conversion funnels, event logging, and cohort retention charts.",
    thumbnail_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "CogniBot Autonomous AI Agent",
    category: "AI Tools",
    description: "Ready-to-deploy LLM chat and autonomous workflow assistant with vector search integrations, prompt management, and chat playground.",
    thumbnail_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "DevDock Cloud Platform",
    category: "Developer Tools",
    description: "Modern developer portal with containerized microservice management, CI/CD pipeline triggers, audit logs, and API key provisioning.",
    thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "StoreCraft Headless E-Commerce",
    category: "E-Commerce",
    description: "Multi-currency SaaS storefront with Stripe checkout integration, inventory management, discount codes, and order lifecycle tracking.",
    thumbnail_url: "https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "TaskFlow Kanban & Sprints",
    category: "Project Management",
    description: "Agile project management workspace featuring interactive drag-and-drop boards, sprint planning milestones, and velocity metrics.",
    thumbnail_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "PayPulse Subscriptions & Billing",
    category: "Fintech",
    description: "B2B SaaS subscription billing engine with recurring payment invoicing, metered usage calculators, tax calculations, and churn alerts.",
    thumbnail_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "SupportZen Omnichannel Helpdesk",
    category: "Customer Support",
    description: "Fast customer support ticketing platform with shared team inboxes, canned response templates, SLA monitoring, and satisfaction surveys.",
    thumbnail_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
  }
];

module.exports = { sampleTemplates };

`

---

### File: server/src/middleware/auth.js

`javascript
﻿const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_saas_store_2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token missing. Please log in to proceed.",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      success: false,
      message: "Malformed authorization header. Format should be: Bearer <token>",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

module.exports = { authenticateToken, JWT_SECRET };

`

---

### File: server/src/routes/auth.js

`javascript
﻿const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db/connection");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user exists
    const existingUser = await db("users").where({ email: cleanEmail }).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    let insertedId;
    const insertResult = await db("users")
      .insert({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
      })
      .returning("id");

    if (Array.isArray(insertResult) && insertResult.length > 0) {
      insertedId = typeof insertResult[0] === "object" ? insertResult[0].id : insertResult[0];
    } else {
      const fallbackUser = await db("users").where({ email: cleanEmail }).first();
      insertedId = fallbackUser.id;
    }

    const tokenPayload = {
      id: insertedId,
      name: cleanName,
      email: cleanEmail,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: tokenPayload,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during registration.",
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are both required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await db("users").where({ email: cleanEmail }).first();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: tokenPayload,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
      error: error.message,
    });
  }
});

// GET /api/auth/me (authenticated)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "name", "email", "created_at")
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user me error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
});

module.exports = router;

`

---

### File: server/src/routes/templates.js

`javascript
﻿const express = require("express");
const jwt = require("jsonwebtoken");
const { db } = require("../db/connection");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// Helper to optionally extract authenticated user ID if token is provided
function getOptionalUserId(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    try {
      const decoded = jwt.verify(parts[1], JWT_SECRET);
      return decoded.id;
    } catch {
      return null;
    }
  }
  return null;
}

// GET /api/templates
// Bonus: category filter & search filter
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = db("templates").select("id", "name", "description", "thumbnail_url", "category", "created_at");

    if (category && category !== "All" && category.trim() !== "") {
      query = query.where("category", category.trim());
    }

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(name) LIKE ?", [searchTerm])
          .orWhereRaw("LOWER(description) LIKE ?", [searchTerm])
          .orWhereRaw("LOWER(category) LIKE ?", [searchTerm]);
      });
    }

    query = query.orderBy("id", "asc");
    const templates = await query;

    // Check optional favorites if user is authenticated
    const userId = getOptionalUserId(req);
    let favoriteIds = new Set();
    if (userId) {
      const userFavorites = await db("favorites").where({ user_id: userId }).select("template_id");
      favoriteIds = new Set(userFavorites.map((f) => f.template_id));
    }

    const dataWithFavorites = templates.map((t) => ({
      ...t,
      is_favorite: favoriteIds.has(t.id),
    }));

    return res.status(200).json({
      success: true,
      count: dataWithFavorites.length,
      data: dataWithFavorites,
    });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates.",
      error: error.message,
    });
  }
});

// GET /api/templates/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const template = await db("templates").where({ id }).first();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found.`,
      });
    }

    const userId = getOptionalUserId(req);
    let is_favorite = false;
    if (userId) {
      const fav = await db("favorites").where({ user_id: userId, template_id: template.id }).first();
      is_favorite = Boolean(fav);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...template,
        is_favorite,
      },
    });
  } catch (error) {
    console.error("Fetch template by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch template details.",
      error: error.message,
    });
  }
});

module.exports = router;

`

---

### File: server/src/routes/favorites.js

`javascript
﻿const express = require("express");
const { db } = require("../db/connection");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

// GET /api/favorites - Get all favorited templates for logged-in user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await db("favorites")
      .join("templates", "favorites.template_id", "templates.id")
      .where("favorites.user_id", userId)
      .select(
        "templates.id",
        "templates.name",
        "templates.description",
        "templates.thumbnail_url",
        "templates.category",
        "favorites.created_at as favorited_at"
      )
      .orderBy("favorites.created_at", "desc");

    const formattedFavorites = favorites.map((item) => ({
      ...item,
      is_favorite: true,
    }));

    return res.status(200).json({
      success: true,
      count: formattedFavorites.length,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error("Fetch favorites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorited templates.",
      error: error.message,
    });
  }
});

// POST /api/favorites/:templateId - Add to favorites
router.post("/:templateId", async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.templateId, 10);

    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID provided.",
      });
    }

    // Verify template exists
    const template = await db("templates").where({ id: templateId }).first();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${templateId} not found.`,
      });
    }

    // Check if already favorited
    const existing = await db("favorites").where({ user_id: userId, template_id: templateId }).first();
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Template is already in your favorites.",
        favorited: true,
        data: template,
      });
    }

    // Insert new favorite
    await db("favorites").insert({
      user_id: userId,
      template_id: templateId,
    });

    return res.status(201).json({
      success: true,
      message: "Template added to favorites successfully!",
      favorited: true,
      data: template,
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add template to favorites.",
      error: error.message,
    });
  }
});

// DELETE /api/favorites/:templateId - Remove from favorites
router.delete("/:templateId", async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.templateId, 10);

    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID provided.",
      });
    }

    const deletedCount = await db("favorites").where({ user_id: userId, template_id: templateId }).del();

    return res.status(200).json({
      success: true,
      message: deletedCount > 0 ? "Template removed from favorites." : "Template was not in favorites.",
      favorited: false,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove template from favorites.",
      error: error.message,
    });
  }
});

module.exports = router;

`

---

### File: server/supabase_schema.sql

`sql
﻿-- ========================================================
-- Mini SaaS Template Store - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor if you prefer manual setup
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_id)
);

-- 4. Initial Seed Templates
INSERT INTO templates (name, category, description, thumbnail_url)
VALUES 
  ('NexusCRM Pro Suite', 'CRM', 'Enterprise-grade customer relationship management dashboard with deal tracking, automated sales funnels, and customer communication history.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'),
  ('PulseMetrics Realtime Analytics', 'Analytics', 'Comprehensive analytics suite with real-time visitor tracking, custom conversion funnels, event logging, and cohort retention charts.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'),
  ('CogniBot Autonomous AI Agent', 'AI Tools', 'Ready-to-deploy LLM chat and autonomous workflow assistant with vector search integrations, prompt management, and chat playground.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'),
  ('DevDock Cloud Platform', 'Developer Tools', 'Modern developer portal with containerized microservice management, CI/CD pipeline triggers, audit logs, and API key provisioning.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'),
  ('StoreCraft Headless E-Commerce', 'E-Commerce', 'Multi-currency SaaS storefront with Stripe checkout integration, inventory management, discount codes, and order lifecycle tracking.', 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80'),
  ('TaskFlow Kanban & Sprints', 'Project Management', 'Agile project management workspace featuring interactive drag-and-drop boards, sprint planning milestones, and velocity metrics.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'),
  ('PayPulse Subscriptions & Billing', 'Fintech', 'B2B SaaS subscription billing engine with recurring payment invoicing, metered usage calculators, tax calculations, and churn alerts.', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'),
  ('SupportZen Omnichannel Helpdesk', 'Customer Support', 'Fast customer support ticketing platform with shared team inboxes, canned response templates, SLA monitoring, and satisfaction surveys.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80')
ON CONFLICT DO NOTHING;

`

---

### File: server/test-api.js

`javascript
﻿const http = require("http");
require("dotenv").config();
const { db, initDb } = require("./src/db/connection");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/auth");
const templatesRoutes = require("./src/routes/templates");
const favoritesRoutes = require("./src/routes/favorites");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING COMPREHENSIVE BACKEND API TEST SUITE");
  console.log("==================================================");

  // Initialize DB
  await initDb();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/templates", templatesRoutes);
  app.use("/api/favorites", favoritesRoutes);

  const server = app.listen(5099);
  const BASE = "http://127.0.0.1:5099";

  let token = null;
  const testEmail = `test_${Date.now()}@example.com`;

  try {
    // 1. Health check
    console.log("\n[Test 1] GET /api/health");
    let res = await fetch(`${BASE}/api/health`);
    let data = await res.json();
    console.log("Status:", res.status, "Response:", data);
    if (res.status !== 200 || data.status !== "ok") throw new Error("Health check failed");

    // 2. Templates list
    console.log("\n[Test 2] GET /api/templates");
    res = await fetch(`${BASE}/api/templates`);
    data = await res.json();
    console.log("Status:", res.status, "Count:", data.count, "Success:", data.success);
    if (res.status !== 200 || !Array.isArray(data.data) || data.count < 5) {
      throw new Error("Templates list check failed");
    }

    // 3. Category Filter (Bonus)
    console.log("\n[Test 3] GET /api/templates?category=CRM");
    res = await fetch(`${BASE}/api/templates?category=CRM`);
    data = await res.json();
    console.log("Status:", res.status, "Count:", data.count, "Categories:", data.data.map(d => d.category));
    if (res.status !== 200 || !data.data.every(d => d.category === "CRM")) {
      throw new Error("Category filter check failed");
    }

    // 4. Search Filter (Bonus)
    console.log("\n[Test 4] GET /api/templates?search=PulseMetrics");
    res = await fetch(`${BASE}/api/templates?search=PulseMetrics`);
    data = await res.json();
    console.log("Status:", res.status, "Count:", data.count, "Found:", data.data.map(d => d.name));
    if (res.status !== 200 || data.count === 0) {
      throw new Error("Search filter check failed");
    }

    // 5. Template Details
    console.log("\n[Test 5] GET /api/templates/1");
    res = await fetch(`${BASE}/api/templates/1`);
    data = await res.json();
    console.log("Status:", res.status, "Template Name:", data.data?.name);
    if (res.status !== 200 || !data.data) {
      throw new Error("Template details check failed");
    }

    // 6. Register
    console.log("\n[Test 6] POST /api/auth/register");
    res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Developer",
        email: testEmail,
        password: "secretPassword123"
      }),
    });
    data = await res.json();
    console.log("Status:", res.status, "Message:", data.message, "Token received:", Boolean(data.token));
    if (res.status !== 201 || !data.token) {
      throw new Error("Registration check failed");
    }
    token = data.token;

    // 7. Duplicate Register check
    console.log("\n[Test 7] POST /api/auth/register (Duplicate Email)");
    res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Developer 2",
        email: testEmail,
        password: "secretPassword123"
      }),
    });
    data = await res.json();
    console.log("Status:", res.status, "Message:", data.message);
    if (res.status !== 409) {
      throw new Error("Duplicate registration did not return 409");
    }

    // 8. Login
    console.log("\n[Test 8] POST /api/auth/login");
    res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "secretPassword123"
      }),
    });
    data = await res.json();
    console.log("Status:", res.status, "Message:", data.message, "Token received:", Boolean(data.token));
    if (res.status !== 200 || !data.token) {
      throw new Error("Login check failed");
    }

    // 9. Auth Me
    console.log("\n[Test 9] GET /api/auth/me (Protected)");
    res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Status:", res.status, "User Name:", data.user?.name);
    if (res.status !== 200 || !data.user) {
      throw new Error("Protected me check failed");
    }

    // 10. Favorites without Auth -> 401
    console.log("\n[Test 10] GET /api/favorites (Unauthenticated -> 401)");
    res = await fetch(`${BASE}/api/favorites`);
    console.log("Status:", res.status);
    if (res.status !== 401) {
      throw new Error("Unauthenticated favorites access did not return 401");
    }

    // 11. Add to Favorites
    console.log("\n[Test 11] POST /api/favorites/1 (Add Favorite)");
    res = await fetch(`${BASE}/api/favorites/1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Status:", res.status, "Message:", data.message, "Favorited:", data.favorited);
    if (res.status !== 201 || !data.favorited) {
      throw new Error("Add to favorites failed");
    }

    // 12. Get Favorites
    console.log("\n[Test 12] GET /api/favorites (List User Favorites)");
    res = await fetch(`${BASE}/api/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Status:", res.status, "Favorites Count:", data.count, "Items:", data.data.map(d => d.name));
    if (res.status !== 200 || data.count !== 1 || data.data[0].id !== 1) {
      throw new Error("Get user favorites failed");
    }

    // 13. Remove from Favorites
    console.log("\n[Test 13] DELETE /api/favorites/1 (Remove Favorite)");
    res = await fetch(`${BASE}/api/favorites/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Status:", res.status, "Message:", data.message);
    if (res.status !== 200) {
      throw new Error("Remove from favorites failed");
    }

    // 14. Verify Favorites empty after delete
    console.log("\n[Test 14] GET /api/favorites (Verify empty after deletion)");
    res = await fetch(`${BASE}/api/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Status:", res.status, "Favorites Count:", data.count);
    if (res.status !== 200 || data.count !== 0) {
      throw new Error("Favorites count was not 0 after removal");
    }

    console.log("\n==================================================");
    console.log("✅ ALL 14 TESTS PASSED FLAWLESSLY!");
    console.log("==================================================");
  } finally {
    server.close();
  }
}

runTests().then(() => process.exit(0)).catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});

`

---

### File: client/package.json

`json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.109.0",
    "@tailwindcss/vite": "^4.3.3",
    "axios": "^1.20.0",
    "lucide-react": "^1.54.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.4",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "oxlint": "^1.81.0",
    "vite": "^8.3.0"
  }
}

`

---

### File: client/vite.config.js

`javascript
﻿import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});

`

---

### File: client/src/index.css

`css
﻿@import "tailwindcss";

@layer base {
  body {
    @apply bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
}

/* Custom modern scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* Ambient glow & animation helpers */
@keyframes pulseSlow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes floatGentle {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes heartPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.35) rotate(-6deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.animate-pulse-slow {
  animation: pulseSlow 8s ease-in-out infinite;
}

.animate-float {
  animation: floatGentle 4s ease-in-out infinite;
}

.animate-heart-pop {
  animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.glass-card {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card:hover {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.2);
}

`

---

### File: client/src/services/api.js

`javascript
﻿import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const DEFAULT_PROD_API = "https://fullstack-intern-task-te6m.onrender.com/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isLocalhost ? "http://localhost:5000/api" : DEFAULT_PROD_API);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear invalid data
      if (localStorage.getItem("token")) {
        console.warn("Session expired or unauthorized. Clearing stored auth state.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const templatesApi = {
  getAll: (params) => api.get("/templates", { params }),
  getById: (id) => api.get(`/templates/${id}`),
};

export const favoritesApi = {
  getAll: () => api.get("/favorites"),
  add: (templateId) => api.post(`/favorites/${templateId}`),
  remove: (templateId) => api.delete(`/favorites/${templateId}`),
};

export default api;

`

---

### File: client/src/services/supabaseClient.js

`javascript
﻿import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("YOUR-") && 
  !supabaseAnonKey.includes("YOUR-")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

`

---

### File: client/src/context/AuthContext.jsx

`javascript
﻿import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth (supports both Supabase Auth & Express JWT backend)
  useEffect(() => {
    let authListener = null;

    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split("@")[0],
            };
            setUser(userData);
            setToken(session.access_token);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", session.access_token);
          } else {
            // Check if there was local auth
            const storedToken = localStorage.getItem("token");
            if (storedToken && !storedToken.startsWith("eyJ")) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          }

          // Listen to Supabase auth events (e.g. Email verification link click)
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email.split("@")[0],
              };
              setUser(userData);
              setToken(session.access_token);
              localStorage.setItem("user", JSON.stringify(userData));
              localStorage.setItem("token", session.access_token);
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              setToken(null);
              localStorage.removeItem("user");
              localStorage.removeItem("token");
            }
          });
          authListener = listener;
        } catch (err) {
          console.warn("Supabase auth session restore error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Express backend JWT session restoration
        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
          setLoading(false);
          return;
        }

        try {
          const res = await authApi.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        } finally {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Register function
  const register = async (name, email, password) => {
    if (isSupabaseConfigured && supabase) {
      // Supabase Auth Signup with Email Verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin + "/templates",
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return {
          emailConfirmationRequired: true,
          email: data.user.email,
          message: "A verification email has been sent to your address. Please verify your email before logging in.",
        };
      }

      if (data?.session) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || name,
        };
        setUser(userData);
        setToken(data.session.access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.session.access_token);
        return { user: userData, token: data.session.access_token };
      }
    }

    // Default backend auth
    const res = await authApi.register({ name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("token", receivedToken);
    localStorage.setItem("user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  // Login function
  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          const customErr = new Error("Email address has not been confirmed. Please check your inbox for the Supabase verification link.");
          customErr.isEmailNotConfirmed = true;
          customErr.email = email;
          throw customErr;
        }
        throw new Error(error.message);
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split("@")[0],
      };
      setUser(userData);
      setToken(data.session.access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.session.access_token);
      return { user: userData, token: data.session.access_token };
    }

    // Default backend auth
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("token", receivedToken);
    localStorage.setItem("user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  // Resend Supabase verification email
  const resendVerificationEmail = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin + "/templates",
        },
      });
      if (error) throw new Error(error.message);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase sign out error:", err);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    isSupabaseMode: isSupabaseConfigured,
    login,
    register,
    resendVerificationEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

`

---

### File: client/src/components/ProtectedRoute.jsx

`javascript
﻿import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, message: "Please log in to view your favorited templates." }} replace />;
  }

  return children;
}

`

---

### File: client/src/components/Navbar.jsx

`javascript
﻿import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Heart, LayoutGrid, LogIn, LogOut, User, PlusCircle } from "lucide-react";

export default function Navbar({ favoritesCount = 0 }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/templates" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SaaS<span className="text-indigo-400">Vault</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              Template Store
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/templates" className={navLinkClasses}>
            <LayoutGrid className="w-4 h-4" />
            <span>Templates</span>
          </NavLink>

          <NavLink to="/favorites" className={navLinkClasses}>
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {favoritesCount}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Right Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-xs text-white uppercase shadow-sm">
                  {user?.name ? user.name[0] : "U"}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-medium text-slate-200">{user?.name || "User"}</p>
                  <p className="text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/50 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

`

---

### File: client/src/components/Footer.jsx

`javascript
﻿import React from "react";
import { Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-300">SaaS Vault</span>
          <span>— Full Stack Technical Task</span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>using React, Tailwind CSS, Express & Supabase / Knex</span>
        </div>
      </div>
    </footer>
  );
}

`

---

### File: client/src/components/TemplateCard.jsx

`javascript
﻿import React, { useState } from "react";
import { Heart, Eye, Sparkles, ExternalLink } from "lucide-react";

export default function TemplateCard({ template, isFavorite, onToggleFavorite, onOpenDetails }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [popAnim, setPopAnim] = useState(false);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setPopAnim(true);
    setTimeout(() => setPopAnim(false), 450);
    onToggleFavorite(template);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/15">
      {/* Dynamic Glowing border gradient on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/40 group-hover:via-purple-500/30 group-hover:to-pink-500/20 transition-all duration-500 pointer-events-none" />

      {/* Main card body */}
      <div className="relative flex flex-col flex-1 bg-slate-900/90 border border-slate-800/80 group-hover:border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-xl">
        {/* Thumbnail Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={template.thumbnail_url}
            alt={template.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:rotate-0.5 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-800/60 animate-pulse flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          )}

          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />

          {/* Category Badge */}
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow-md">
            {template.category}
          </span>

          {/* Floating Favorite Action */}
          <button
            onClick={handleFavoriteClick}
            title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 border cursor-pointer ${
              popAnim ? "animate-heart-pop" : ""
            } ${
              isFavorite
                ? "bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/40 scale-105"
                : "bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border-slate-700/80 hover:scale-105"
            }`}
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite ? "fill-white text-white scale-110" : "text-slate-300"
              }`}
            />
          </button>
        </div>

        {/* Card Content */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-semibold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
            {template.name}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
            {template.description}
          </p>

          {/* Card Footer Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
            <button
              onClick={() => onOpenDetails(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                popAnim ? "animate-heart-pop" : ""
              } ${
                isFavorite
                  ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 shadow-sm"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorite ? "fill-rose-400 text-rose-400" : "text-white"
                }`}
              />
              <span>{isFavorite ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

`

---

### File: client/src/components/TemplateDetailModal.jsx

`javascript
﻿import React from "react";
import { X, Heart, Sparkles, CheckCircle2, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export default function TemplateDetailModal({ template, isOpen, onClose, onToggleFavorite, isFavorite }) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-950">
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Pill */}
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/90 text-white backdrop-blur-md shadow-md">
            {template.category}
          </span>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {template.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">About Template</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {template.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Included Capabilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "Production-ready responsive layouts",
                "JWT authentication & session security",
                "RESTful backend API integration",
                "Tailwind CSS theme tokens & dark styling",
                "Mobile-first responsive optimization",
                "Clean modular architecture",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-xs text-indigo-200">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Ready for full-stack deployment on Vercel and Render with Supabase PostgreSQL!</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Back to Catalog
          </button>

          <button
            onClick={() => onToggleFavorite(template)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
              isFavorite
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isFavorite ? "fill-rose-400 text-rose-400 scale-110" : "text-white"
              }`}
            />
            <span>{isFavorite ? "Favorited" : "Add to Favorites"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

`

---

### File: client/src/pages/TemplatesPage.jsx

`javascript
﻿import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { templatesApi, favoritesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TemplateCard from "../components/TemplateCard";
import TemplateDetailModal from "../components/TemplateDetailModal";
import { Search, Filter, Sparkles, Loader2, Heart, AlertCircle, X } from "lucide-react";

const CATEGORIES = [
  "All",
  "CRM",
  "Analytics",
  "AI Tools",
  "Developer Tools",
  "E-Commerce",
  "Project Management",
  "Fintech",
  "Customer Support",
];

export default function TemplatesPage({ onFavoritesChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch templates and user favorites
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch templates
      const templatesRes = await templatesApi.getAll();
      const fetchedTemplates = templatesRes.data?.data || [];
      setTemplates(fetchedTemplates);

      // 2. If logged in, fetch user favorites
      if (isAuthenticated) {
        try {
          const favRes = await favoritesApi.getAll();
          const favList = favRes.data?.data || [];
          const ids = new Set(favList.map((f) => f.id));
          setFavoriteIds(ids);
          if (onFavoritesChange) onFavoritesChange(ids.size);
        } catch (favErr) {
          console.warn("Could not load user favorites:", favErr);
        }
      } else {
        setFavoriteIds(new Set());
        if (onFavoritesChange) onFavoritesChange(0);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Failed to load templates. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (template) => {
    if (!isAuthenticated) {
      showToast("Please log in to save templates to favorites", "info");
      navigate("/login", { state: { message: "Please log in to manage your favorites." } });
      return;
    }

    const isFav = favoriteIds.has(template.id);

    try {
      if (isFav) {
        // Remove from favorites
        await favoritesApi.remove(template.id);
        const nextIds = new Set(favoriteIds);
        nextIds.delete(template.id);
        setFavoriteIds(nextIds);
        if (onFavoritesChange) onFavoritesChange(nextIds.size);
        showToast(`Removed "${template.name}" from favorites`, "info");
      } else {
        // Add to favorites
        await favoritesApi.add(template.id);
        const nextIds = new Set(favoriteIds);
        nextIds.add(template.id);
        setFavoriteIds(nextIds);
        if (onFavoritesChange) onFavoritesChange(nextIds.size);
        showToast(`Added "${template.name}" to favorites!`, "success");
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
      showToast(err.response?.data?.message || "Failed to update favorites.", "error");
    }
  };

  // Filter templates locally based on search query & selected category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All" || template.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-700/60"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-700/60"
                : "bg-indigo-950/90 text-indigo-200 border-indigo-700/60"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950 pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Curated SaaS Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Mini SaaS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Template Store</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover production-ready templates for your next software project. Browse, search, filter by category, and bookmark your favorites.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, description or category..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills (Bonus Feature) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Available Templates</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
              {filteredTemplates.length}
            </span>
          </div>

          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading templates catalogue...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-rose-200 mb-1">Failed to load templates</h3>
            <p className="text-xs text-rose-300/80 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isFavorite={favoriteIds.has(template.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(tmpl) => setActiveModalTemplate(tmpl)}
              />
            ))}
          </div>
        )}

        {/* Empty Search Results */}
        {!loading && !error && filteredTemplates.length === 0 && (
          <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No templates found</h3>
            <p className="text-xs text-slate-400 mb-5">
              No results match your criteria "{searchQuery || selectedCategory}". Try adjusting your query or category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      {/* Modal Details Preview */}
      <TemplateDetailModal
        template={activeModalTemplate}
        isOpen={Boolean(activeModalTemplate)}
        onClose={() => setActiveModalTemplate(null)}
        isFavorite={activeModalTemplate ? favoriteIds.has(activeModalTemplate.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}

`

---

### File: client/src/pages/FavoritesPage.jsx

`javascript
﻿import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { favoritesApi } from "../services/api";
import TemplateCard from "../components/TemplateCard";
import TemplateDetailModal from "../components/TemplateDetailModal";
import { Heart, Sparkles, Loader2, AlertCircle, ArrowRight, LayoutGrid } from "lucide-react";

export default function FavoritesPage({ onFavoritesChange }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "info") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoritesApi.getAll();
      const list = res.data?.data || [];
      setFavorites(list);
      if (onFavoritesChange) onFavoritesChange(list.length);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load your favorited templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (template) => {
    try {
      // Remove from favorites
      await favoritesApi.remove(template.id);
      const updatedList = favorites.filter((f) => f.id !== template.id);
      setFavorites(updatedList);
      if (onFavoritesChange) onFavoritesChange(updatedList.length);
      showToast(`Removed "${template.name}" from favorites`, "info");

      if (activeModalTemplate && activeModalTemplate.id === template.id) {
        setActiveModalTemplate(null);
      }
    } catch (err) {
      console.error("Remove favorite error:", err);
      showToast("Failed to remove template from favorites.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border ${
              toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-700/60"
                : "bg-indigo-950/90 text-indigo-200 border-indigo-700/60"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Heart className="w-3.5 h-3.5 fill-rose-400" /> Bookmarked Collection
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                My Saved <span className="text-rose-400">Favorites</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                All templates you have saved for quick access and reference.
              </p>
            </div>

            <Link
              to="/templates"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Explore More Templates</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading your favorites...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-rose-200 mb-1">{error}</h3>
            <button
              onClick={loadFavorites}
              className="mt-3 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && !error && favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Showing {favorites.length} Saved {favorites.length === 1 ? "Template" : "Templates"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(tmpl) => setActiveModalTemplate(tmpl)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty Favorites State */}
        {!loading && !error && favorites.length === 0 && (
          <div className="text-center py-24 px-4 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No favorites saved yet</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-sm mx-auto">
              You haven't added any templates to your favorites list. Browse the store and click the heart icon on any template card!
            </p>
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <span>Browse Template Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* Modal Preview */}
      <TemplateDetailModal
        template={activeModalTemplate}
        isOpen={Boolean(activeModalTemplate)}
        onClose={() => setActiveModalTemplate(null)}
        isFavorite={true}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}

`

---

### File: client/src/pages/LoginPage.jsx

`javascript
﻿import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle, Send, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  const redirectMessage = location.state?.message;
  const from = location.state?.from?.pathname || "/templates";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
    setUnconfirmedEmail(null);
    setResendNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setUnconfirmedEmail(null);
    setResendNotice("");

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      if (err.isEmailNotConfirmed) {
        setUnconfirmedEmail(err.email || formData.email);
        setErrorMessage("Your email address has not been verified yet.");
      } else {
        const msg = err.message || err.response?.data?.message || "Invalid credentials. Please verify your email and password.";
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendNotice("Verification email re-sent! Please check your inbox.");
    } catch (err) {
      setResendNotice("Could not resend email: " + (err.message || "Please try again later."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Log in to manage your templates and saved favorites
          </p>
        </div>

        {/* Redirect notice if triggered by protected route */}
        {redirectMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {unconfirmedEmail && (
                <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-col gap-2">
                  <p className="text-[11px] text-rose-200/90">
                    Did not receive the verification email?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-600/80 hover:bg-rose-600 px-3 py-1 rounded-lg self-start transition-colors cursor-pointer"
                  >
                    {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Resend Verification Email</span>
                  </button>
                  {resendNotice && (
                    <p className="text-[11px] text-emerald-300 font-medium">{resendNotice}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

`

---

### File: client/src/pages/RegisterPage.jsx

`javascript
﻿import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Send, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { register, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationPendingEmail, setVerificationPendingEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await register(formData.name.trim(), formData.email.trim(), formData.password);
      
      if (result?.emailConfirmationRequired) {
        setVerificationPendingEmail(result.email || formData.email.trim());
      } else {
        navigate("/templates", { replace: true });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err.message || err.response?.data?.message || "Failed to create account. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verificationPendingEmail) return;
    setResending(true);
    setResendStatus("");
    try {
      await resendVerificationEmail(verificationPendingEmail);
      setResendStatus("Verification email re-sent! Please check your inbox & spam folder.");
    } catch (err) {
      setResendStatus("Failed to resend: " + (err.message || "Please try again later."));
    } finally {
      setResending(false);
    }
  };

  // If Supabase Email Verification is required, show verification screen
  if (verificationPendingEmail) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur-md text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto mb-5 text-indigo-400 relative">
            <Mail className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Check Your Inbox!</h2>
          <p className="text-sm text-slate-300 mb-2">
            We sent a verification link to:
          </p>
          <div className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-800 text-indigo-300 font-mono text-xs mb-5 border border-slate-700">
            {verificationPendingEmail}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Please open the email from Supabase and click the confirmation link to activate your account. Once verified, you can sign in directly!
          </p>

          {resendStatus && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Go to Sign In</span>
            </Link>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Resend Verification Email</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an Account</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Join the SaaS Template Store to favorite & save templates
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

`

---

### File: client/src/App.jsx

`javascript
﻿import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import TemplatesPage from "./pages/TemplatesPage";
import FavoritesPage from "./pages/FavoritesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const [favoritesCount, setFavoritesCount] = useState(0);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
          <Navbar favoritesCount={favoritesCount} />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<TemplatesPage onFavoritesChange={setFavoritesCount} />} />
              <Route path="/templates" element={<TemplatesPage onFavoritesChange={setFavoritesCount} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Favorites Route (bonus: redirects if unauthenticated) */}
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage onFavoritesChange={setFavoritesCount} />
                  </ProtectedRoute>
                }
              />

              {/* 404 Not Found Catch-All */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <h2 className="text-4xl font-extrabold text-white mb-2">404</h2>
                    <p className="text-sm text-slate-400 mb-6">Oops! The page you were looking for does not exist.</p>
                    <Navigate to="/templates" replace />
                  </div>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

`

---

### File: client/src/main.jsx

`javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

`

---

