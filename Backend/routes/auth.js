const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db"); // adjust path if needed

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Middleware to verify JWT
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; // Expecting "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * GET /api/auth/me
 * Returns current user profile
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error("❌ /me error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
