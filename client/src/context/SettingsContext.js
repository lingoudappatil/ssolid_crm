import React, { createContext, useState, useContext, useEffect } from "react";

export const SettingsContext = createContext();

const defaultSettings = {
  // General settings
  theme: "light",
  language: "en",
  notifications: true,
  autoSave: true,
  customFields: {
    Lead: [],
    Customer: [],
    Order: []
  },
  // Module settings
  lead: {
    sources: ["Friend", "Walk In", "Social Media", "Other"],
    status: ["New", "In Progress", "Converted", "Lost"],
    priority: ["High", "Medium", "Low"],
  },
  quotation: {
    status: ["Draft", "Sent", "Accepted", "Rejected"],
    type: ["Product", "Service", "Mixed"],
  },
  order: {
    status: ["New", "Processing", "Shipped", "Delivered", "Cancelled"],
    paymentStatus: ["Pending", "Partial", "Paid", "Refunded"],
  },
  customer: {
    type: ["Individual", "Business", "Government"],
    status: ["Active", "Inactive", "VIP"],
  },
};

export const SettingsProvider = ({ children }) => {
  const [moduleSettings, setModuleSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load all settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const modules = ["lead", "quotation", "order", "customer"];
        const newSettings = { ...defaultSettings };

        for (const module of modules) {
          for (const field of Object.keys(defaultSettings[module])) {
            const type = `${module}_${field}`;
            const res = await fetch(`${base}/api/settings/${type}`);
            const data = await res.json();
            if (res.ok && data.values?.length) {
              newSettings[module][field] = data.values;
            }
          }
        }

        setModuleSettings(newSettings);
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Add a new option (calls backend)
  const addOption = async (module, field, newValue) => {
    if (!newValue.trim()) return;
    const type = `${module}_${field}`;
    const base = process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${base}/api/settings/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: newValue.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setModuleSettings((prev) => ({
          ...prev,
          [module]: { ...prev[module], [field]: data.values },
        }));
      }
    } catch (err) {
      console.error("Error adding option:", err);
    }
  };

  // Remove an option
  const removeOption = async (module, field, option) => {
    const type = `${module}_${field}`;
    const base = process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${base}/api/settings/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: option }),
      });
      const data = await res.json();
      if (res.ok) {
        setModuleSettings((prev) => ({
          ...prev,
          [module]: { ...prev[module], [field]: data.values },
        }));
      }
    } catch (err) {
      console.error("Error removing option:", err);
    }
  };

  // Simplify usage for Lead Sources only
  const leadSources = moduleSettings.lead?.sources || [];
  const addLeadSource = (src) => addOption("lead", "sources", src);
  const removeLeadSource = (src) => removeOption("lead", "sources", src);

  return (
    <SettingsContext.Provider
      value={{
        moduleSettings,
        setModuleSettings,
        addOption,
        removeOption,
        leadSources,
        addLeadSource,
        removeLeadSource,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
