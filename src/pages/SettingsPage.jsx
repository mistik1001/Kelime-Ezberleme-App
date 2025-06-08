// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast"; // YENİ EKLENDİ

function SettingsPage() {
  const { currentUser, updateUserSettingsInContext, isAuthenticated } =
    useAuth();
  const [newWordsCount, setNewWordsCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Bileşen yüklendiğinde ve currentUser değiştiğinde mevcut ayarı yükle
  useEffect(() => {
    if (currentUser && typeof currentUser.newWordsPerQuiz !== "undefined") {
      setNewWordsCount(currentUser.newWordsPerQuiz);
    }
  }, [currentUser, isAuthenticated]);

  const handleInputChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 50) {
      // Min 1, Max 50 kelime gibi bir sınır koyabiliriz
      setNewWordsCount(value);
    } else if (event.target.value === "") {
      setNewWordsCount(""); // Kullanıcının inputu tamamen silmesine izin ver
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser || !currentUser.id) {
      toast.error("Ayarları kaydetmek için giriş yapmalısınız.");
      return;
    }
    setIsLoading(true);
    try {
      const settingsToSave = { newWordsPerQuiz: parseInt(newWordsCount, 10) };
      const result = await window.electronAPI.saveUserSettings({
        userId: currentUser.id,
        settings: settingsToSave,
      });
      if (result.success) {
        updateUserSettingsInContext(settingsToSave);
        toast.success("Ayarlar başarıyla kaydedildi!");
      } else {
        toast.error(result.message || "Ayarlar kaydedilirken bir hata oluştu.");
      }
    } catch (error) {
      toast.error(error.message || "Ayarlar kaydedilirken bir sorun oluştu.");
    }
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {" "}
          <div className="text-6xl mb-4 emoji-fix">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 turkish-text">
            Giriş Gerekli
          </h2>
          <p className="text-lg text-gray-600 turkish-text">
            Ayarları görmek için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {" "}
        <div className="text-center mb-8">
          {" "}
          <h1 className="text-4xl font-bold text-slate-600 mb-4 turkish-text emoji-fix">
            ⚙️ Kullanıcı Ayarları
          </h1>
          <p className="text-gray-600 text-lg turkish-text">
            Kişisel tercihlerinizi ayarlayın
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          <div className="space-y-8">
            {/* Sınav Ayarları Bölümü */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 text-white p-2 rounded-xl mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>{" "}
                <h2 className="text-xl font-semibold text-gray-800 turkish-text">
                  Sınav Ayarları
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  {" "}
                  <label
                    htmlFor="newWords"
                    className="block text-sm font-semibold text-gray-700 mb-3 turkish-text"
                  >
                    Sınavda Bir Seferde Gösterilecek Yeni Kelime Sayısı
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="newWords"
                      name="newWords"
                      value={newWordsCount}
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                      className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 pr-12 turkish-text"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-400 text-sm">kelime</span>
                    </div>
                  </div>{" "}
                  <p className="text-sm text-gray-600 mt-2 bg-white/50 rounded-lg p-3 border border-gray-100 turkish-text emoji-fix">
                    💡 Sınavda her yeni kelime istendiğinde kaç adet tamamen
                    yeni kelime getirileceğini belirler (1-50 arası).
                  </p>
                </div>
              </div>
            </div>

            {/* Kullanıcı Bilgileri Bölümü */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-500 text-white p-2 rounded-xl mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>{" "}
                <h2 className="text-xl font-semibold text-gray-800 turkish-text">
                  Kullanıcı Bilgileri
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {" "}
                <div className="bg-white/50 rounded-lg p-4 border border-emerald-100">
                  <p className="text-sm text-gray-600 mb-1 turkish-text">
                    Kullanıcı Adı
                  </p>
                  <p className="font-semibold text-gray-800 turkish-text">
                    {currentUser?.username || "Belirtilmemiş"}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 border border-emerald-100">
                  <p className="text-sm text-gray-600 mb-1 turkish-text">
                    E-posta
                  </p>
                  <p className="font-semibold text-gray-800 turkish-text">
                    {currentUser?.email || "Belirtilmemiş"}
                  </p>
                </div>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none turkish-text emoji-fix"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center turkish-text">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Kaydediliyor...
                  </span>
                ) : (
                  <span className="turkish-text emoji-fix">
                    💾 Ayarları Kaydet
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
