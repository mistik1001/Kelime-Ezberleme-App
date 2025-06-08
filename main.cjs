// main.cjs (Hata ayıklama için console.log eklenmiş hali)

console.log("-> main.cjs dosyası çalışmaya başladı."); // <-- EKLENDİ 1

const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const path = require("path");
const fs = require("fs"); // Dosya kaydetme işlemleri için

// Enhanced environment loading for both development and production
function loadEnvironmentVariables() {
  try {
    // Try to load .env file using dotenv
    require("dotenv").config();

    // In packaged app, also try to load from app directory
    if (app.isPackaged) {
      const envPath = path.join(process.resourcesPath, ".env");
      if (fs.existsSync(envPath)) {
        require("dotenv").config({ path: envPath });
      }

      // Alternative: try to load from app.getPath('userData')
      const userDataEnvPath = path.join(app.getPath("userData"), ".env");
      if (fs.existsSync(userDataEnvPath)) {
        require("dotenv").config({ path: userDataEnvPath });
      }
    }

    // Fallback: set API key directly if not found in environment
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found in environment, using fallback");
      // You can set your API key directly here as a fallback
      process.env.GEMINI_API_KEY = "AIzaSyC97aqbARII-53VzMSQy9iaAN2ulnW_sYw";
    }
  } catch (error) {
    console.error("Error loading environment variables:", error);
    // Set fallback API key
    process.env.GEMINI_API_KEY = "AIzaSyC97aqbARII-53VzMSQy9iaAN2ulnW_sYw";
  }
}

// Load environment variables before anything else
loadEnvironmentVariables();

const db = require("./src/db/electron-db.cjs");
const bcrypt = require("bcryptjs");
const llmService = require("./src/services/llm-service.cjs"); // YENİ EKLENDİ
const fetch = require("node-fetch"); // gerekirse

// Ensure UTF-8 encoding for proper Turkish character support
process.env.NODE_ENV = process.env.NODE_ENV || "development";
if (process.platform === "win32") {
  // Set UTF-8 code page on Windows for proper character encoding
  process.env.CHCP = "65001";
}

// Geliştirme sunucusu URL'si (Vite'ın varsayılan portu)
const VITE_DEV_SERVER_URL = "http://localhost:5173";
const isDev = !app.isPackaged;

function createWindow() {
  console.log("-> createWindow fonksiyonu çağrıldı."); // <-- EKLENDİ 2
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), // preload.cjs dosyanızın doğru yolu
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Ensure proper character encoding
      charset: "utf-8",
    },
  });

  // Set proper character encoding for web contents
  mainWindow.webContents.setUserAgent(
    mainWindow.webContents.getUserAgent() + " charset=utf-8"
  );

  console.log("-> Pencere nesnesi oluşturuldu."); // <-- EKLENDİ 3

  if (isDev) {
    console.log(`-> Vite sunucusu yükleniyor: ${VITE_DEV_SERVER_URL}`); // <-- EKLENDİ 4
    mainWindow
      .loadURL(VITE_DEV_SERVER_URL)
      .then(() => {
        console.log("-> Vite sunucusu BAŞARIYLA yüklendi."); // <-- EKLENDİ 5
      })
      .catch((err) => {
        console.error(
          "HATA: Vite dev sunucusuna bağlanılamadı. Lütfen `npm run dev` komutunun ayrı bir terminalde çalıştığından emin olun.",
          err
        );
      });
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    console.log(`Üretim modunda dosya yükleniyor: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  console.log("-> app.whenReady() bloğuna girildi."); // <-- EKLENDİ 6

  // YENİ EKLENDİ: Renderer'ın medya dosyalarına güvenli erişimi için özel protokol
  protocol.registerFileProtocol("app-media", (request, callback) => {
    const url = request.url.substr("app-media://".length);
    const filePath = path.join(app.getPath("userData"), "media", url);
    callback({ path: path.normalize(filePath) });
  });

  try {
    console.log("-> Veritabanı başlatılıyor..."); // <-- EKLENDİ 7
    db.initializeDatabase(app.getPath("userData"));
    console.log("-> Veritabanı başarıyla başlatıldı."); // <-- EKLENDİ 8
  } catch (error) {
    console.error("HATA: Veritabanı başlatılırken çöktü!", error);
    // Veritabanı olmadan uygulama başlamamalı
    app.quit();
    return; // Fonksiyondan çık
  }

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async function () {
  // async eklendi
  if (process.platform !== "darwin") {
    try {
      console.log("Veritabanı bağlantısı kapatılıyor...");
      await db.closeDatabase(); // await eklendi
      console.log("Veritabanı bağlantısı kapatıldı.");
    } catch (error) {
      console.error("Veritabanı kapatılırken hata oluştu:", error);
    } finally {
      app.quit();
    }
  }
});

// --- DİĞER TÜM IPC HANDLER'LARINIZ BURADA DEVAM EDİYOR ---
// (Bu kısımlarda bir değişiklik yapılmadı)

// IPC Handler: Kullanıcı Kayıt İsteği
ipcMain.handle("register-user", async (event, userData) => {
  console.log("Ana işlemde 'register-user' isteği alındı:", userData.username);
  try {
    const newUser = await db.addUser(userData);
    console.log("Yeni kullanıcı veritabanına eklendi:", newUser);
    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        newWordsPerQuiz: newUser.newWordsPerQuiz,
      },
    }; // newWordsPerQuiz eklendi
  } catch (error) {
    console.error("IPC register-user ana işlem hatası:", error.message);
    return {
      success: false,
      message: error.message || "Kayıt sırasında bir hata oluştu.",
    };
  }
});

// IPC Handler: Kullanıcı Giriş İsteği
ipcMain.handle("login-user", async (event, credentials) => {
  console.log(
    "Ana işlemde 'login-user' isteği alındı, Kullanıcı Adı:",
    credentials.username
  );
  try {
    const userFromDb = await db.getUserByUsername(credentials.username);
    if (!userFromDb) {
      return { success: false, message: "Kullanıcı bulunamadı." };
    }
    const passwordIsValid = bcrypt.compareSync(
      credentials.password,
      userFromDb.Password
    );
    if (!passwordIsValid) {
      return { success: false, message: "Yanlış şifre." };
    }
    console.log(`Kullanıcı başarıyla giriş yaptı: ${credentials.username}`);
    return {
      success: true,
      user: {
        // Şifre hariç tüm kullanıcı bilgilerini ve ayarlarını döndür
        id: userFromDb.UserID,
        username: userFromDb.UserName,
        email: userFromDb.Email,
        newWordsPerQuiz: userFromDb.NewWordsPerQuiz, // Ayarı da döndür
      },
    };
  } catch (error) {
    console.error("IPC login-user ana işlem hatası:", error.message);
    return {
      success: false,
      message: error.message || "Giriş sırasında bir hata oluştu.",
    };
  }
});

// IPC Handler: Kelime Ekleme İsteği
ipcMain.handle("add-word", async (event, wordData) => {
  console.log(
    "Ana işlemde 'add-word' isteği alındı, İngilizce Kelime:",
    wordData.engWord
  );
  try {
    const { sentences, ...mainWordData } = wordData;
    const newWord = await db.addWord(mainWordData);
    if (newWord && newWord.id && sentences && sentences.length > 0) {
      for (const sentence of sentences) {
        if (sentence && sentence.trim() !== "") {
          await db.addWordSample({
            wordId: newWord.id,
            sentence: sentence.trim(),
          });
        }
      }
    }
    return { success: true, word: newWord };
  } catch (error) {
    console.error("IPC add-word ana işlem hatası:", error.message);
    return {
      success: false,
      message: error.message || "Kelime eklenirken bir hata oluştu.",
    };
  }
});

// User session tracking for preventing consecutive words
const userSessions = new Map(); // userId -> { lastShownWordId, timestamp }

// Clean up old user sessions (older than 4 hours)
function cleanupOldSessions() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  for (const [userId, session] of userSessions.entries()) {
    if (new Date(session.timestamp) < fourHoursAgo) {
      userSessions.delete(userId);
      console.log(`🧹 Cleaned up old session for user ${userId}`);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldSessions, 30 * 60 * 1000);

// Clear session when user answers a word (to allow immediate repeat if needed)
function clearUserSession(userId) {
  if (userSessions.has(userId)) {
    userSessions.delete(userId);
    console.log(`✨ Cleared session for user ${userId}`);
  }
}

// IPC Handler: Sınav için bir sonraki kelimeyi getir
ipcMain.handle("get-next-word-for-quiz", async (event, userId) => {
  console.log(
    `🎯 Ana işlemde 'get-next-word-for-quiz' isteği alındı, UserID: ${userId}`
  );
  try {
    const userSettings = db.getUserSettings(userId);
    const newWordsCount = userSettings ? userSettings.NewWordsPerQuiz : 10; // Varsayılan 10

    // Get last shown word from session tracking
    const userSession = userSessions.get(userId);
    const lastShownWordId = userSession ? userSession.lastShownWordId : null;

    console.log(
      `📝 Session Info: LastWordID=${lastShownWordId}, SessionAge=${
        userSession
          ? new Date().getTime() - new Date(userSession.timestamp).getTime()
          : 0
      }ms`
    );

    const word = db.getNextWordForUser(userId, newWordsCount, lastShownWordId);
    if (word) {
      // Update session tracking with new word
      userSessions.set(userId, {
        lastShownWordId: word.WordID,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `✅ Returning word: ${word.EngWordName} (ID: ${word.WordID})`
      );
      return { success: true, word };
    } else {
      console.log(`❌ No suitable word found for user ${userId}`);
      return {
        success: true,
        word: null,
        message: "Test edilecek uygun kelime bulunamadı.",
      };
    }
  } catch (error) {
    console.error(
      "IPC get-next-word-for-quiz ana işlem hatası:",
      error.message
    );
    return {
      success: false,
      message: error.message || "Sınav kelimesi getirilirken bir hata oluştu.",
    };
  }
});

// IPC Handler: Sınav cevabını kaydet ve ilerlemeyi güncelle
ipcMain.handle(
  "submit-quiz-answer",
  async (event, { userId, wordId, isCorrect }) => {
    console.log(
      `Ana işlemde 'submit-quiz-answer' isteği alındı: UserID: ${userId}, WordID: ${wordId}, Doğru mu: ${isCorrect}`
    );
    try {
      const result = db.updateUserWordProgress({
        userId,
        wordId,
        isCorrect,
      });

      // DON'T clear session here - let it persist to prevent immediate repetition
      // Session will be cleared when getting next word or after timeout

      return { success: true, ...result };
    } catch (error) {
      console.error("IPC submit-quiz-answer ana işlem hatası:", error.message);
      return {
        success: false,
        message: error.message || "Sınav cevabı kaydedilirken bir hata oluştu.",
      };
    }
  }
);

// YENİ EKLENEN IPC HANDLER'LARI: Kullanıcı Ayarları İçin
// IPC Handler: Kullanıcı ayarlarını getir
ipcMain.handle("get-user-settings", async (event, userId) => {
  console.log(
    `Ana işlemde 'get-user-settings' isteği alındı, UserID: ${userId}`
  );
  try {
    if (userId === undefined || userId === null) {
      throw new Error("Kullanıcı ID'si sağlanmadı.");
    }
    const settings = await db.getUserSettings(userId);
    if (settings) {
      return { success: true, settings };
    } else {
      return { success: false, message: "Kullanıcı ayarları bulunamadı." };
    }
  } catch (error) {
    console.error("IPC get-user-settings ana işlem hatası:", error.message);
    return {
      success: false,
      message:
        error.message || "Kullanıcı ayarları getirilirken bir hata oluştu.",
    };
  }
});

// IPC Handler: Kullanıcı ayarlarını kaydet
ipcMain.handle("save-user-settings", async (event, { userId, settings }) => {
  console.log(
    `Ana işlemde 'save-user-settings' isteği alındı, UserID: ${userId}, Ayarlar:`,
    settings
  );
  try {
    if (
      userId === undefined ||
      userId === null ||
      !settings ||
      typeof settings.newWordsPerQuiz === "undefined"
    ) {
      throw new Error(
        "Eksik veya geçersiz parametreler: userId ve settings.newWordsPerQuiz gereklidir."
      );
    }
    const result = await db.updateUserSettings({ userId, settings });
    return { success: true, ...result };
  } catch (error) {
    console.error("IPC save-user-settings ana işlem hatası:", error.message);
    return {
      success: false,
      message:
        error.message || "Kullanıcı ayarları kaydedilirken bir hata oluştu.",
    };
  }
});
// YENİ EKLENEN IPC HANDLER: Kullanıcı Öğrenme İstatistiklerini Getir
ipcMain.handle("get-user-learning-stats", async (event, userId) => {
  console.log(
    `Ana işlemde 'get-user-learning-stats' isteği alındı, UserID: ${userId}`
  );
  try {
    if (userId === undefined || userId === null) {
      throw new Error("Kullanıcı ID'si sağlanmadı.");
    }
    const stats = await db.getUserLearningStats(userId);
    if (stats) {
      return { success: true, stats };
    } else {
      // Bu durum genellikle db.getUserLearningStats içinde bir hata oluşursa veya boş bir obje dönerse olur.
      // db.getUserLearningStats zaten bir obje döndürmeli, hata durumunda catch'e düşer.
      return {
        success: false,
        message: "Kullanıcı öğrenme istatistikleri alınamadı.",
      };
    }
  } catch (error) {
    console.error(
      "IPC get-user-learning-stats ana işlem hatası:",
      error.message
    );
    return {
      success: false,
      message:
        error.message ||
        "Kullanıcı istatistikleri getirilirken bir hata oluştu.",
    };
  }
});
// YENİ EKLENEN IPC HANDLER: Wordle Oyunu İçin Kelime Getir
ipcMain.handle("get-wordle-word", async (event, { userId, wordLength }) => {
  console.log(
    `Ana işlemde 'get-wordle-word' isteği alındı, UserID: ${userId}, İstenen Uzunluk: ${wordLength}`
  );
  try {
    if (userId === undefined || userId === null) {
      throw new Error("Kullanıcı ID'si sağlanmadı.");
    }
    const wordInfo = await db.getWordleWord(userId, wordLength || 5); // wordLength tanımsızsa varsayılan 5
    if (wordInfo && wordInfo.engWord) {
      console.log("Wordle için kelime bulundu:", wordInfo.engWord);
      return { success: true, word: wordInfo.engWord.toUpperCase() }; // Kelimeyi büyük harfe çevirerek gönderelim
    } else {
      console.log(
        `Wordle için uygun kelime (uzunluk: ${
          wordLength || 5
        }) bulunamadı, UserID: ${userId}`
      );
      return {
        success: false,
        word: null,
        message: `Wordle için ${
          wordLength || 5
        } harfli uygun kelime bulunamadı.`,
      };
    }
  } catch (error) {
    console.error("IPC get-wordle-word ana işlem hatası:", error.message);
    return {
      success: false,
      message: error.message || "Wordle kelimesi getirilirken bir hata oluştu.",
    };
  }
});

// GÜNCELLENMİŞ IPC HANDLER: Word Chain Hikaye ve Görsel Oluşturma
ipcMain.handle("generate-word-chain-story", async (event, words) => {
  console.log(
    `Ana işlemde 'generate-word-chain-story' isteği alındı, Kelimeler:`,
    words
  );
  try {
    // 1. Hikayeyi oluştur
    const story = await llmService.generateStoryFromWords(words);

    // 2. Hikayeden bir görsel prompt'u oluştur (kısa ve öz)
    const imagePrompt = `Fantastik, dijital sanat, sinematik: ${story.slice(
      0,
      200
    )}`;

    // 3. Prompt'u kullanarak gerçek bir görsel üret
    const base64Image = await llmService.generateImageFromPrompt(imagePrompt);

    // 4. Görseli data URI formatına çevirerek renderer'a gönder
    const imageDataUri = `data:image/png;base64,${base64Image}`;

    return { success: true, story, imageUrl: imageDataUri };
  } catch (error) {
    console.error(
      "IPC generate-word-chain-story ana işlem hatası:",
      error.message
    );
    return {
      success: false,
      message:
        error.message || "Hikaye ve görsel oluşturulurken bir hata oluştu.",
    };
  }
});

// GÜNCELLENMİŞ IPC HANDLER: Görseli Kaydetme
ipcMain.handle("save-image", async (event, imageDataUri) => {
  // Bu fonksiyon artık bir URL değil, base64 data URI alacak.
  console.log(`Ana işlemde 'save-image' isteği alındı.`);
  try {
    // Data URI'dan base64 verisini ve formatı ayır
    const matches = imageDataUri.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Geçersiz resim data URI formatı.");
    }
    const imageType = matches[1]; // png, jpeg etc.
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const picturesPath = path.join(
      app.getPath("pictures"),
      "KelimeEzberlemeApp"
    );
    if (!fs.existsSync(picturesPath)) {
      fs.mkdirSync(picturesPath, { recursive: true });
    }
    const fileName = `word-chain-${Date.now()}.${imageType}`;
    const filePath = path.join(picturesPath, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`Görsel başarıyla kaydedildi: ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error("IPC save-image ana işlem hatası:", error.message);
    return { success: false, message: "Görsel kaydedilirken bir hata oluştu." };
  }
});

// YENİ EKLENEN IPC HANDLER: Dosyayı Uygulama Veri Klasörüne Kopyalama
ipcMain.handle("copy-file-to-app-data", async (event, sourcePath) => {
  if (!sourcePath) {
    return { success: false, message: "Kaynak dosya yolu sağlanmadı." };
  }
  try {
    // 1. Uygulamanın userData klasörü içinde bir 'media' klasörü oluştur (eğer yoksa)
    const mediaDir = path.join(app.getPath("userData"), "media");
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
      console.log(`Media klasörü oluşturuldu: ${mediaDir}`);
    }

    // 2. Çakışmaları önlemek için yeni, benzersiz bir dosya adı oluştur
    const originalExtension = path.extname(sourcePath); // Orijinal dosya uzantısını al (örn: .jpg)
    const newFileName = `${Date.now()}${originalExtension}`;
    const destinationPath = path.join(mediaDir, newFileName);

    // 3. Dosyayı kopyala
    fs.copyFileSync(sourcePath, destinationPath);

    console.log(`Dosya kopyalandı: ${sourcePath} -> ${destinationPath}`);

    // 4. Yeni dosya adını renderer işlemine geri döndür
    return { success: true, fileName: newFileName };
  } catch (error) {
    console.error("Dosya kopyalama hatası:", error.message);
    return { success: false, message: "Dosya kopyalanırken bir hata oluştu." };
  }
});

// YENİ EKLENEN IPC HANDLER'LARI: Öğrenilen Kelimeler İçin

// IPC Handler: Kullanıcının öğrendiği kelimeleri getir
ipcMain.handle(
  "get-learned-words-by-user",
  async (event, { userId, limit, offset }) => {
    console.log(
      `Ana işlemde 'get-learned-words-by-user' isteği alındı, UserID: ${userId}, Limit: ${limit}, Offset: ${offset}`
    );
    try {
      if (userId === undefined || userId === null) {
        throw new Error("Kullanıcı ID'si sağlanmadı.");
      }
      const learnedWords = await db.getLearnedWordsByUser(
        userId,
        limit,
        offset
      );
      return { success: true, words: learnedWords };
    } catch (error) {
      console.error(
        "IPC get-learned-words-by-user ana işlem hatası:",
        error.message
      );
      return {
        success: false,
        message:
          error.message || "Öğrenilen kelimeler getirilirken bir hata oluştu.",
      };
    }
  }
);

// IPC Handler: Kelimeyi öğrenildi olarak işaretle
ipcMain.handle(
  "mark-word-as-learned",
  async (event, { userId, wordId, isLearned }) => {
    console.log(
      `Ana işlemde 'mark-word-as-learned' isteği alındı, UserID: ${userId}, WordID: ${wordId}, IsLearned: ${isLearned}`
    );
    try {
      if (
        userId === undefined ||
        userId === null ||
        wordId === undefined ||
        wordId === null
      ) {
        throw new Error("Kullanıcı ID'si ve Kelime ID'si gereklidir.");
      }
      const result = await db.markWordAsLearned(userId, wordId, isLearned);
      return { success: true, ...result };
    } catch (error) {
      console.error(
        "IPC mark-word-as-learned ana işlem hatası:",
        error.message
      );
      return {
        success: false,
        message:
          error.message ||
          "Kelime öğrenme durumu güncellenirken bir hata oluştu.",
      };
    }
  }
);

// IPC Handler: Kullanıcının kelime öğrenme durumunu getir
ipcMain.handle(
  "get-user-word-learning-status",
  async (event, { userId, wordId }) => {
    console.log(
      `Ana işlemde 'get-user-word-learning-status' isteği alındı, UserID: ${userId}, WordID: ${wordId}`
    );
    try {
      if (
        userId === undefined ||
        userId === null ||
        wordId === undefined ||
        wordId === null
      ) {
        throw new Error("Kullanıcı ID'si ve Kelime ID'si gereklidir.");
      }
      const status = await db.getUserWordLearningStatus(userId, wordId);
      return { success: true, status };
    } catch (error) {
      console.error(
        "IPC get-user-word-learning-status ana işlem hatası:",
        error.message
      );
      return {
        success: false,
        message:
          error.message ||
          "Kelime öğrenme durumu getirilirken bir hata oluştu.",
      };
    }
  }
);

// IPC Handler: Test Spaced Repetition Algorithm
ipcMain.handle("test-spaced-repetition-algorithm", async (event) => {
  console.log("Ana işlemde 'test-spaced-repetition-algorithm' isteği alındı");
  try {
    const testResult = db.testSpacedRepetitionAlgorithm();
    return { success: true, testResult };
  } catch (error) {
    console.error(
      "IPC test-spaced-repetition-algorithm ana işlem hatası:",
      error.message
    );
    return {
      success: false,
      message: error.message || "Algoritma testi yapılırken bir hata oluştu.",
    };
  }
});

// IPC Handler: Clear user session (for testing/debugging)
ipcMain.handle("clear-user-session", async (event, userId) => {
  console.log(`🗑️ Clearing session for user ${userId}`);
  clearUserSession(userId);
  return { success: true, message: "Session cleared" };
});
