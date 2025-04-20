// pages/Home.jsx
import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Home = () => {
  const handleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://img.freepik.com/premium-vector/number-math-equation-whiteboard-with-student-classroom_1639-47626.jpg?w=1060')",
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700 mb-1">Mathify</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-800">Welcome Back 👋</h2>
        <p className="text-sm text-gray-500">Log in to continue learning</p>

        <button className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300">
          <svg
            className="w-5 h-5"
            viewBox="0 0 488 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#EA4335"
              d="M488 261.8c0-17.8-1.5-35-4.3-51.7H249v97.8h134.5c-5.8 31-23.2 57.3-49.4 75.2l79.7 62.1c46.6-43 73.2-106.3 73.2-183.4z"
            />
            <path
              fill="#34A853"
              d="M249 508c66.3 0 121.9-21.9 162.5-59.4l-79.7-62.1c-22.1 14.9-50.5 23.7-82.8 23.7-63.6 0-117.6-42.9-136.9-100.6H30.1v62.9C70.8 451.1 153.2 508 249 508z"
            />
            <path
              fill="#4A90E2"
              d="M112.1 309.6C106.5 292.4 103.2 274 103.2 255s3.3-37.4 8.9-54.6V137.5H30.1C10.8 174.9 0 213.9 0 255s10.8 80.1 30.1 117.5l82-63z"
            />
            <path
              fill="#FBBC05"
              d="M249 100.5c36.2 0 68.6 12.4 94.1 36.8l70.6-70.6C370.9 25.1 316.2 0 249 0 153.2 0 70.8 56.9 30.1 137.5l82 63c19.3-57.7 73.3-100.6 136.9-100.6z"
            />
          </svg>
          <span className="text-gray-700 font-medium" onClick={handleSignIn}>
            Sign in with Google
          </span>
        </button>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Mathify
        </p>
      </div>
    </div>
  );
};

export default Home;
