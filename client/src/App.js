// client/src/App.js
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HomePage from './HomePage';
import { SettingsProvider } from "./context/SettingsContext";

function App() {
  const [currentPage, setCurrentPage] = useState("login");

  return (
    // ✅ Wrap everything inside SettingsProvider
    <SettingsProvider>
      <div>
        {currentPage === "login" && (
          <LoginPage
            goToRegister={() => setCurrentPage("register")}
            goToHome={() => setCurrentPage("home")}
          />
        )}

        {currentPage === "register" && (
          <RegisterPage
            goToLogin={() => setCurrentPage("login")}
            goToHome={() => setCurrentPage("home")}
          />
        )}

        {currentPage === "home" && (
          <HomePage setCurrentPage={setCurrentPage} />
        )}
      </div>
    </SettingsProvider>
  );
}

export default App;
