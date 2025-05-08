"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000"; // Change if hosted elsewhere

const FitnessController = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/start`);
      setIsCollecting(true);
      setMsg(res.data.message);
    } catch (err) {
      setMsg("Error starting acquisition.");
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/stop`);
      setIsCollecting(false);
      setMsg(res.data.message);
    } catch (err) {
      setMsg("Error stopping acquisition.");
    }
    setLoading(false);
  };

  const fetchLatest = async () => {
    try {
      const res = await axios.get(`${API_BASE}/latest`);
      setLatestData(res.data);
    } catch (err) {
      setLatestData(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchLatest, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div >
      <div style={styles.buttons}>
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

      {msg && <p>{msg}</p>}

      
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    maxWidth: "400px",
    margin: "auto",
    textAlign: "center",
    background: "#f4f4f4",
    borderRadius: "10px",
    position: "relative",
  },
  buttons: {
    position: "absolute",
    top: "20px",
    right: "28px",
    display: "flex",
    flexDirection: "row",
    gap: "10px",
  },
  dataBox: {
    marginTop: "80px", // Gives space below the buttons
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 0 5px rgba(0,0,0,0.1)",
  },
};

export default FitnessController;
