const express = require("express");
const jwt = require("jsonwebtoken");
const { markUserPaid, getUserByEmail } = require("../user");

const router = express.Router();

// Use environment variable, fallback for dev
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * POST /api/payments/success
 * Called by frontend after successful Razorpay payment verification.
 * Body should contain { email }
 */
router.post("/success", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Mark user as paid in DB
    await markUserPaid(email);

    // Fetch updated user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      message: "✅ Payment verified. User activated & logged in.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Payment success error:", err.message);
    return res.status(500).json({ error: "Server error while marking user paid" });
  }
});

module.exports = router;
