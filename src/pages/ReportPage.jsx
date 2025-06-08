// src/pages/ReportPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Kullanıcı ID'si için

function ReportPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser && currentUser.id) {
        setIsLoading(true);
        setError("");
        try {
          console.log(
            "ReportPage: getUserLearningStats IPC çağrısı yapılıyor, UserID:",
            currentUser.id
          );
          const result = await window.electronAPI.getUserLearningStats(
            currentUser.id
          );
          console.log(
            "ReportPage: IPC getUserLearningStats sonucu (renderer):",
            result
          );

          if (result.success && result.stats) {
            setStats(result.stats);
          } else {
            setError(
              result.message || "İstatistikler yüklenirken bir hata oluştu."
            );
          }
        } catch (err) {
          console.error("ReportPage - İstatistik getirme hatası:", err);
          setError(
            err.message || "İstatistikler yüklenirken bir sorun oluştu."
          );
        }
        setIsLoading(false);
      } else if (isAuthenticated && (!currentUser || !currentUser.id)) {
        setError("İstatistikleri yüklemek için kullanıcı bilgileri alınamadı.");
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, isAuthenticated]);

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Giriş Gerekli
          </h2>
          <p className="text-lg text-gray-600">
            Raporları görmek için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Yükleniyor...
          </h2>
          <p className="text-lg text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hata Oluştu</h2>
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Veri Bulunamadı
          </h2>
          <p className="text-lg text-gray-600">İstatistik verisi bulunamadı.</p>
        </div>
      </div>
    );
  }

  // Basit bir yüzde hesaplama
  const learnedPercentage =
    stats.totalWordsInSystem > 0
      ? ((stats.learnedByCurrentUser / stats.totalWordsInSystem) * 100).toFixed(
          1
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {" "}
          <div className="text-center md:text-left">
            {" "}
            <h1 className="text-4xl font-bold mb-2 turkish-text emoji-fix">
              📊 Öğrenme Analiz Raporu
            </h1>
            <p className="text-gray-600 text-lg turkish-text">
              İlerleme durumunuzu takip edin
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg print:hidden"
          >
            🖨️ Yazdır
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Toplam Kelime */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Toplam Kelime
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalWordsInSystem}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Öğrenilen Kelime */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Öğrenilen</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.learnedByCurrentUser}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Öğrenilmekte Olan */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devam Eden</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.inProgressByCurrentUser}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Henüz Başlanmamış */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-3xl font-bold text-gray-600">
                  {stats.notYetStudiedByCurrentUser}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Genel İlerleme
            </h2>
            <p className="text-gray-600">
              Toplam kelimelerin {learnedPercentage}%'ini öğrendiniz
            </p>
          </div>

          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${learnedPercentage}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600">
                {learnedPercentage}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="text-center bg-white/60 rounded-xl p-4 border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {stats.learnedByCurrentUser}
              </div>
              <div className="text-sm text-gray-600">Öğrenildi</div>
            </div>
            <div className="text-center bg-white/60 rounded-xl p-4 border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">
                {stats.inProgressByCurrentUser}
              </div>
              <div className="text-sm text-gray-600">Devam Eden</div>
            </div>
            <div className="text-center bg-white/60 rounded-xl p-4 border border-blue-100">
              <div className="text-2xl font-bold text-gray-600">
                {stats.totalWordsInSystem - stats.learnedByCurrentUser}
              </div>
              <div className="text-sm text-gray-600">Kalan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
