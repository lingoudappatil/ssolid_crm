import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "./settings.css";

const GeneralSettings = ({ setActiveTab }) => {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="settings-container">
      <ToastContainer />
      <div className="settings-card">
        <h2>⚙️ General Settings</h2>

        <div className="form-group">
          <label>Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="form-control"
          >
            <option value="light">🌞 Light Mode</option>
            <option value="dark">🌙 Dark Mode</option>
          </select>
        </div>

        <div className="form-group">
          <label>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-control"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Kannada</option>
          </select>
        </div>

        <div className="form-group toggle">
          <label>Notifications</label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
        </div>

        <button className="btn-primary mt-3">💾 Save Settings</button>
      </div>
      <div className="text-center mt-10">
        <button className="btn-secondary" onClick={() => setActiveTab && setActiveTab(null)}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};


export default GeneralSettings;
