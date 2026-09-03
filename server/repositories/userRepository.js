//server/repositories/userRepository.js
import pool from "../config/db.js";

// Find user by email
export const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
};


// Create new user
export const createUser = async ({
  name,
  email,
  password,
  username = null,
  address = null,
  state = null
}) => {
  const [result] = await pool.execute(
    `
      INSERT INTO users
      (name, email, username, password, address, state)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      email,
      username,
      password,
      address,
      state
    ]
  );

  return {
    id: result.insertId,
    name,
    email,
    username,
    address,
    state
  };
};