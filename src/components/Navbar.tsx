// frontend/components/Navbar.jsx

import { Logo } from "../icons/Logo";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Detect scroll for shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check auth state
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  function handleLogout() {
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/");
  }

  function handleBrandClick() {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }

  return (
    <nav
      className={`
        fixed top-4 left-8 right-8 z-50
        bg-white/80 backdrop-blur-md rounded-xl
        transition-shadow duration-300
        ${isScrolled ? "shadow-2xl" : "shadow-lg"}
      `}
    >
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Center: Brand Title */}
        <button
          onClick={handleBrandClick}
          className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold text-purple-600 hover:underline focus:outline-none"
        >
          Brainly
        </button>

        {/* Right: Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-purple-600 font-medium transition"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Sign Up
              </Link>
              <Link
                to="/signin"
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-800 text-2xl focus:outline-none"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`
          md:hidden
          bg-white/95 backdrop-blur-sm rounded-b-xl
          overflow-hidden transition-all duration-300
          ${menuOpen ? "max-h-52 py-4" : "max-h-0"}
        `}
      >
        <div className="flex flex-col space-y-2 px-6">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="block text-gray-700 hover:text-purple-600 font-medium transition py-2 text-left"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="block text-gray-700 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                to="/signin"
                className="block text-gray-700 hover:text-purple-600 font-medium transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
