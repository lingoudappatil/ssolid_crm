// client/src/context/SettingsContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Default settings structure
export const defaultSettings = {
  theme: "light",
  language: "en",
  notifications: true,
  autoSave: true,
  customFields: {
    Lead: [],
    Customer: [],
    Order: []
  }
};

export const SettingsContext = createContext({
  settings: defaultSettings,
  setSettings: () => console.warn("No SettingsProvider found")
});

// Create a custom hook for easy access
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Enhanced field normalization with better error handling
  const normalizeFieldOptions = (field) => {
    if (!field) return null;

    try {
      const normalizedField = {
        id: field.id || Date.now().toString(),
        label: field.label || '',
        type: field.type || 'text',
        required: field.required || false,
        options: []
      };

      // Handle dropdown options normalization
      if (field.type === "dropdown") {
        if (Array.isArray(field.options)) {
          normalizedField.options = field.options.filter(opt => 
            opt && typeof opt === 'string' && opt.trim() !== ''
          );
        } else if (typeof field.options === 'string') {
          normalizedField.options = field.options
            .split(',')
            .map(opt => opt.trim())
            .filter(opt => opt !== '');
        }
      }

      return normalizedField;
    } catch (error) {
      console.error('Error normalizing field:', error);
      return null;
    }
  };

  // Enhanced settings normalization
  const normalizeSettings = (loadedSettings) => {
    try {
      if (!loadedSettings || typeof loadedSettings !== 'object') {
        return defaultSettings;
      }

      // Start with default settings
      const normalized = { ...defaultSettings };

      // Safely merge basic settings
      const basicSettings = ['theme', 'language', 'notifications', 'autoSave'];
      basicSettings.forEach(key => {
        if (loadedSettings[key] !== undefined) {
          normalized[key] = loadedSettings[key];
        }
      });

      // Normalize custom fields
      if (loadedSettings.customFields && typeof loadedSettings.customFields === 'object') {
        Object.keys(defaultSettings.customFields).forEach(formType => {
          if (Array.isArray(loadedSettings.customFields[formType])) {
            normalized.customFields[formType] = loadedSettings.customFields[formType]
              .map(normalizeFieldOptions)
              .filter(field => field !== null);
          } else {
            normalized.customFields[formType] = [];
          }
        });
      }

      return normalized;
    } catch (error) {
      console.error('Error normalizing settings:', error);
      return defaultSettings;
    }
  };

  // Load settings with enhanced error handling
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem("userSettings");
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          const normalizedSettings = normalizeSettings(parsedSettings);
          setSettings(normalizedSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // Use default settings if corrupted
        localStorage.removeItem("userSettings");
        setSettings(defaultSettings);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Auto-save settings with debouncing
  useEffect(() => {
    if (!isLoaded) return;

    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem("userSettings", JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [settings, isLoaded]);

  // Apply theme to document
  useEffect(() => {
    if (isLoaded && settings.theme) {
      const root = document.documentElement;
      root.setAttribute('data-theme', settings.theme);
      
      if (settings.theme === 'dark') {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
      }
    }
  }, [settings.theme, isLoaded]);

  // Enhanced setSettings with validation
  const enhancedSetSettings = (updater) => {
    setSettings(prev => {
      const newSettings = typeof updater === 'function' ? updater(prev) : updater;
      return normalizeSettings(newSettings);
    });
  };

  // Safe context value
  const contextValue = {
    settings: settings || defaultSettings,
    setSettings: enhancedSetSettings
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};