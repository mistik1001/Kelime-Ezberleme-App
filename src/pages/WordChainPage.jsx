// src/pages/WordChainPage.jsx
import React, { useState } from "react";

const WORD_COUNT = 5;

function WordChainPage() {
  const [words, setWords] = useState(Array(WORD_COUNT).fill(""));
  const [generatedStory, setGeneratedStory] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedImagePath, setSavedImagePath] = useState("");

  const handleWordChange = (index, value) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleGenerate = async () => {
    const filledWords = words.filter((word) => word.trim() !== "");
    if (filledWords.length === 0) {
      setError("Lütfen en az bir kelime girin.");
      return;
    }

    setIsLoading(true);
    setError("");
    setGeneratedStory("");
    setGeneratedImageUrl("");
    setSavedImagePath("");

    try {
      const result = await window.electronAPI.generateWordChainStory(
        filledWords
      );
      if (result.success) {
        setGeneratedStory(result.story);
        setGeneratedImageUrl(result.imageUrl);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleSaveImage = async () => {
    if (!generatedImageUrl) return;
    try {
      const result = await window.electronAPI.saveImage(generatedImageUrl);
      if (result.success) {
        setSavedImagePath(result.path);
        alert(`Görsel başarıyla kaydedildi: ${result.path}`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {" "}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text mb-4 turkish-text emoji-fix">
            🔗 Word Chain Hikaye Oluşturucu
          </h1>
          <p className="text-gray-600 text-lg turkish-text">
            Kelimelerinizi birleştirerek harika hikayeler oluşturun
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          <div className="text-center mb-8">
            {" "}
            <h2 className="text-2xl font-bold text-gray-800 mb-2 turkish-text emoji-fix">
              🎯 Kelime Zinciri
            </h2>
            <p className="text-gray-600 turkish-text">
              En fazla {WORD_COUNT} kelime girin (en az 1 kelime gerekli)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {words.map((word, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  placeholder={`${index + 1}. kelime`}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-center turkish-text"
                />
                <div className="absolute -top-2 -right-2 bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none turkish-text"
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
                Oluşturuluyor...
              </span>
            ) : (
              <span className="emoji-fix">✨ Hikaye ve Görsel Oluştur</span>
            )}
          </button>

          {error && (
            <div className="mt-6 bg-gradient-to-r from-red-100 to-rose-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl text-center">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2 emoji-fix">❌</span>
                <span className="turkish-text">{error}</span>
              </div>
            </div>
          )}

          {(generatedStory || generatedImageUrl) && !isLoading && (
            <div className="mt-8 space-y-8">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

              {generatedStory && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-amber-500 text-white p-2 rounded-xl mr-3">
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>{" "}
                    </div>{" "}
                    <h3 className="text-xl font-bold text-gray-800 turkish-text emoji-fix">
                      <span className="emoji-fix">📖</span> Oluşturulan Hikaye
                    </h3>
                  </div>
                  <div className="bg-white/70 rounded-xl p-6 shadow-sm border border-amber-100">
                    <p className="text-gray-700 leading-relaxed text-lg turkish-text">
                      {generatedStory}
                    </p>
                  </div>
                </div>
              )}

              {generatedImageUrl && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>{" "}
                    </div>{" "}
                    <h3 className="text-xl font-bold text-gray-800 turkish-text emoji-fix">
                      <span className="emoji-fix">🎨</span> Oluşturulan Görsel
                    </h3>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-white/70 rounded-2xl p-4 shadow-lg border border-blue-100">
                      <img
                        src={generatedImageUrl}
                        alt="Oluşturulan görsel"
                        className="rounded-xl shadow-md max-w-full h-auto max-h-96 mx-auto"
                      />
                    </div>{" "}
                    <button
                      onClick={handleSaveImage}
                      className="mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 turkish-text emoji-fix"
                    >
                      <span className="emoji-fix">💾</span> Görseli Kaydet
                    </button>
                    {savedImagePath && (
                      <div className="mt-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-sm turkish-text emoji-fix">
                        ✓ Kaydedildi: {savedImagePath}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordChainPage;
