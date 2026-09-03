//server/controllers/authController.js
import {
  registerUser,
  loginUser
} from "../services/authService.js";


// =================== REGISTER ===================

export const register = async (req, res) => {
  try {

    const user = await registerUser(req.body);

    res.status(201).json({
      message: "Registration successful",
      user
    });

  } catch (error) {

    console.error("Register error:", error);

    res.status(400).json({
      error: error.message
    });
  }
};


// =================== LOGIN ===================

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await loginUser(email, password);

    res.status(200).json({
      message: "Login successful",
      user
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(401).json({
      error: error.message
    });
  }
};