// pages/Home.jsx
import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Home = () => {
  const handleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white">
      <h1
        className="text-7xl font-bold text-black mb-8"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        MATHIFY
      </h1>
      <button
        onClick={handleSignIn}
        className="bg-white text-black border border-gray-300 shadow px-6 py-2 rounded hover:shadow-md transition"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Home;
