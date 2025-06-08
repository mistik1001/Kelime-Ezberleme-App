// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // NavLink için aktif stil
  const activeLinkClass = "text-blue-400 bg-gray-700";
  const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const baseLinkClass =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";

  return (
    <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Ana Sayfa Linki */}
          <div className="flex-shrink-0">
            {" "}
            <Link
              to="/"
              className="text-white text-xl font-bold hover:text-blue-400 transition-colors turkish-text"
            >
              Kelime Ezberle
            </Link>
          </div>

          {/* Desktop Navigasyon */}
          <div className="hidden md:flex flex-grow items-center justify-center">
            {isAuthenticated && (
              <div className="flex items-baseline space-x-4">
                {" "}
                <NavLink
                  to="/kelime-ekle"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Kelime Ekle
                </NavLink>
                <NavLink
                  to="/sinav"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Sınav
                </NavLink>{" "}
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Raporlar
                </NavLink>
                <NavLink
                  to="/learned-words"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Öğrenilenler
                </NavLink>
                <NavLink
                  to="/wordle"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Wordle
                </NavLink>
                <NavLink
                  to="/word-chain"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Kelime Zinciri
                </NavLink>
              </div>
            )}
          </div>

          {/* Desktop Auth Links */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    } turkish-text`
                  }
                >
                  Ayarlar
                </NavLink>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300 text-sm turkish-text">
                  Merhaba, {currentUser?.username || "Kullanıcı"}!
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 turkish-text"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 turkish-text"
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 turkish-text"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
            >
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-700 rounded-b-lg">
            {isAuthenticated ? (
              <>
                <div className="text-gray-300 px-3 py-2 text-sm">
                  Merhaba, {currentUser?.username || "Kullanıcı"}!
                </div>
                <NavLink
                  to="/kelime-ekle"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kelime Ekle
                </NavLink>
                <NavLink
                  to="/sinav"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sınav
                </NavLink>{" "}
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Raporlar
                </NavLink>
                <NavLink
                  to="/learned-words"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Öğrenilenler
                </NavLink>
                <NavLink
                  to="/wordle"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wordle
                </NavLink>
                <NavLink
                  to="/word-chain"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kelime Zinciri
                </NavLink>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `block ${baseLinkClass} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ayarlar
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>{" "}
      </div>
    </nav>
  );
}

export default Navbar;
