import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SetupNotice from "./components/SetupNotice.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { isFirebaseConfigured } from "./firebase.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isFirebaseConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <SetupNotice />
    )}
  </React.StrictMode>
);
