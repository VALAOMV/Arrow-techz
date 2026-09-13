const connectDB = require("./db");

// Create user with password + default role=user + isPaid=false
async function createUser(name, email, hashedPassword) {
  const db = await connectDB();
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role, isPaid) VALUES (?, ?, ?, 'user', 0)",
    [name, email, hashedPassword]
  );
  return result.insertId;
}

async function getUsers() {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM users");
  return rows;
}

async function getUserByEmail(email) {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

async function markUserPaid(email) {
  const db = await connectDB();
  await db.query("UPDATE users SET isPaid = 1 WHERE email = ?", [email]);
}

module.exports = { createUser, getUsers, getUserByEmail, markUserPaid };
