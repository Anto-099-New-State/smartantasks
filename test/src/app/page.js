import React from "react";
import Image from "next/image";
import { Menu, X, Dumbbell, Activity } from "lucide-react";
import FitnessChart from "./_components/Graph";
import FitnessController from "./_components/StatusChecker";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-900 to-gray-800 text-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <Dumbbell className="w-8 h-8 text-indigo-400" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-600">
            SmartanFittech
          </span>
        </div>
        <div className="hidden md:flex space-x-6">
          {['Dashboard','Workouts','Settings'].map(item => (
            <a key={item} href="#" className="hover:text-indigo-300 transition">
              {item}
            </a>
          ))}
        </div>
        <button className="md:hidden">
          <Menu className="w-6 h-6 text-gray-100" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex justify-center items-start w-full">
        <div className="w-full max-w-7xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart & Controls centered */}
          <section className="lg:col-span-9 lg:col-start-3 space-y-8 flex flex-col items-center">

            {/* Graph Card with inline buttons */}
            <div className="w-full bg-gray-700/40 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-center lg:text-left">Workout Progress Over Time</h2>
                <div className="space-x-2">
                  <div  >
                  <FitnessController/>

                    </div>
                </div>
              </div>
              <FitnessChart />
            </div>


          </section>
        </div>
      </main>
    </div>
  );
}
