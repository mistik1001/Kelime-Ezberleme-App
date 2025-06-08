import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
          Ana Sayfa
        </h1>
        <p className="text-xl md:text-3xl text-gray-600 mb-8">
          Kelime ezberleme uygulamasına hoş geldiniz!
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Link
            to={isAuthenticated ? "/kelime-ekle" : "/login"}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 transform block"
          >
            <div className="text-indigo-600 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Kelime Ekle
            </h3>
            <p className="text-gray-600">
              Yeni kelimeler ekleyerek kelime hazneni genişlet
            </p>
          </Link>
          <Link
            to={isAuthenticated ? "/sinav" : "/login"}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 transform block"
          >
            <div className="text-green-600 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sınav</h3>
            <p className="text-gray-600">
              Öğrendiğin kelimeleri test et ve ilerlemeni takip et
            </p>
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-purple-600 text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Oyunlar
            </h3>
            <p className="text-gray-600 mb-4">
              Wordle ve kelime zinciri gibi eğlenceli oyunlarla öğren
            </p>
            <div className="space-y-2">
              <Link
                to={isAuthenticated ? "/wordle" : "/login"}
                className="block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 transform"
              >
                🔤 Wordle
              </Link>
              <Link
                to={isAuthenticated ? "/word-chain" : "/login"}
                className="block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 transform"
              >
                🔗 Kelime Zinciri
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
