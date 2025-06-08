// src/components/Footer.jsx
import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-400 mt-auto">
      <div className="container mx-auto py-4 px-5 text-center">
        <p className="text-sm">
          &copy; {currentYear} Kelime Ezberleme Uygulaması. Tüm hakları saklıdır.
        </p>
        <p className="text-xs mt-1">
          Mustafa Yüksel tarafından geliştirilmiştir.
        </p>
      </div>
    </footer>
  );
}

export default Footer;