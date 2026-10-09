const express = require("express");
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
