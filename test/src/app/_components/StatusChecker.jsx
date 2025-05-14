"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";

const FitnessController = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/start`);
      setIsCollecting(true);
      toast.success(res.data.message || "Data collection started");
    } catch (err) {
      toast.error("Error starting acquisition.");
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/stop`);
      setIsCollecting(false);
      toast.success(res.data.message || "Data collection stopped");
    } catch (err) {
      toast.error("Error stopping acquisition.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition"
          onClick={handleStart}
          disabled={isCollecting || loading}
        >
          Start
        </button>
        <button
          className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition"
          onClick={handleStop}
          disabled={!isCollecting || loading}
        >
          Stop
        </button>
      </div>
    </div>
  );
};

export default FitnessController;
