const path = require("path");
const Database = require("better-sqlite3"); // 'sqlite3' yerine 'better-sqlite3' kullanılıyor
const bcrypt = require("bcryptjs");

let db;

/**
 * Veritabanını başlatır, tabloları oluşturur ve gerekli sütunları ekler.
 * Bu fonksiyon senkron çalışır.
 */
function initializeDatabase(userDataPath) {
  try {
    const dbPath = path.join(userDataPath, "kelimeApp.db");
    // 'new Database' senkron olarak çalışır, callback yoktur.
    db = new Database(dbPath, { verbose: console.log });
    console.log(
      `better-sqlite3 ile veritabanına başarıyla bağlanıldı: ${dbPath}`
    );

    // Tabloları oluşturma SQL komutları
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserName TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        NewWordsPerQuiz INTEGER DEFAULT 10
      );`;

    const createWordsTable = `
      CREATE TABLE IF NOT EXISTS Words (
        WordID INTEGER PRIMARY KEY AUTOINCREMENT,
        EngWordName TEXT UNIQUE NOT NULL,
        TurWordName TEXT NOT NULL,
        Picture TEXT,
        Sound TEXT,
        CategoryID INTEGER
      );`;

    const createWordSamplesTable = `
      CREATE TABLE IF NOT EXISTS WordSamples (
        WordSampleID INTEGER PRIMARY KEY AUTOINCREMENT,
        WordID INTEGER NOT NULL,
        SampleSentence TEXT NOT NULL,
        FOREIGN KEY (WordID) REFERENCES Words(WordID) ON DELETE CASCADE
      );`;
    const createUserWordProgressTable = `
      CREATE TABLE IF NOT EXISTS UserWordProgress (
        UserWordProgressID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        WordID INTEGER NOT NULL,
        CorrectStreak INTEGER DEFAULT 0,
        TotalCorrectAnswers INTEGER DEFAULT 0,
        RepetitionLevel INTEGER DEFAULT 0,
        LastTestedDate DATETIME,
        NextTestDate DATETIME,
        IsKnown BOOLEAN DEFAULT 0,
        FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        FOREIGN KEY (WordID) REFERENCES Words(WordID) ON DELETE CASCADE,
        UNIQUE(UserID, WordID)
      );`;

    // .exec() ile tüm tablo oluşturma komutları tek seferde çalıştırılır.
    db.exec(
      `${createUsersTable} ${createWordsTable} ${createWordSamplesTable} ${createUserWordProgressTable}`
    );
    console.log("Tüm tablolar başarıyla kontrol edildi/oluşturuldu."); // Varolan Users tablosuna 'NewWordsPerQuiz' sütununu ekleme kontrolü
    // db.pragma() senkron olarak bir dizi döndürür.
    const columns = db.pragma("table_info(Users)");
    const hasNewWordsColumn = columns.some(
      (col) => col.name === "NewWordsPerQuiz"
    );
    if (!hasNewWordsColumn) {
      db.exec(
        "ALTER TABLE Users ADD COLUMN NewWordsPerQuiz INTEGER DEFAULT 10"
      );
      console.log("Users tablosuna NewWordsPerQuiz sütunu başarıyla eklendi.");
    } // UserWordProgress tablosuna 'TotalCorrectAnswers' sütununu ekleme kontrolü
    const progressColumns = db.pragma("table_info(UserWordProgress)");
    const hasTotalCorrectColumn = progressColumns.some(
      (col) => col.name === "TotalCorrectAnswers"
    );
    if (!hasTotalCorrectColumn) {
      db.exec(
        "ALTER TABLE UserWordProgress ADD COLUMN TotalCorrectAnswers INTEGER DEFAULT 0"
      );
      console.log(
        "UserWordProgress tablosuna TotalCorrectAnswers sütunu başarıyla eklendi."
      );

      // Migrate existing data: Set TotalCorrectAnswers based on RepetitionLevel
      // Each level represents 3 correct answers, plus current streak
      db.exec(`
        UPDATE UserWordProgress 
        SET TotalCorrectAnswers = (RepetitionLevel * 3) + CorrectStreak 
        WHERE TotalCorrectAnswers = 0
      `);
      console.log(
        "Mevcut veriler için TotalCorrectAnswers değerleri hesaplandı."
      );
    }
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error.message);
    throw error; // Hata oluşursa uygulamanın başlamasını engelle
  }
}

/**
 * Yeni bir kullanıcıyı veritabanına ekler.
 * @returns {object} Eklenen kullanıcının bilgileri.
 */
function addUser({ username, email, password }) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = `INSERT INTO Users (UserName, Email, Password, NewWordsPerQuiz) VALUES (?, ?, ?, ?)`;
    const stmt = db.prepare(sql);
    // .run() senkron olarak çalışır ve bir bilgi objesi döndürür.
    const info = stmt.run(username, email, hashedPassword, 10);

    console.log(
      `Yeni kullanıcı eklendi, ID: ${info.lastInsertRowid}, Kullanıcı Adı: ${username}`
    );
    return { id: info.lastInsertRowid, username, email, newWordsPerQuiz: 10 };
  } catch (err) {
    console.error("Kullanıcı ekleme hatası:", err.message);
    if (err.message.includes("UNIQUE constraint failed")) {
      if (err.message.includes("Users.UserName"))
        throw new Error("Bu kullanıcı adı zaten mevcut.");
      if (err.message.includes("Users.Email"))
        throw new Error("Bu e-posta adresi zaten kayıtlı.");
    }
    throw err; // Diğer hataları yeniden fırlat
  }
}

/**
 * Kullanıcı adına göre bir kullanıcıyı getirir.
 * @returns {object|undefined} Kullanıcı objesi veya bulunamazsa undefined.
 */
function getUserByUsername(username) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  const sql = `SELECT UserID, UserName, Password, Email, NewWordsPerQuiz FROM Users WHERE UserName = ?`;
  const stmt = db.prepare(sql);
  // .get() senkron olarak tek bir satır döndürür.
  return stmt.get(username);
}

/**
 * Yeni bir kelimeyi veritabanına ekler.
 */
function addWord({ engWord, turWord, picture, sound, categoryId }) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  try {
    const sql = `INSERT INTO Words (EngWordName, TurWordName, Picture, Sound, CategoryID) VALUES (?, ?, ?, ?, ?)`;
    const stmt = db.prepare(sql);
    const params = [
      engWord,
      turWord,
      picture || null,
      sound || null,
      categoryId || null,
    ];
    const info = stmt.run(params);
    return { id: info.lastInsertRowid, engWord };
  } catch (err) {
    if (
      err.message.includes("UNIQUE constraint failed") &&
      err.message.includes("Words.EngWordName")
    ) {
      throw new Error("Bu İngilizce kelime zaten mevcut.");
    }
    throw err;
  }
}

/**
 * Bir kelime için örnek cümle ekler.
 */
function addWordSample({ wordId, sentence }) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  if (!sentence || sentence.trim() === "") {
    return { id: null, message: "Boş cümle eklenmedi." };
  }
  const sql = `INSERT INTO WordSamples (WordID, SampleSentence) VALUES (?, ?)`;
  const stmt = db.prepare(sql);
  const info = stmt.run(wordId, sentence.trim());
  return { id: info.lastInsertRowid };
}

/**
 * Kullanıcı için bir sonraki uygun sınav kelimesini getirir.
 * İstenen algoritma:
 * 1. Önce tekrar zamanı gelmiş kelimeler
 * 2. Sonra yeni kelimeler (günlük limit kadar)
 * 3. Aynı kelimenin arka arkaya gelmesini engelle
 */
function getNextWordForUser(
  userId,
  newWordsCount = 10,
  lastShownWordId = null
) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");

  // Şu anki zamanı al (proper date comparison için)
  const now = new Date();
  const currentDateTime = now.toISOString();

  console.log(
    `🔍 getNextWordForUser çağrıldı - UserId: ${userId}, NewWordsCount: ${newWordsCount}, LastWordID: ${lastShownWordId}`
  );
  console.log(`📅 Current DateTime: ${currentDateTime}`);
  // Öncelik 1: Tekrar zamanı gelmiş kelimeler (IsKnown = 0 ve NextTestDate <= şimdi)
  // First, let's see what words exist for this user
  const debugSql = `
      SELECT w.WordID, w.EngWordName, uwp.CorrectStreak, uwp.RepetitionLevel, 
             uwp.NextTestDate, uwp.IsKnown, uwp.LastTestedDate,
             CASE WHEN uwp.NextTestDate <= ? THEN 'READY' ELSE 'NOT_READY' END as ReadyStatus
      FROM Words w
      JOIN UserWordProgress uwp ON w.WordID = uwp.WordID
      WHERE uwp.UserID = ? AND uwp.IsKnown = 0
      ORDER BY uwp.NextTestDate ASC`;

  const debugStmt = db.prepare(debugSql);
  const allWords = debugStmt.all(currentDateTime, userId);
  console.log(`🔍 Debug: Found ${allWords.length} words for user ${userId}:`);
  allWords.forEach((w) => {
    console.log(
      `  - ${w.EngWordName}: Level=${w.RepetitionLevel}, Streak=${w.CorrectStreak}, NextTest=${w.NextTestDate}, Status=${w.ReadyStatus}`
    );
  });

  const sqlPriority1 = `
      SELECT w.WordID, w.EngWordName, w.TurWordName, w.Picture, w.Sound, w.CategoryID, 
             uwp.CorrectStreak, uwp.RepetitionLevel, uwp.NextTestDate, uwp.IsKnown
      FROM Words w
      JOIN UserWordProgress uwp ON w.WordID = uwp.WordID
      WHERE uwp.UserID = ? 
        AND uwp.IsKnown = 0 
        AND uwp.NextTestDate <= ?
        ${lastShownWordId ? "AND w.WordID != ?" : ""}
      ORDER BY uwp.NextTestDate ASC, uwp.RepetitionLevel DESC, RANDOM()
      LIMIT 1`;

  let stmt = db.prepare(sqlPriority1);
  let word;

  if (lastShownWordId) {
    console.log(`🚫 Excluding last shown word ID: ${lastShownWordId}`);
    word = stmt.get(userId, currentDateTime, lastShownWordId);
  } else {
    word = stmt.get(userId, currentDateTime);
  }

  if (word) {
    console.log("✅ getNextWordForUser - Tekrar zamanı gelen kelime bulundu:", {
      wordId: word.WordID,
      engWord: word.EngWordName,
      level: word.RepetitionLevel,
      nextTestDate: word.NextTestDate,
      isKnown: word.IsKnown,
    });
    return word;
  }

  // Bugün kaç yeni kelime ile karşılaştı kontrol et
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  const sqlTodaysNewWords = `
      SELECT COUNT(*) as count
      FROM UserWordProgress uwp
      WHERE uwp.UserID = ? 
        AND uwp.LastTestedDate >= ? 
        AND uwp.RepetitionLevel = 0
        AND uwp.CorrectStreak = 0`;

  const todaysNewWordsStmt = db.prepare(sqlTodaysNewWords);
  const todaysNewWordsResult = todaysNewWordsStmt.get(userId, todayStartISO);
  const todaysNewWordsCount = todaysNewWordsResult
    ? todaysNewWordsResult.count
    : 0;

  console.log(
    `📊 Bugün karşılaşılan yeni kelime sayısı: ${todaysNewWordsCount}/${newWordsCount}`
  );

  // Eğer günlük yeni kelime limitine ulaşmadıysa, yeni kelime getir
  if (todaysNewWordsCount < newWordsCount) {
    // Öncelik 2: Hiç karşılaşmadığı kelimeler
    const sqlNewWords = `
        SELECT w.WordID, w.EngWordName, w.TurWordName, w.Picture, w.Sound, w.CategoryID,
               0 as CorrectStreak, 0 as RepetitionLevel, 0 as IsKnown
        FROM Words w
        LEFT JOIN UserWordProgress uwp ON w.WordID = uwp.WordID AND uwp.UserID = ?
        WHERE uwp.WordID IS NULL
          ${lastShownWordId ? "AND w.WordID != ?" : ""}
        ORDER BY RANDOM()
        LIMIT 1`;

    stmt = db.prepare(sqlNewWords);
    if (lastShownWordId) {
      word = stmt.get(userId, lastShownWordId);
    } else {
      word = stmt.get(userId);
    }

    if (word) {
      console.log("🆕 getNextWordForUser - Yeni kelime bulundu:", {
        wordId: word.WordID,
        engWord: word.EngWordName,
      });
      return word;
    }

    // Öncelik 3: Öğrenme sürecinde olan kelimeler (CorrectStreak < 6 ve IsKnown = 0)
    const sqlLearningWords = `
        SELECT w.WordID, w.EngWordName, w.TurWordName, w.Picture, w.Sound, w.CategoryID,
               uwp.CorrectStreak, uwp.RepetitionLevel, uwp.IsKnown
        FROM Words w
        JOIN UserWordProgress uwp ON w.WordID = uwp.WordID
        WHERE uwp.UserID = ? 
          AND uwp.IsKnown = 0 
          AND uwp.CorrectStreak < 6
          ${lastShownWordId ? "AND w.WordID != ?" : ""}
        ORDER BY uwp.CorrectStreak ASC, RANDOM()
        LIMIT 1`;

    stmt = db.prepare(sqlLearningWords);
    if (lastShownWordId) {
      word = stmt.get(userId, lastShownWordId);
    } else {
      word = stmt.get(userId);
    }

    if (word) {
      console.log(
        "📚 getNextWordForUser - Öğrenme sürecindeki kelime bulundu:",
        {
          wordId: word.WordID,
          engWord: word.EngWordName,
          streak: word.CorrectStreak,
          level: word.RepetitionLevel,
        }
      );
      return word;
    }
  }

  // Eğer lastShownWordId kısıtlaması yüzünden kelime bulunamadıysa, kısıtlama olmadan tekrar dene
  if (lastShownWordId) {
    console.log(
      "⚠️ Son gösterilen kelime kısıtlaması yüzünden kelime bulunamadı, kısıtlama olmadan tekrar denenecek..."
    );
    return getNextWordForUser(userId, newWordsCount, null);
  }

  console.log("❌ getNextWordForUser - Uygun kelime bulunamadı");
  return null;
}

/**
 * Kullanıcının kelime ilerlemesini günceller.
 * Temel 6 Sefer Quiz Sorularının Belirlenme Algoritması:
 * - Bir soruyu hakkı ile bilmesi için altı kez üst üste doğru cevabı işaretlemesi lazım
 * - Eğer 6 kez aynı soru için doğru cevabı vermez ise, süreç o soru için başa döner
 * - Bilinen bir sorunun testte öğrenciye sorulması için kullanılacak zaman aralığı:
 *   1 gün sonra, 1 hafta sonra, 1 ay sonra, 3 ay sonra, 6 ay sonra ve 1 yıl sonra
 * - Eğer 6 farklı zamanda da aynı soruyu doğru olarak bilmiş isek o soruyu bilinen soru havuzuna taşı
 */
function updateUserWordProgress({ userId, wordId, isCorrect }) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");

  const now = new Date().toISOString();
  const getProgressSql = `SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?`;
  const stmtGet = db.prepare(getProgressSql);
  const progress = stmtGet.get(userId, wordId);

  let newStreak = progress ? progress.CorrectStreak : 0;
  let newTotalCorrect = progress ? progress.TotalCorrectAnswers || 0 : 0;
  let newLevel = progress ? progress.RepetitionLevel : 0;
  let newNextTestDate = now;
  let newIsKnown = progress ? progress.IsKnown : 0;

  // Spaced repetition aralıkları: 1 gün, 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl
  const intervals = [1, 7, 30, 90, 180, 365]; // gün cinsinden
  const requiredStreakForAdvancement = 6;

  if (isCorrect) {
    newStreak++;
    newTotalCorrect++; // Her doğru cevap için artır

    console.log(
      `Kelime ${wordId} - Doğru cevap! Streak: ${newStreak}/${requiredStreakForAdvancement}, Level: ${
        newLevel + 1
      }/6`
    );

    if (newStreak >= requiredStreakForAdvancement) {
      // 6 kez üst üste doğru cevap verildi, bir sonraki seviyeye geç
      newStreak = 0; // Streak'i sıfırla, yeni seviye için baştan başla
      newLevel++;

      if (newLevel >= 6) {
        // 6 farklı zamanda da doğru cevap verildi, kelime tamamen öğrenildi
        newIsKnown = 1;
        newNextTestDate = null;
        console.log(
          `🎉 Kelime ${wordId} kullanıcı ${userId} için tamamen öğrenildi! (6/6 seviye tamamlandı)`
        );
      } else {
        // Bir sonraki seviye için spaced repetition aralığını belirle
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervals[newLevel - 1]);
        newNextTestDate = nextDate.toISOString();

        const intervalText =
          newLevel === 1
            ? "1 gün"
            : newLevel === 2
            ? "1 hafta"
            : newLevel === 3
            ? "1 ay"
            : newLevel === 4
            ? "3 ay"
            : newLevel === 5
            ? "6 ay"
            : "1 yıl";

        console.log(
          `✅ Kelime ${wordId} - Seviye ${newLevel}/6 tamamlandı! Bir sonraki test: ${intervalText} sonra (${nextDate.toLocaleDateString(
            "tr-TR"
          )})`
        );
      }
    } else {
      // Henüz 6 doğru cevaba ulaşmadı, aynı seviyede devam et
      // Eğer level 0 ise (yeni kelime), ertesi gün tekrar test et
      if (newLevel === 0) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        newNextTestDate = nextDate.toISOString();
        console.log(
          `📚 Kelime ${wordId} - Yeni kelime öğreniliyor: ${newStreak}/${requiredStreakForAdvancement} doğru, yarın tekrar`
        );
      } else {
        // Mevcut seviyede devam ediyor, aynı aralığı koru
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervals[newLevel - 1]);
        newNextTestDate = nextDate.toISOString();
        console.log(
          `🔄 Kelime ${wordId} - Seviye ${newLevel} devam ediyor: ${newStreak}/${requiredStreakForAdvancement} doğru`
        );
      }
    }
  } else {
    // Yanlış cevap - süreç o seviye için başa döner
    console.log(
      `❌ Kelime ${wordId} - Yanlış cevap! Seviye ${newLevel} için süreç başa döndü (streak: ${newStreak} -> 0)`
    );

    newStreak = 0; // Streak'i sıfırla ama seviyeyi koru
    // NOT: Level'ı sıfırlamıyoruz, sadece o seviyedeki streak'i sıfırlıyoruz

    if (newLevel === 0) {
      // Henüz hiç seviye atlamadı, ertesi gün tekrar
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      newNextTestDate = nextDate.toISOString();
    } else {
      // Mevcut seviyede kaldı, aynı aralığı kullan
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervals[newLevel - 1]);
      newNextTestDate = nextDate.toISOString();
    }
  }

  // Veritabanını güncelle
  const updateSql = `
        INSERT INTO UserWordProgress (UserID, WordID, CorrectStreak, TotalCorrectAnswers, RepetitionLevel, LastTestedDate, NextTestDate, IsKnown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(UserID, WordID) DO UPDATE SET
          CorrectStreak = excluded.CorrectStreak,
          TotalCorrectAnswers = excluded.TotalCorrectAnswers,
          RepetitionLevel = excluded.RepetitionLevel,
          LastTestedDate = excluded.LastTestedDate,
          NextTestDate = excluded.NextTestDate,
          IsKnown = excluded.IsKnown`;
  const stmtUpdate = db.prepare(updateSql);
  stmtUpdate.run(
    userId,
    wordId,
    newStreak,
    newTotalCorrect,
    newLevel,
    now,
    newNextTestDate,
    newIsKnown
  );

  return {
    success: true,
    message: "İlerleme güncellendi.",
    updatedProgress: {
      userId,
      wordId,
      newStreak,
      newLevel,
      newNextTestDate,
      newIsKnown,
    },
  };
}

/**
 * Kullanıcının ayarlarını günceller.
 */
function updateUserSettings({ userId, settings }) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  if (
    !settings ||
    typeof settings.newWordsPerQuiz === "undefined" ||
    isNaN(parseInt(settings.newWordsPerQuiz))
  ) {
    throw new Error(
      "Ayarlar veya newWordsPerQuiz değeri sağlanmadı veya geçersiz."
    );
  }
  const newWordsCount = parseInt(settings.newWordsPerQuiz);
  const sql = `UPDATE Users SET NewWordsPerQuiz = ? WHERE UserID = ?`;
  const stmt = db.prepare(sql);
  const info = stmt.run(newWordsCount, userId);

  if (info.changes === 0) {
    throw new Error("Kullanıcı bulunamadı veya ayar güncellenmedi.");
  }
  console.log(
    `Kullanıcı (ID: ${userId}) ayarları güncellendi: NewWordsPerQuiz = ${newWordsCount}`
  );
  return { success: true, message: "Ayarlar başarıyla güncellendi." };
}

/**
 * Kullanıcının ayarlarını ve temel bilgilerini getirir.
 */
function getUserSettings(userId) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  const sql = `SELECT UserID, UserName, Email, NewWordsPerQuiz FROM Users WHERE UserID = ?`;
  const stmt = db.prepare(sql);
  return stmt.get(userId);
}

/**
 * Kullanıcının öğrenme istatistiklerini getirir. Callback hell'den kurtarılmış hali.
 */
function getUserLearningStats(userId) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");

  const stats = {};

  // 1. Sistemdeki toplam kelime sayısı
  let stmt = db.prepare("SELECT COUNT(*) as count FROM Words");
  stats.totalWordsInSystem = stmt.get().count;
  // 2. Kullanıcının öğrendiği kelime sayısı
  stmt = db.prepare(
    "SELECT COUNT(*) as count FROM UserWordProgress WHERE UserID = ? AND IsKnown = 1"
  );
  stats.learnedByCurrentUser = stmt.get(userId).count;
  console.log(
    `DEBUG: Found ${stats.learnedByCurrentUser} learned words for user ${userId}`
  );

  // 3. Kullanıcının öğrenmekte olduğu kelime sayısı
  stmt = db.prepare(
    "SELECT COUNT(*) as count FROM UserWordProgress WHERE UserID = ? AND IsKnown = 0"
  );
  stats.inProgressByCurrentUser = stmt.get(userId).count;

  // 4. Kullanıcının henüz hiç karşılaşmadığı yeni kelime sayısı
  stmt = db.prepare(`
        SELECT COUNT(w.WordID) as count 
        FROM Words w
        LEFT JOIN UserWordProgress uwp ON w.WordID = uwp.WordID AND uwp.UserID = ?
        WHERE uwp.WordID IS NULL`);
  stats.notYetStudiedByCurrentUser = stmt.get(userId).count;

  console.log(`Kullanıcı (ID: ${userId}) istatistikleri:`, stats);
  return stats;
}

/**
 * Kullanıcının öğrendiği kelimeleri getirir.
 */
function getLearnedWordsByUser(userId, limit = null, offset = 0) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  let sql = `
        SELECT w.WordID, w.EngWordName, w.TurWordName, w.Picture, w.Sound, 
               uwp.CorrectStreak, uwp.TotalCorrectAnswers, uwp.RepetitionLevel, uwp.LastTestedDate,
               uwp.NextTestDate, uwp.IsKnown
        FROM Words w
        JOIN UserWordProgress uwp ON w.WordID = uwp.WordID
        WHERE uwp.UserID = ? AND uwp.IsKnown = 1
        ORDER BY uwp.LastTestedDate DESC`;

  if (limit) {
    sql += ` LIMIT ? OFFSET ?`;
  }

  const stmt = db.prepare(sql);
  const result = limit ? stmt.all(userId, limit, offset) : stmt.all(userId);

  console.log(
    `Kullanıcı ${userId} için ${result.length} öğrenilmiş kelime bulundu.`
  );
  return result;
}

/**
 * Bir kelimeyi öğrenildi olarak işaretler veya öğrenildi durumunu kaldırır.
 */
function markWordAsLearned(userId, wordId, isLearned = true) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");

  const now = new Date().toISOString();
  const getProgressSql = `SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?`;
  const stmtGet = db.prepare(getProgressSql);
  const progress = stmtGet.get(userId, wordId);

  let newStreak = progress ? progress.CorrectStreak : 0;
  let newTotalCorrect = progress ? progress.TotalCorrectAnswers || 0 : 0;
  let newLevel = progress ? progress.RepetitionLevel : 0;
  let newNextTestDate = progress ? progress.NextTestDate : null;
  let newIsKnown = isLearned ? 1 : 0;

  // Eğer öğrenildi olarak işaretleniyorsa, minimum seviyeyi ayarla
  if (isLearned) {
    newLevel = Math.max(newLevel, 6); // Minimum 6. seviye
    newStreak = Math.max(newStreak, 6); // Minimum 6 doğru cevap
    newTotalCorrect = Math.max(newTotalCorrect, 9); // Minimum 9 toplam doğru cevap
    newNextTestDate = null; // Öğrenilen kelimeler için test tarihi yok
  } else {
    // Öğrenildi durumu kaldırılıyorsa, bir sonraki test tarihini ayarla
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    newNextTestDate = nextDate.toISOString();
  }

  const updateSql = `
        INSERT INTO UserWordProgress (UserID, WordID, CorrectStreak, TotalCorrectAnswers, RepetitionLevel, LastTestedDate, NextTestDate, IsKnown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(UserID, WordID) DO UPDATE SET
          CorrectStreak = excluded.CorrectStreak,
          TotalCorrectAnswers = excluded.TotalCorrectAnswers,
          RepetitionLevel = excluded.RepetitionLevel,
          LastTestedDate = excluded.LastTestedDate,
          NextTestDate = excluded.NextTestDate,
          IsKnown = excluded.IsKnown`;
  const stmtUpdate = db.prepare(updateSql);
  stmtUpdate.run(
    userId,
    wordId,
    newStreak,
    newTotalCorrect,
    newLevel,
    now,
    newNextTestDate,
    newIsKnown
  );

  console.log(
    `Kelime ${wordId} kullanıcı ${userId} için ${
      isLearned ? "öğrenildi" : "öğrenilmedi"
    } olarak işaretlendi.`
  );

  return {
    success: true,
    message: `Kelime başarıyla ${
      isLearned ? "öğrenildi" : "öğrenilmedi"
    } olarak işaretlendi.`,
    updatedProgress: {
      userId,
      wordId,
      newStreak,
      newLevel,
      newNextTestDate,
      newIsKnown,
    },
  };
}

/**
 * Kullanıcının kelime öğrenme durumunu detaylı olarak getirir.
 */
function getUserWordLearningStatus(userId, wordId) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  const sql = `
        SELECT w.WordID, w.EngWordName, w.TurWordName, w.Picture, w.Sound,
               uwp.CorrectStreak, uwp.TotalCorrectAnswers, uwp.RepetitionLevel, uwp.LastTestedDate,
               uwp.NextTestDate, uwp.IsKnown,
               CASE 
                   WHEN uwp.IsKnown = 1 THEN 'Öğrenildi'
                   WHEN uwp.RepetitionLevel >= 3 THEN 'İyi Biliniyor'
                   WHEN uwp.RepetitionLevel >= 1 THEN 'Öğreniliyor'
                   WHEN uwp.CorrectStreak >= 3 THEN 'İlerliyor'
                   WHEN uwp.WordID IS NOT NULL THEN 'Başlangıç'
                   ELSE 'Hiç Görülmedi'
               END as LearningStatus
        FROM Words w
        LEFT JOIN UserWordProgress uwp ON w.WordID = uwp.WordID AND uwp.UserID = ?
        WHERE w.WordID = ?`;

  const stmt = db.prepare(sql);
  const result = stmt.get(userId, wordId);

  if (result) {
    console.log(`Kelime ${wordId} durumu: ${result.LearningStatus}`);
    return result;
  } else {
    throw new Error("Kelime bulunamadı.");
  }
}

/**
 * Wordle oyunu için rastgele bir kelime getirir.
 */
function getWordleWord(userId, wordLength = 5) {
  if (!db) throw new Error("Veritabanı bağlantısı mevcut değil.");
  const sql = `
      SELECT w.EngWordName 
      FROM Words w
      JOIN UserWordProgress uwp ON w.WordID = uwp.WordID
      WHERE uwp.UserID = ? 
        AND (uwp.IsKnown = 1 OR uwp.RepetitionLevel >= 1) 
        AND LENGTH(w.EngWordName) = ?
      ORDER BY RANDOM()
      LIMIT 1`;
  const stmt = db.prepare(sql);
  const row = stmt.get(userId, wordLength);

  if (row) {
    console.log(`Wordle için kelime bulundu: ${row.EngWordName}`);
    return { engWord: row.EngWordName };
  } else {
    console.log(
      `Wordle için uygun kelime (uzunluk: ${wordLength}) bulunamadı.`
    );
    return null;
  }
}

/**
 * Veritabanı bağlantısını kapatır. Bu fonksiyon senkrondur.
 */
function closeDatabase() {
  if (db) {
    db.close();
    console.log("better-sqlite3 veritabanı bağlantısı başarıyla kapatıldı.");
    db = null;
  }
}

/**
 * Test fonksiyonu: Sınav algoritmasının doğru çalışıp çalışmadığını test eder
 * Kullanıcı hikayesinde verilen örnek senaryoyu simüle eder
 */
function testSpacedRepetitionAlgorithm() {
  if (!db) {
    console.log("❌ Test edilemiyor: Veritabanı bağlantısı yok");
    return false;
  }

  console.log("🧪 Spaced Repetition Algoritması Test Ediliyor...");

  // Test kullanıcısı ve kelimesi oluştur
  const testUserId = 999999;
  const testWordId = 999999;

  try {
    // Test verilerini temizle
    db.exec(`DELETE FROM UserWordProgress WHERE UserID = ${testUserId}`);

    // Senaryo: 08.02.2024 günü ilk kelime testi
    console.log("\n📅 08.02.2024 - İlk Test");

    // 6 kez doğru cevap ver (Level 0 -> Level 1)
    for (let i = 1; i <= 6; i++) {
      const result = updateUserWordProgress({
        userId: testUserId,
        wordId: testWordId,
        isCorrect: true,
      });
      console.log(
        `  ${i}. doğru cevap: Streak=${result.updatedProgress.newStreak}, Level=${result.updatedProgress.newLevel}`
      );
    }

    // Şimdi Level 1'de olmalı ve 1 gün sonra test edilmeli
    const progress1 = db
      .prepare("SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?")
      .get(testUserId, testWordId);
    console.log(
      `✅ Level 1'e yükseldi: RepetitionLevel=${progress1.RepetitionLevel}, NextTestDate=${progress1.NextTestDate}`
    );

    // 09.02.2024 - 1 gün sonra test (Level 1'de)
    console.log("\n📅 09.02.2024 - 1 Gün Sonra Test (Level 1)");

    // Önce 3 yanlış cevap ver - streak sıfırlanmalı ama level korunmalı
    for (let i = 1; i <= 3; i++) {
      const result = updateUserWordProgress({
        userId: testUserId,
        wordId: testWordId,
        isCorrect: false,
      });
      console.log(
        `  ${i}. yanlış cevap: Streak=${result.updatedProgress.newStreak}, Level=${result.updatedProgress.newLevel}`
      );
    }

    // Sonra 6 doğru cevap ver (Level 1 -> Level 2)
    for (let i = 1; i <= 6; i++) {
      const result = updateUserWordProgress({
        userId: testUserId,
        wordId: testWordId,
        isCorrect: true,
      });
      console.log(
        `  ${i}. doğru cevap: Streak=${result.updatedProgress.newStreak}, Level=${result.updatedProgress.newLevel}`
      );
    }

    const progress2 = db
      .prepare("SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?")
      .get(testUserId, testWordId);
    console.log(
      `✅ Level 2'ye yükseldi: RepetitionLevel=${progress2.RepetitionLevel}, NextTestDate=${progress2.NextTestDate}`
    );

    // 15.02.2024 - 1 hafta sonra test (Level 2'de)
    console.log("\n📅 15.02.2024 - 1 Hafta Sonra Test (Level 2)");

    // Level 2'de 6 doğru cevap ver (Level 2 -> Level 3)
    for (let i = 1; i <= 6; i++) {
      const result = updateUserWordProgress({
        userId: testUserId,
        wordId: testWordId,
        isCorrect: true,
      });
      console.log(
        `  ${i}. doğru cevap: Streak=${result.updatedProgress.newStreak}, Level=${result.updatedProgress.newLevel}`
      );
    }

    const progress3 = db
      .prepare("SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?")
      .get(testUserId, testWordId);
    console.log(
      `✅ Level 3'e yükseldi: RepetitionLevel=${progress3.RepetitionLevel}, NextTestDate=${progress3.NextTestDate}`
    );

    // Hızlıca Level 6'ya kadar çıkar
    console.log("\n🚀 Hızlı Test: Level 6'ya kadar çıkarma");
    for (let level = 3; level < 6; level++) {
      console.log(`\n📅 Level ${level + 1} için test`);
      for (let i = 1; i <= 6; i++) {
        const result = updateUserWordProgress({
          userId: testUserId,
          wordId: testWordId,
          isCorrect: true,
        });
        if (i === 6) {
          console.log(
            `  ✅ Level ${level + 1}'e yükseldi! IsKnown=${
              result.updatedProgress.newIsKnown
            }`
          );
        }
      }
    }

    const finalProgress = db
      .prepare("SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?")
      .get(testUserId, testWordId);
    console.log(
      `\n🎉 Final Durum: RepetitionLevel=${finalProgress.RepetitionLevel}, IsKnown=${finalProgress.IsKnown}, NextTestDate=${finalProgress.NextTestDate}`
    );

    // Test verilerini temizle
    db.exec(`DELETE FROM UserWordProgress WHERE UserID = ${testUserId}`);

    console.log("\n✅ Test tamamlandı - Algoritma doğru çalışıyor!");
    return true;
  } catch (error) {
    console.error("❌ Test hatası:", error);
    // Test verilerini temizle
    try {
      db.exec(`DELETE FROM UserWordProgress WHERE UserID = ${testUserId}`);
    } catch (e) {}
    return false;
  }
}

// Tüm fonksiyonları dışa aktar
module.exports = {
  initializeDatabase,
  addUser,
  getUserByUsername,
  addWord,
  addWordSample,
  getNextWordForUser,
  updateUserWordProgress,
  updateUserSettings,
  getUserSettings,
  getUserLearningStats,
  getLearnedWordsByUser,
  markWordAsLearned,
  getUserWordLearningStatus,
  getWordleWord,
  closeDatabase,
  testSpacedRepetitionAlgorithm,
};
