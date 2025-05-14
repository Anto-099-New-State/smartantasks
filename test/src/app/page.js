"use client";
import React, { useState } from "react";
import { Menu, X, Dumbbell } from "lucide-react";
import FitnessChart from "./_components/Graph";
import FitnessController from "./_components/StatusChecker";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-900 to-gray-800 text-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-indigo-400" />
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-600">
              SmartanFittech
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6">
            {["Dashboard", "Workouts", "Settings"].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-indigo-300 transition"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-gray-100" />
            ) : (
              <Menu className="w-6 h-6 text-gray-100" />
            )}
          </button>
        </div>

        {/* Mobile Menu Links */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            {["Dashboard", "Workouts", "Settings"].map((item) => (
              <a
                key={item}
                href="#"
                className="block text-sm py-2 px-3 rounded hover:bg-indigo-500 transition"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex justify-center items-start w-full">
        <div className="w-full max-w-7xl p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Centered Section */}
          <section className="lg:col-span-9 lg:col-start-3 space-y-8 flex flex-col items-center">
            {/* Chart Card */}
            <div className="w-full bg-gray-700/40 backdrop-blur-lg p-4 md:p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-xl md:text-2xl font-semibold text-center md:text-left">
                  Workout Progress Over Time
                </h2>
                <FitnessController />
              </div>
              <FitnessChart />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
