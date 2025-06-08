// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast"; // YENİ EKLENDİ

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate required fields
    if (!username.trim()) {
      toast.error("Kullanıcı adı boş bırakılamaz.");
      return;
    }

    if (!password) {
      toast.error("Şifre boş bırakılamaz.");
      return;
    }

    // Validate minimum lengths
    if (username.trim().length < 3) {
      toast.error("Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }

    try {
      const result = await window.electronAPI.loginUser({ username, password });
      if (result.success && result.user) {
        toast.success(`Hoş geldin, ${result.user.username}!`);
        login(result.user);
        navigate("/");
      } else {
        toast.error(result.message || "Giriş sırasında bir hata oluştu.");
      }
    } catch (err) {
      toast.error(err.message || "Giriş işlemi başarısız oldu.");
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Kullanıcı Girişi
          </h1>
          <p className="text-gray-600">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kullanıcı Adı Input'u */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
              placeholder="Kullanıcı adınızı girin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Şifre Input'u */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Şifre
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
              placeholder="Şifrenizi girin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Giriş Yap
          </button>

          {/* Ek Linkler */}
          <div className="space-y-4">
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Hesabınız yok mu?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                >
                  Kayıt Olun
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default LoginPage;
