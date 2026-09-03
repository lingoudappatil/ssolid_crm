//server/services/authService.js
import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  createUser
} from "../repositories/userRepository.js";


// =================== REGISTER ===================

export const registerUser = async ({
  name,
  email,
  password,
  username,
  address,
  state
}) => {

  // Validate required fields
  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check existing user
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  return await createUser({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    username: username ? username.trim() : null,
    address: address || null,
    state: state || null
  });
};


// =================== LOGIN ===================

export const loginUser = async (email, password) => {

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  // Return safe user information
  // DO NOT return password
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    address: user.address,
    state: user.state
  };
};