// client/src/LoginPage.js
import React, { useState } from "react";
import axios from "axios";
import "./AuthPage.css";

const LoginPage = ({ goToRegister, goToHome }) => {
  const [email, setEmail] = useState("");   // changed from username
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const api = "http://localhost:5000";

      const res = await axios.post(`${api}/api/login`, {
        email,          // FIXED → backend expects email
        password,
      });

      // Optional (your backend does NOT send token yet)
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("✅ Login successful!");
      goToHome();

    } catch (error) {
      alert(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">CRM Login</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>

        <p className="auth-switch-text">
          Don't have an account?{" "}
          <span onClick={goToRegister}>Register here</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
