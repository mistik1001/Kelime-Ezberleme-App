// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast"; // Add Toaster import

// Layouts
import MainLayout from "./layouts/MainLayout";

// Pages
import HomePage from "./pages/HomePage";
import KelimeEklePage from "./pages/KelimeEklePage";
import SinavPage from "./pages/SinavPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import ReportPage from "./pages/ReportPage";
import WordlePage from "./pages/WordlePage";
import WordChainPage from "./pages/WordChainPage";
import LearnedWordsPage from "./pages/LearnedWordsPage";

import "./index.css";

// Giriş yapmış olmayı gerektiren rotaları korumak için bir bileşen
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Global Toaster for all pages */}
      <Toaster
        position="top-center"
        containerStyle={{
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
            zIndex: 9999,
          },
        }}
      />

      <Routes>
        {/* Genel Layout'u kullanan rotalar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/kelime-ekle"
            element={
              <ProtectedRoute>
                <KelimeEklePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sinav"
            element={
              <ProtectedRoute>
                <SinavPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learned-words"
            element={
              <ProtectedRoute>
                <LearnedWordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wordle"
            element={
              <ProtectedRoute>
                <WordlePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/word-chain"
            element={
              <ProtectedRoute>
                <WordChainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Eşleşmeyen yollar için 404 sayfası */}
          <Route
            path="*"
            element={
              <div className="text-center py-10">
                <h1 className="text-6xl font-bold text-red-500">404</h1>
                <p className="text-2xl mt-4 mb-6">Sayfa Bulunamadı</p>
              </div>
            }
          />
        </Route>

        {/* Tam sayfa, Layout kullanmayan rotalar (Giriş, Kayıt vb.) */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </>
  );
}

export default App;
