// src/services/llm-service.cjs

// Gerekli paketler
const fetch = require("node-fetch");

// API Anahtarını .env dosyasından al
const API_KEY = process.env.GEMINI_API_KEY;

// Debug information for troubleshooting
console.log("LLM Service - API Key status:", API_KEY ? "Found" : "Not found");
console.log("LLM Service - Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  hasAPIKey: !!API_KEY,
  apiKeyLength: API_KEY ? API_KEY.length : 0,
});

// API Endpoint'leri
const STORY_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
// Görsel üretimi için Imagen modelinin endpoint'i
const IMAGE_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;

async function generateStoryFromWords(words) {
  if (!API_KEY) {
    throw new Error(
      "Gemini API anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin."
    );
  }
  const wordList = words.join(", ");
  const prompt = `Lütfen içinde şu kelimelerin geçtiği kısa, yaratıcı ve tek paragraflık bir hikaye yaz: ${wordList}. Hikaye, bu kelimeleri kullanarak anlamlı bir bütün oluşturmalı.`;

  try {
    const response = await fetch(STORY_MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Gemini Metin API Hatası:", errorBody);
      throw new Error(
        `Hikaye alınırken bir hata oluştu: ${errorBody.error.message}`
      );
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error(
        "Hikaye oluşturulamadı, API'den beklenmedik bir yanıt alındı."
      );
    }
  } catch (error) {
    console.error("fetch() sırasında hikaye hatası:", error);
    throw new Error("Hikaye oluşturma servisiyle iletişim kurulamadı.");
  }
}

/**
 * Verilen metin isteminden bir görsel üretir.
 * @param {string} prompt - Görseli tanımlayan metin.
 * @returns {Promise<string>} Oluşturulan görselin base64 formatındaki verisi.
 */
async function generateImageFromPrompt(prompt) {
  if (!API_KEY) {
    throw new Error(
      "Gemini API anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin."
    );
  }

  // Hikayeyi görsel prompt'una daha uygun hale getirelim
  const imageGenerationPrompt = `Dijital sanat, fantastik, sinematik: ${prompt}`;

  try {
    const response = await fetch(IMAGE_MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: imageGenerationPrompt }],
        parameters: { sampleCount: 1 },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Imagen API Hatası:", errorBody);
      throw new Error(
        `Görsel üretilirken bir hata oluştu: ${errorBody.error.message}`
      );
    }

    const data = await response.json();
    if (
      data.predictions &&
      data.predictions.length > 0 &&
      data.predictions[0].bytesBase64Encoded
    ) {
      return data.predictions[0].bytesBase64Encoded; // Base64 formatındaki görsel verisi
    } else {
      console.error("Imagen API'den beklenmedik yanıt formatı:", data);
      throw new Error(
        "Görsel üretilemedi, API'den boş veya beklenmedik bir yanıt alındı."
      );
    }
  } catch (error) {
    console.error("fetch() sırasında görsel hatası:", error);
    throw new Error("Görsel oluşturma servisiyle iletişim kurulamadı.");
  }
}

module.exports = {
  generateStoryFromWords,
  generateImageFromPrompt, // generateImagePromptFromStory yerine bu yeni fonksiyonu export ediyoruz
};
