const http = require("http");
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
