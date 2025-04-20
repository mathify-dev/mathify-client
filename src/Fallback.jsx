// pages/Fallback.jsx
import React from 'react';

const Fallback = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white">
      <h1 className="text-7xl font-bold text-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
        MATHIFY
      </h1>
      <div className="bg-red-100 text-red-700 p-6 rounded shadow w-[90%] max-w-md text-center">
        <h2 className="font-semibold mb-2 text-xl">Could not authenticate user</h2>
        <p>Please contact the site Admins for further information.</p>
      </div>
    </div>
  );
};

export default Fallback;
