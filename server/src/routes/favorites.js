const express = require("express");
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
