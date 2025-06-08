// src/pages/KelimeEklePage.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";

function KelimeEklePage() {
  const [engWord, setEngWord] = useState("");
  const [turWord, setTurWord] = useState("");
  const [sampleSentence1, setSampleSentence1] = useState("");
  const [sampleSentence2, setSampleSentence2] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [soundFile, setSoundFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSoundChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSoundFile(event.target.files[0]);
    } else {
      setSoundFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!engWord.trim() || !turWord.trim()) {
      toast.error("İngilizce kelime ve Türkçe karşılığı boş bırakılamaz.");
      setIsSubmitting(false);
      return;
    }

    try {
      let newImageFileName = null;
      let newSoundFileName = null;

      // 1. Eğer resim dosyası seçildiyse, ana işleme kopyalaması için gönder
      if (imageFile) {
        console.log(
          `Resim dosyası kopyalanmak üzere gönderiliyor: ${imageFile.path}`
        );
        const imageResult = await window.electronAPI.copyFileToAppData(
          imageFile.path
        );
        if (imageResult.success) {
          newImageFileName = imageResult.fileName;
          console.log(
            `Resim dosyası başarıyla kopyalandı, yeni adı: ${newImageFileName}`
          );
        } else {
          throw new Error(
            imageResult.message || "Resim dosyası kopyalanamadı."
          );
        }
      }

      // 2. Eğer ses dosyası seçildiyse, ana işleme kopyalaması için gönder
      if (soundFile) {
        console.log(
          `Ses dosyası kopyalanmak üzere gönderiliyor: ${soundFile.path}`
        );
        const soundResult = await window.electronAPI.copyFileToAppData(
          soundFile.path
        );
        if (soundResult.success) {
          newSoundFileName = soundResult.fileName;
          console.log(
            `Ses dosyası başarıyla kopyalandı, yeni adı: ${newSoundFileName}`
          );
        } else {
          throw new Error(soundResult.message || "Ses dosyası kopyalanamadı.");
        }
      }

      // 3. Veritabanına kaydedilecek veriyi hazırla
      const wordData = {
        engWord: engWord.trim(),
        turWord: turWord.trim(),
        sentences: [sampleSentence1.trim(), sampleSentence2.trim()].filter(
          (s) => s !== ""
        ),
        picture: newImageFileName, // Kopyalanan dosyanın yeni adını kullan
        sound: newSoundFileName, // Kopyalanan dosyanın yeni adını kullan
      };

      // 4. Veritabanına kelimeyi eklemek için IPC çağrısı yap
      const result = await window.electronAPI.addWord(wordData);

      if (result.success && result.word) {
        toast.success(`'${result.word.engWord}' kelimesi başarıyla eklendi!`);
        // Formu temizle
        setEngWord("");
        setTurWord("");
        setSampleSentence1("");
        setSampleSentence2("");
        setImageFile(null);
        setSoundFile(null);
        if (document.getElementById("imageInput"))
          document.getElementById("imageInput").value = null;
        if (document.getElementById("soundInput"))
          document.getElementById("soundInput").value = null;
      } else {
        toast.error(
          result.message || "Kelime eklenirken bilinmeyen bir hata oluştu."
        );
      }
    } catch (err) {
      toast.error(
        err.message || "Kelime ekleme işlemi sırasında bir sorun oluştu."
      );
    } finally {
      setIsSubmitting(false); // İşlem bitince butonu tekrar aktif et
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {" "}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text mb-4 turkish-text emoji-fix">
            📚 Yeni Kelime Ekle
          </h1>
          <p className="text-gray-600 text-lg turkish-text">
            Kelime dağarcığınızı genişletin
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* İngilizce Kelime */}{" "}
            <div className="space-y-2">
              <label
                htmlFor="engWord"
                className="block text-sm font-semibold text-gray-700 turkish-text"
              >
                İngilizce Kelime <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="engWord"
                value={engWord}
                onChange={(e) => setEngWord(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Öğrenmek istediğiniz kelimeyi girin"
                required
                disabled={isSubmitting}
              />
            </div>{" "}
            {/* Türkçe Karşılığı */}
            <div className="space-y-2">
              <label
                htmlFor="turWord"
                className="block text-sm font-semibold text-gray-700 turkish-text"
              >
                Türkçe Karşılığı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="turWord"
                value={turWord}
                onChange={(e) => setTurWord(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 turkish-text"
                placeholder="Kelimenin Türkçe anlamını girin"
                required
                disabled={isSubmitting}
              />
            </div>
            {/* Örnek Cümle 1 */}
            <div className="space-y-2">
              <label
                htmlFor="sampleSentence1"
                className="block text-sm font-semibold text-gray-700 turkish-text"
              >
                Örnek Cümle 1 (İngilizce)
              </label>
              <textarea
                id="sampleSentence1"
                value={sampleSentence1}
                onChange={(e) => setSampleSentence1(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Kelimeyi içeren bir örnek cümle yazın"
                disabled={isSubmitting}
              />
            </div>
            {/* Örnek Cümle 2 (Opsiyonel) */}
            <div className="space-y-2">
              {" "}
              <label
                htmlFor="sampleSentence2"
                className="block text-sm font-semibold text-gray-700 turkish-text"
              >
                Örnek Cümle 2 (İngilizce){" "}
                <span className="text-gray-400">(Opsiyonel)</span>
              </label>
              <textarea
                id="sampleSentence2"
                value={sampleSentence2}
                onChange={(e) => setSampleSentence2(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                placeholder="İsteğe bağlı ikinci örnek cümle"
                disabled={isSubmitting}
              />
            </div>
            {/* Dosya Yükleme Bölümü */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resim Yükleme */}
              <div className="space-y-2">
                {" "}
                <label
                  htmlFor="imageInput"
                  className="block text-sm font-semibold text-gray-700 turkish-text emoji-fix"
                >
                  <span className="emoji-fix">📸</span> Kelime ile İlgili Resim
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors file:duration-200 cursor-pointer border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />{" "}
                  {imageFile && (
                    <p className="text-xs text-emerald-600 mt-2 font-medium turkish-text emoji-fix">
                      ✓ Seçilen resim: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Ses Dosyası Yükleme */}
              <div className="space-y-2">
                {" "}
                <label
                  htmlFor="soundInput"
                  className="block text-sm font-semibold text-gray-700 turkish-text emoji-fix"
                >
                  <span className="emoji-fix">🔊</span> Sesli Okunuş{" "}
                  <span className="text-gray-400">(Opsiyonel)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="soundInput"
                    accept="audio/*"
                    onChange={handleSoundChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:transition-colors file:duration-200 cursor-pointer border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isSubmitting}
                  />{" "}
                  {soundFile && (
                    <p className="text-xs text-emerald-600 mt-2 font-medium turkish-text emoji-fix">
                      ✓ Seçilen ses: {soundFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Gönder Butonu */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none turkish-text emoji-fix"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
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
                      ></path>{" "}
                    </svg>
                    Ekleniyor...
                  </span>
                ) : (
                  <span className="emoji-fix">✨ Kelimeyi Ekle</span>
                )}
              </button>{" "}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default KelimeEklePage;
