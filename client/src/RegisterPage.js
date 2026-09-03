//client/src/RegisterPage.js
import React, { useState } from "react";
import axios from "axios";
import "./AuthPage.css";

const RegisterPage = ({ goToLogin, goToHome }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 3) {
      setError("Password must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const api = "http://localhost:5000";

      const payload = {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      };

      console.log("📝 API URL:", api);
      console.log("📋 Payload:", payload);

      const response = await axios.post(`${api}/api/register`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Registration successful:", response.data);
      alert("✅ Registration successful! Please login.");
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      
      // Redirect to login
      goToLogin();

    } catch (error) {
      console.error("❌ Full error object:", error);
      
      let errorMsg = "Registration failed";
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        errorMsg = error.response.data?.error || 
                   error.response.data?.details || 
                   JSON.stringify(error.response.data);
      } else if (error.request) {
        console.error("Request sent but no response:", error.request);
        errorMsg = "No response from server - check if API is running";
      } else {
        console.error("Error message:", error.message);
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">CRM Registration</h2>

        {error && (
          <div style={{ 
            color: "red", 
            marginBottom: "10px",
            padding: "8px",
            backgroundColor: "#ffe6e6",
            borderRadius: "4px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />

          <input
            type="password"
            placeholder="Password (min 3 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <span onClick={goToLogin} style={{ cursor: "pointer", color: "blue" }}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;