// frontend/pages/LandingPage.jsx

import { Logo } from "../icons/Logo";
import { ShareIcon } from "../icons/ShareIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { TwitterIcon } from "../icons/TwitterIcon";
import { Navbar } from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("token")));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 overflow-y-scroll snap-y snap-mandatory">
        {/* Hero */}
        <section className="snap-start h-screen w-screen flex flex-col items-center justify-center bg-white text-gray-900 relative">
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-200 rounded-full opacity-30 animate-pulse" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-200 rounded-full opacity-25 animate-pulse" />

          <div className="max-w-2xl text-center px-6">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              A Second Brain for the Content Era
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-700">
              Save, organize, and share your favorite YouTube videos and tweets
              in one space—your digital memory.
            </p>

            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-purple-600 text-white font-semibold px-8 py-4 rounded-full shadow-xl transition transform hover:-translate-y-1 active:scale-95"
              >
                Go to Dashboard
              </button>
            ) : (
              <Link to="/signup">
                <button className="bg-purple-600 text-white font-semibold px-8 py-4 rounded-full shadow-xl transition transform hover:-translate-y-1 active:scale-95">
                  Create Your Second Brain
                </button>
              </Link>
            )}

            <div className="mt-12 flex justify-center">
              <div className="w-10 h-16 border-2 border-purple-500 rounded-full flex items-start justify-center p-1 shadow-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="snap-start h-screen w-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center">
            What can Brainly do?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl w-full">
            {[
              {
                icon: <TwitterIcon />,
                title: "Save Tweets",
                desc: "Bookmark and revisit insightful tweets/X posts instantly.",
              },
              {
                icon: (
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                ),
                title: "Organize Content",
                desc: "Tag, categorize, and find your saved items with powerful search.",
              },
              {
                icon: <YoutubeIcon />,
                title: "Curate Videos",
                desc: "Never lose a great YouTube video—add and search your library.",
              },
              {
                icon: <ShareIcon />,
                title: "Share Instantly",
                desc: "Share your second brain with one link and collaborate.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">
                  {feature.title}
                </h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo />
            <span className="ml-2 text-2xl font-bold text-gray-800">
              Brainly
            </span>
          </div>
          <nav className="flex space-x-6 mb-4 md:mb-0">
            {["Github", "X", "LinkedIn"].map((label) => {
              const href =
                label === "Github"
                  ? "https://github.com"
                  : label === "X"
                  ? "https://x.com"
                  : "https://linkedin.com";
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  {label}
                </a>
              );
            })}
          </nav>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Brainly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
