import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx"; // AuthProvider'ı import edin

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        {" "}
        {/* App'i AuthProvider ile sarın */}
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
