const express = require("express");
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
