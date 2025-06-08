// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Kullanıcı objesi: { id, username, email, newWordsPerQuiz }
  const [loadingAuth, setLoadingAuth] = useState(true); // Başlangıçta kimlik doğrulama durumu yükleniyor olabilir

  // TODO: Uygulama ilk yüklendiğinde localStorage'dan veya ana işlemden kullanıcıyı kontrol etme eklenebilir.
  // useEffect(() => {
  //   const storedUser = localStorage.getItem('currentUser');
  //   if (storedUser) {
  //     setCurrentUser(JSON.parse(storedUser));
  //   }
  //   setLoadingAuth(false);
  // }, []);

  const login = (userData) => {
    // userData: { id, username, email, newWordsPerQuiz }
    setCurrentUser(userData);
    // localStorage.setItem('currentUser', JSON.stringify(userData)); // İsteğe bağlı
    console.log("AuthContext: Kullanıcı giriş yaptı ve ayarları yüklendi:", userData);
  };

  const logout = () => {
    setCurrentUser(null);
    // localStorage.removeItem('currentUser');
    console.log("AuthContext: Kullanıcı çıkış yaptı.");
  };

  // Kullanıcının ayarlarını context içinde güncellemek için bir fonksiyon
  const updateUserSettingsInContext = (settings) => {
    if (currentUser && settings && typeof settings.newWordsPerQuiz !== 'undefined') {
      setCurrentUser(prevUser => ({
        ...prevUser,
        newWordsPerQuiz: parseInt(settings.newWordsPerQuiz, 10)
      }));
      console.log("AuthContext: Kullanıcı ayarları güncellendi:", settings);
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loadingAuth, // Yükleme durumunu da paylaşabiliriz
    login,
    logout,
    updateUserSettingsInContext, // Yeni fonksiyonu ekle
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
