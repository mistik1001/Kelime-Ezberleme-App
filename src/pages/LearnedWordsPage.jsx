// src/pages/LearnedWordsPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function LearnedWordsPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [learnedWords, setLearnedWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showWordDetail, setShowWordDetail] = useState(false);
  const wordsPerPage = 20;

  const fetchLearnedWords = async (page = 0, append = false) => {
    if (!currentUser || !currentUser.id) {
      setError("Kullanıcı bilgisi bulunamadı.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await window.electronAPI.getLearnedWordsByUser({
        userId: currentUser.id,
        limit: wordsPerPage,
        offset: page * wordsPerPage,
      });

      if (result.success && result.words) {
        if (append) {
          setLearnedWords((prev) => [...prev, ...result.words]);
        } else {
          setLearnedWords(result.words);
        }

        // Eğer dönen kelime sayısı wordsPerPage'den azsa, daha fazla veri yok demektir
        setHasMore(result.words.length === wordsPerPage);
        setCurrentPage(page);
      } else {
        setError(
          result.message || "Öğrenilen kelimeler yüklenirken bir hata oluştu."
        );
      }
    } catch (err) {
      console.error("LearnedWordsPage - Kelime getirme hatası:", err);
      setError("Kelimeler yüklenirken bir sorun oluştu: " + err.message);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id) {
      fetchLearnedWords();
    } else if (!isAuthenticated) {
      setError("Öğrenilen kelimeleri görmek için lütfen giriş yapınız.");
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  const loadMoreWords = () => {
    if (hasMore && !isLoading) {
      fetchLearnedWords(currentPage + 1, true);
    }
  };

  const handleWordClick = async (word) => {
    setSelectedWord(word);
    setShowWordDetail(true);

    // Kelime detay bilgilerini getir
    try {
      const result = await window.electronAPI.getUserWordLearningStatus({
        userId: currentUser.id,
        wordId: word.WordID,
      });

      if (result.success && result.status) {
        setSelectedWord({ ...word, ...result.status });
      }
    } catch (err) {
      console.error("Kelime detayı getirilemedi:", err);
    }
  };

  const handleMarkAsUnlearned = async (wordId) => {
    try {
      const result = await window.electronAPI.markWordAsLearned({
        userId: currentUser.id,
        wordId: wordId,
        isLearned: false,
      });

      if (result.success) {
        // Kelimeyi listeden kaldır
        setLearnedWords((prev) =>
          prev.filter((word) => word.WordID !== wordId)
        );
        setShowWordDetail(false);
        setSelectedWord(null);
      } else {
        setError(
          result.message ||
            "Kelime işaretleme durumu güncellenirken bir hata oluştu."
        );
      }
    } catch (err) {
      console.error("Kelime işaretleme hatası:", err);
      setError("Kelime durumu güncellenirken bir sorun oluştu: " + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Giriş Gerekli
          </h2>
          <p className="text-lg text-gray-600">
            Öğrenilen kelimeleri görmek için lütfen giriş yapınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {" "}
        <div className="text-center mb-8">
          {" "}
          <h1 className="text-4xl font-bold mb-2 turkish-text emoji-fix">
            🎯 Öğrenilen Kelimeler
          </h1>
          <p className="text-gray-600 text-lg turkish-text">
            Başarıyla öğrendiğiniz kelimeleri gözden geçirin
          </p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}
        {isLoading && learnedWords.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⚡</div>
            <p className="text-xl text-gray-600">
              Öğrenilen kelimeler yükleniyor...
            </p>
          </div>
        ) : learnedWords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Henüz Öğrenilen Kelime Yok
            </h2>
            <p className="text-lg text-gray-600">
              Sınav modülünü kullanarak kelime öğrenmeye başlayın!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {learnedWords.map((word) => (
                <div
                  key={word.WordID}
                  onClick={() => handleWordClick(word)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 cursor-pointer hover:scale-105 transform transition-all duration-200 hover:shadow-2xl"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {word.EngWordName}
                    </h3>
                    <p className="text-lg text-emerald-600 font-semibold mb-3">
                      {word.TurWordName}
                    </p>
                    <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                        Seviye {word.RepetitionLevel}
                      </span>{" "}
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {word.TotalCorrectAnswers || word.CorrectStreak} doğru
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreWords}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </button>
              </div>
            )}
          </>
        )}
        {/* Kelime Detay Modal */}
        {showWordDetail && selectedWord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      {selectedWord.EngWordName}
                    </h2>
                    <p className="text-xl text-emerald-600 font-semibold">
                      {selectedWord.TurWordName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWordDetail(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Öğrenme Seviyesi</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {selectedWord.RepetitionLevel}
                      </p>
                    </div>{" "}
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">
                        Doğru Cevap Sayısı
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedWord.TotalCorrectAnswers ||
                          selectedWord.CorrectStreak}
                      </p>
                    </div>
                  </div>

                  {selectedWord.LearningStatus && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Durum</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedWord.LearningStatus}
                      </p>
                    </div>
                  )}

                  {selectedWord.LastTestedDate && (
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Son Test Tarihi</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {new Date(
                          selectedWord.LastTestedDate
                        ).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowWordDetail(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={() => handleMarkAsUnlearned(selectedWord.WordID)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    Öğrenilmedi İşaretle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnedWordsPage;
