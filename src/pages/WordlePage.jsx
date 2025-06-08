// src/pages/WordlePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function WordlePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(MAX_GUESSES).fill(null));
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState("playing");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [letterStatuses, setLetterStatuses] = useState({});
  // processGuess fonksiyonunu handleKeyPress'ten ÖNCE tanımla
  const processGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || gameState !== "playing") return;

    const newGuesses = [...guesses];
    const guessRow = [];
    const newLetterStatuses = { ...letterStatuses };
    let correctLetters = 0;

    // Her harfi kontrol et ve doğru durum atayın
    for (let i = 0; i < currentGuess.length; i++) {
      const char = currentGuess[i];
      let status = "absent";

      if (targetWord[i] === char) {
        status = "correct";
        newLetterStatuses[char] = "correct";
        correctLetters++;
      } else if (targetWord.includes(char)) {
        status = "present";
        if (newLetterStatuses[char] !== "correct") {
          newLetterStatuses[char] = "present";
        }
      } else {
        newLetterStatuses[char] = "absent";
      }

      guessRow.push({ char, status });
    }

    newGuesses[currentRow] = guessRow;
    setGuesses(newGuesses);
    setLetterStatuses(newLetterStatuses);

    if (correctLetters === WORD_LENGTH && currentGuess === targetWord) {
      setGameState("won");
      setMessage("Tebrikler, kazandınız!");
      return;
    }

    if (currentRow + 1 >= MAX_GUESSES) {
      setGameState("lost");
      setMessage(`Kaybettiniz! Doğru kelime: ${targetWord}`);
      return;
    }

    setCurrentRow((prev) => prev + 1);
    setCurrentGuess("");
    // setMessage(''); // Mesajı burada temizlemek yerine, tahmin girildiğinde temizlenebilir
  }, [
    currentGuess,
    targetWord,
    guesses,
    currentRow,
    letterStatuses,
    gameState,
  ]); // gameState eklendi

  const handleKeyPress = useCallback(
    (key) => {
      if (gameState !== "playing") return;

      if (key === "ENTER") {
        if (currentGuess.length === WORD_LENGTH) {
          processGuess(); // Şimdi processGuess tanımlı
        } else {
          setMessage(`${WORD_LENGTH} harfli bir kelime girmelisiniz.`);
          setTimeout(() => setMessage(""), 2000); // Mesajı 2 saniye sonra temizle
        }
        return;
      }

      if (key === "BACKSPACE" || key === "DELETE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      // Sadece A-Z arası harfleri kabul et (Türkçe karakterler için düzenleme gerekebilir)
      if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/i.test(key)) {
        setCurrentGuess((prev) =>
          (prev + key.toUpperCase()).slice(0, WORD_LENGTH)
        );
        setMessage(""); // Harf girildiğinde mesajı temizle
      }
    },
    [currentGuess, gameState, processGuess]
  ); // processGuess artık burada tanımlı

  const fetchWordleWord = useCallback(async () => {
    // ... (fetchWordleWord fonksiyonu aynı kalacak) ...
    if (!currentUser || !currentUser.id) {
      setMessage("Oyunu oynamak için giriş yapmalısınız.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      console.log(
        "WordlePage: getWordleWord IPC çağrısı yapılıyor, UserID:",
        currentUser.id,
        "Uzunluk:",
        WORD_LENGTH
      );
      const result = await window.electronAPI.getWordleWord({
        userId: currentUser.id,
        wordLength: WORD_LENGTH,
      });
      console.log("WordlePage: IPC getWordleWord sonucu (renderer):", result);

      if (result.success && result.word) {
        initializeGame(result.word.toUpperCase());
      } else {
        setTargetWord("");
        setMessage(
          result.message ||
            `Wordle için ${WORD_LENGTH} harfli uygun kelime bulunamadı.`
        );
      }
    } catch (error) {
      console.error("WordlePage - Wordle kelimesi getirme hatası:", error);
      setTargetWord("");
      setMessage(
        "Wordle kelimesi yüklenirken bir hata oluştu: " + error.message
      );
    }
    setIsLoading(false);
  }, [currentUser]); // initializeGame'i bağımlılıktan çıkardık, çünkü fetchWordleWord içinde çağrılıyor.

  const initializeGame = (newWord) => {
    setTargetWord(newWord || "");
    setGuesses(
      Array(MAX_GUESSES)
        .fill(null)
        .map(() => Array(WORD_LENGTH).fill({ char: "", status: "empty" }))
    ); // Izgara yapısını değiştir
    setCurrentGuess("");
    setCurrentRow(0);
    setGameState("playing");
    setMessage("");
    setLetterStatuses({});
    console.log("Oyun başlatıldı, hedef kelime:", newWord);
  };

  // Fiziksel klavye dinleyicisi
  useEffect(() => {
    const listener = (e) => {
      if (gameState !== "playing") return; // Oyun bittiyse veya başlamadıysa işlem yapma
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (e.key.length === 1 && e.key.match(/^[a-zA-Z]$/)) {
        // Sadece harfleri al
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [handleKeyPress, gameState]); // gameState eklendi

  useEffect(() => {
    if (isAuthenticated) {
      fetchWordleWord();
    } else {
      setMessage("Lütfen Wordle oynamak için giriş yapın.");
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWordleWord]);

  // getTileClass ve getKeyboardKeyClass fonksiyonları aynı kalacak
  // ... (Izgara ve Klavye JSX'i aynı kalacak) ...
  // ... (JSX'in geri kalanı)

  // Izgara ve Klavye JSX'ini de ekleyelim (bir önceki WordlePage kodundan)
  const getTileClass = (charData) => {
    // charData: { char, status }
    if (!charData || charData.status === "empty")
      return "border-gray-300 bg-white";
    if (charData.status === "correct")
      return "bg-green-500 text-white border-green-500 animate-flip";
    if (charData.status === "present")
      return "bg-yellow-500 text-white border-yellow-500 animate-flip";
    if (charData.status === "absent")
      return "bg-gray-500 text-white border-gray-500 animate-flip";
    return "border-gray-300 bg-white";
  };

  const getKeyboardKeyClass = (key) => {
    if (letterStatuses[key] === "correct")
      return "bg-green-500 hover:bg-green-600 text-white";
    if (letterStatuses[key] === "present")
      return "bg-yellow-500 hover:bg-yellow-600 text-white";
    if (letterStatuses[key] === "absent")
      return "bg-gray-600 hover:bg-gray-700 text-white";
    return "bg-gray-200 hover:bg-gray-300 text-gray-800";
  };

  const keyboardRows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "BACKSPACE"],
  ];

  if (!isAuthenticated) {
    return (
      <div className="text-center p-10 text-xl text-gray-700">
        Wordle oynamak için lütfen giriş yapın.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="text-center p-10 text-xl text-gray-600">
        Wordle yükleniyor...
      </div>
    );
  }
  if (
    !targetWord &&
    !isLoading &&
    gameState !== "won" &&
    gameState !== "lost"
  ) {
    return (
      <div className="text-center p-10">
        <p className="text-xl text-red-500">
          {message ||
            `Wordle için ${WORD_LENGTH} harfli uygun kelime bulunamadı.`}
        </p>
        <button
          onClick={fetchWordleWord}
          className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Yeni Kelime İste
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        {" "}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text mb-2 turkish-text emoji-fix">
            🎯 Wordle
          </h1>
          <p className="text-gray-600 text-lg turkish-text">
            Öğrendiğiniz kelimelerle oyun oynayın!
          </p>
        </div>
        {message && (
          <div
            className={`mb-6 px-6 py-4 rounded-2xl text-white text-center font-semibold shadow-lg transform transition-all duration-300 scale-105
                          ${
                            gameState === "won"
                              ? "bg-gradient-to-r from-green-500 to-emerald-600"
                              : gameState === "lost"
                              ? "bg-gradient-to-r from-red-500 to-rose-600"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600"
                          }`}
          >
            {" "}
            <div className="flex items-center justify-center">
              {gameState === "won" && (
                <span className="text-2xl mr-2 emoji-fix">🎉</span>
              )}
              {gameState === "lost" && (
                <span className="text-2xl mr-2 emoji-fix">😔</span>
              )}
              {message}
            </div>
          </div>
        )}
        {/* Oyun Izgarası */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
          <div className="grid grid-rows-6 gap-2 justify-center">
            {guesses.map((guessRow, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-2">
                {Array.from({ length: WORD_LENGTH }).map((_, charIndex) => {
                  // Aktif satırda currentGuess'ı göster, diğerlerinde guessRow'u
                  const charToShow =
                    rowIndex === currentRow
                      ? currentGuess[charIndex]
                      : guessRow && guessRow[charIndex]
                      ? guessRow[charIndex].char
                      : "";
                  // Renklendirme için, gönderilmiş satırlardaki guessRow'u kullan
                  const tileData =
                    (rowIndex < currentRow ||
                      (gameState !== "playing" && rowIndex === currentRow)) &&
                    guessRow &&
                    guessRow[charIndex]
                      ? guessRow[charIndex]
                      : { char: "", status: "empty" };

                  return (
                    <div
                      key={charIndex}
                      className={`w-14 h-14 md:w-16 md:h-16 border-2 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold uppercase transition-all duration-500 shadow-sm
                        ${
                          charToShow
                            ? "border-amber-400 scale-105"
                            : "border-gray-200"
                        }
                        ${getTileClass(tileData)}`}
                      style={{
                        animationDelay: `${charIndex * 100}ms`,
                      }}
                    >
                      {charToShow}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Sanal Klavye */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="space-y-3">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`h-12 md:h-14 rounded-xl font-bold uppercase flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm
                      ${
                        key.length > 1
                          ? "px-3 text-xs flex-none min-w-[60px]"
                          : "text-lg flex-1 max-w-[40px]"
                      }
                      ${getKeyboardKeyClass(key)}
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    disabled={gameState !== "playing"}
                  >
                    {key === "BACKSPACE" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 0 24 24"
                        width="20px"
                        fill="currentColor"
                      >
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
                      </svg>
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        {(gameState === "won" || gameState === "lost") && (
          <div className="text-center mt-8">
            {" "}
            <button
              onClick={fetchWordleWord}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 emoji-fix"
            >
              🎮 Yeni Oyun
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WordlePage;
