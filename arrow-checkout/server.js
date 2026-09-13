// arrow-checkout/server.js (ESM)

import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import mysql from "mysql2/promise";
import cors from "cors";
import jwt from "jsonwebtoken";


dotenv.config();

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors({ origin: "http://localhost:5500" })); // change if frontend runs elsewhere
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===================== DB POOL =====================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "arrowtechz_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ===================== RAZORPAY INSTANCE =====================
const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ===================== ROUTES =====================

// Health check
app.get("/", (req, res) => {
  res.send("✅ Arrow Checkout server is running");
});

// 1) Create Razorpay Order
app.post("/create-razor-order", async (req, res) => {
  try {
    const { amount, currency = "INR", userId } = req.body;
    if (!amount) return res.status(400).json({ error: "Missing amount (paise integer)" });

    const order = await razor.orders.create({
      amount: parseInt(amount),
      currency,
      receipt: `rcpt_${userId || "guest"}_${Date.now()}`,
      payment_capture: 1,
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID || "",
    });
  } catch (err) {
    console.error("create-razor-order:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// 2) Complete Payment & Create User
/**
 * Body format:
 * {
 *   gateway: "razorpay",
 *   payment: { razorpay_payment_id, razorpay_order_id, razorpay_signature },
 *   user: { name, email }
 * }
 */
app.post("/complete-payment", async (req, res) => {
  try {
    const { gateway, payment, user } = req.body;
    if (!gateway || !payment || !user || !user.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (gateway === "razorpay") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payment;

      // Verify signature
      const generated = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Signature valid → Create user in DB
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query("SELECT id FROM users WHERE email = ?", [user.email]);
        if (rows && rows.length > 0) {
          // Update existing
          await conn.query(
            "UPDATE users SET payment_id = ?, source = ? WHERE email = ?",
            [razorpay_payment_id, "razorpay", user.email]
          );
          return res.json({ ok: true, message: "User already existed; payment recorded." });
        } else {
          // Insert new
          await conn.query(
            "INSERT INTO users (name, email, source, payment_id) VALUES (?,?,?,?)",
            [user.name || null, user.email, "razorpay", razorpay_payment_id]
          );
          return res.json({ ok: true, message: "User created after payment." });
        }
      } finally {
        conn.release();
      }
    } else {
      return res.status(400).json({ error: "Unsupported gateway" });
    }
  } catch (err) {
    console.error("complete-payment:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Payment server listening on ${PORT}`));
