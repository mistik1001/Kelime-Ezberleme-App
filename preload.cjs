// preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Kullanıcı İşlemleri
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  loginUser: (credentials) => ipcRenderer.invoke("login-user", credentials),

  // Kelime İşlemleri
  addWord: (wordData) => ipcRenderer.invoke("add-word", wordData),

  // Sınav İşlemleri
  getNextWordForQuiz: (userId) =>
    ipcRenderer.invoke("get-next-word-for-quiz", userId),
  submitQuizAnswer: (answerData) =>
    ipcRenderer.invoke("submit-quiz-answer", answerData),

  // Kullanıcı Ayarları İşlemleri
  getUserSettings: (userId) => ipcRenderer.invoke("get-user-settings", userId),
  saveUserSettings: (settingsData) =>
    ipcRenderer.invoke("save-user-settings", settingsData),

  // Rapor İşlemleri
  getUserLearningStats: (userId) =>
    ipcRenderer.invoke("get-user-learning-stats", userId),

  // Wordle İşlemleri
  getWordleWord: (params) => ipcRenderer.invoke("get-wordle-word", params),

  // LLM İşlemleri (YENİ EKLENDİ)
  generateWordChainStory: (words) =>
    ipcRenderer.invoke("generate-word-chain-story", words),
  saveImage: (imageUrl) => ipcRenderer.invoke("save-image", imageUrl),

  // Dosya Yönetimi (YENİ EKLENDİ)
  copyFileToAppData: (sourcePath) =>
    ipcRenderer.invoke("copy-file-to-app-data", sourcePath),

  // Öğrenilen Kelimeler İşlemleri (YENİ EKLENDİ)
  getLearnedWordsByUser: (params) =>
    ipcRenderer.invoke("get-learned-words-by-user", params),
  markWordAsLearned: (params) =>
    ipcRenderer.invoke("mark-word-as-learned", params),
  getUserWordLearningStatus: (params) =>
    ipcRenderer.invoke("get-user-word-learning-status", params),
  // Test Functions
  testSpacedRepetitionAlgorithm: () =>
    ipcRenderer.invoke("test-spaced-repetition-algorithm"),
  clearUserSession: (userId) =>
    ipcRenderer.invoke("clear-user-session", userId),
});
