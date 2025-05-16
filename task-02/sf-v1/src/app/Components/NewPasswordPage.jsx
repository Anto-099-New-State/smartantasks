"use client";

import React, { useState } from "react";
import { ArrowBigLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";

const NewPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    alert("Password updated successfully!");
  };

  return (
    <div className="min-h-screen bg-[url('')] flex items-center justify-between px-30  bg-gradient-to-br from-green-950 to-black text-white relative">

       <div className="absolute top-8 left-6 bg-white text-sm font-medium border rounded-4xl p-3 cursor-pointer">
     <span className="text-green-600 text-2xl">
       <ArrowBigLeft />
     </span>      </div>

      {/* Form Section */}
      <div className="max-w-sm w-full sm: w-80">
        <h2 className="text-2xl font-bold text-[#A4FEB7] mb-2">
          Set a new password
        </h2>
        <p className="text-sm mb-6">
          Create a new password. Ensure it differs from previous ones for security
        </p>

        <div className="space-y-4">
          <label htmlFor="password" className="text-sm">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-md text-white ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        <label htmlFor="confirm password" className="text-sm">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-3 rounded-md  text-white ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          //onClick={handleSubmit}
          className="mt-6 w-full bg-[#A4FEB7] hover:bg-green-100 text-black py-3 rounded-full font-semibold transition"
        >
            <Link href="/conf-pag" className="no-underline">Update Password</Link>
        </button>
      </div>

     
    </div>
  );
};

export default NewPasswordPage;
