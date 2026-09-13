// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const paymentRoutes = require("./routes/payment");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Arrow Techz Backend Running 🚀 with MySQL + Payments");
});

// ✅ Auth API (signup, login)
app.use("/api/auth", authRoutes);

// ✅ Payments API
app.use("/api/payments", paymentRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
