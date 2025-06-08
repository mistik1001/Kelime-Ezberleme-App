// src/pages/SinavPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

function SinavPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentWord, setCurrentWord] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const audioRef = useRef(null);

  const fetchNextWord = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
      setFeedback("Sınava devam etmek için kullanıcı bilgisi gerekli.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFeedback("");
    setUserAnswer("");
    setShowAnswer(false);
    setIsCorrectAnswer(false);

    try {
      console.log(
        "SinavPage: getNextWordForQuiz IPC çağrısı yapılıyor, UserID:",
        currentUser.id
      );
      const result = await window.electronAPI.getNextWordForQuiz(
        currentUser.id
      );
      console.log(
        "SinavPage: IPC getNextWordForQuiz sonucu (renderer):",
        result
      );

      if (result.success) {
        if (result.word) {
          setCurrentWord(result.word);
        } else {
          setCurrentWord(null);
          setFeedback(
            result.message ||
              "Tebrikler! Şimdilik test edilecek başka kelime yok."
          );
        }
      } else {
        setCurrentWord(null);
        setFeedback(result.message || "Kelime yüklenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("SinavPage - Kelime getirme hatası:", error);
      setCurrentWord(null);
      setFeedback("Kelime yüklenirken bir hata oluştu: " + error.message);
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id) {
      fetchNextWord();
    } else if (!isAuthenticated) {
      setCurrentWord(null);
      setFeedback("Sınav modülünü kullanabilmek için lütfen giriş yapınız.");
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, fetchNextWord]);

  const handleAnswerSubmit = async (event) => {
    event.preventDefault();
    if (!currentWord || !userAnswer.trim() || !currentUser || !currentUser.id)
      return;

    const isCorrect =
      userAnswer.trim().toLowerCase() === currentWord.TurWordName.toLowerCase();
    setIsCorrectAnswer(isCorrect);
    if (isCorrect) {
      setFeedback("Doğru!");
      setScore((prevScore) => prevScore + 1);
    } else {
      setFeedback(`Yanlış! Doğru cevap: ${currentWord.TurWordName}`);
    }
    setShowAnswer(true);

    try {
      console.log(
        `SinavPage: submitQuizAnswer IPC çağrısı: UserID: ${currentUser.id}, WordID: ${currentWord.WordID}, Doğru mu: ${isCorrect}`
      );
      const result = await window.electronAPI.submitQuizAnswer({
        userId: currentUser.id,
        wordId: currentWord.WordID,
        isCorrect,
      });
      console.log("SinavPage: IPC submitQuizAnswer sonucu (renderer):", result);
      if (result.success && result.updatedProgress) {
        const progress = result.updatedProgress;

        // Daha detaylı ilerleme bilgisi göster
        let progressInfo = "";
        if (progress.newIsKnown) {
          progressInfo = "🎉 KELİME TAMAMEN ÖĞRENİLDİ! (6/6 seviye tamamlandı)";
        } else {
          const currentLevel = progress.newLevel;
          const currentStreak = progress.newStreak;
          const nextTestDate = progress.newNextTestDate
            ? new Date(progress.newNextTestDate).toLocaleDateString("tr-TR")
            : "Belirsiz";

          // Seviye açıklamaları
          const levelDescriptions = [
            "Yeni Kelime",
            "1 Gün Sonra",
            "1 Hafta Sonra",
            "1 Ay Sonra",
            "3 Ay Sonra",
            "6 Ay Sonra",
          ];

          const currentLevelDesc =
            levelDescriptions[currentLevel] || `Seviye ${currentLevel}`;

          progressInfo = `
📊 Seviye: ${currentLevel + 1}/6 (${currentLevelDesc})
🎯 Bu Seviyede: ${currentStreak}/6 doğru cevap
📅 Sonraki Test: ${nextTestDate}
          `.trim();
        }

        setFeedback((prev) => prev + "\n\n" + progressInfo);
      }

      if (!result.success) {
        console.warn("Kelime ilerlemesi güncellenirken hata:", result.message);
      }
    } catch (error) {
      console.error("SinavPage - Cevap gönderme hatası:", error);
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((e) => console.error("Ses çalma hatası:", e));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {" "}
          <div className="text-6xl mb-4 emoji-fix">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 turkish-text">
            Giriş Gerekli
          </h2>
          <p className="text-lg text-gray-600 turkish-text">
            Sınav modülünü kullanabilmek için lütfen giriş yapınız.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {" "}
          <div className="animate-spin text-6xl mb-4 emoji-fix">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 turkish-text">
            Sınav Hazırlanıyor
          </h2>
          <p className="text-lg text-gray-600 turkish-text">
            Lütfen bekleyin...
          </p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {" "}
          <div className="text-6xl mb-4 emoji-fix">🎯</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 turkish-text">
            Tebrikler!
          </h2>
          <p className="text-lg text-gray-600 mb-6 turkish-text">
            {feedback ||
              "Test edilecek kelime bulunamadı veya tüm kelimeler öğrenildi."}
          </p>
          <button
            onClick={fetchNextWord}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 turkish-text emoji-fix"
          >
            🔄 Yeni Kelime Getir
          </button>
        </div>
      </div>
    );
  }

  const pictureUrl = currentWord.Picture
    ? `app-media://${currentWord.Picture}`
    : null;
  const soundUrl = currentWord.Sound
    ? `app-media://${currentWord.Sound}`
    : null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          {" "}
          <div className="text-center mb-8">
            {" "}
            <h1 className="text-4xl font-bold mb-4 turkish-text emoji-fix">
              🎯 Sınav Modülü
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg turkish-text emoji-fix">
                <span className="mr-2">📊 Skor:</span>
                <span className="text-xl">{score}</span>
              </div>
            </div>
          </div>
          <div className="text-center mb-8">
            {pictureUrl && (
              <div className="mb-8">
                <div className="relative inline-block">
                  <img
                    src={pictureUrl}
                    alt={currentWord.EngWordName}
                    className="max-w-full h-auto max-h-64 mx-auto rounded-2xl shadow-lg border-4 border-white/50"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>
              </div>
            )}{" "}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-2xl mb-6 border border-indigo-200">
              {" "}
              <h2 className="text-5xl md:text-6xl font-bold text-indigo-700 break-all turkish-text">
                {currentWord.EngWordName}
              </h2>
            </div>{" "}
            {soundUrl && (
              <div className="flex justify-center">
                <audio ref={audioRef} src={soundUrl} preload="auto" />
                <button
                  type="button"
                  onClick={playSound}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Kelimeyi dinle"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="currentColor"
                  >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
              </div>
            )}
          </div>{" "}
          <form onSubmit={handleAnswerSubmit} className="space-y-6">
            <div>
              {" "}
              <label
                htmlFor="userAnswer"
                className="block text-gray-700 text-sm font-bold mb-3 turkish-text emoji-fix"
              >
                🇹🇷 Türkçe Karşılığı:
              </label>
              <input
                type="text"
                id="userAnswer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full px-4 py-4 bg-white/60 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-lg turkish-text"
                placeholder="Cevabınızı yazın..."
                disabled={showAnswer}
                required
                autoFocus
              />
            </div>

            {!showAnswer ? (
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] turkish-text emoji-fix"
              >
                ✓ Cevapla
              </button>
            ) : (
              <button
                onClick={fetchNextWord}
                type="button"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] turkish-text emoji-fix"
              >
                ➡️ Sonraki Kelime
              </button>
            )}
          </form>
          {showAnswer && feedback && (
            <div
              className={`mt-8 p-6 rounded-xl text-center text-lg font-semibold shadow-lg ${
                isCorrectAnswer
                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300"
                  : "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-300"
              }`}
            >
              {" "}
              <div className="flex items-center justify-center mb-2">
                {isCorrectAnswer ? (
                  <span className="text-2xl mr-2 emoji-fix">🎉</span>
                ) : (
                  <span className="text-2xl mr-2 emoji-fix">❌</span>
                )}
              </div>
              <span className="turkish-text">{feedback}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SinavPage;
