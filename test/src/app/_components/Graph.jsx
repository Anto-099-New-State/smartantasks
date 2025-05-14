"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Brush,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function WorkoutGraph() {
  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [filters, setFilters] = useState({ month: "", day: "", hour: "" });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (filters.month) params.append("month", filters.month);
    if (filters.day) params.append("day", filters.day);
    if (filters.hour) params.append("hour", filters.hour);
    const res = await fetch(`http://localhost:3000/api/data?${params.toString()}`);
    const json = await res.json();
    const formatted = json.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleString(),
      weight: item.weight,
      reps: item.rep_count,
    }));
    setData(formatted);
  };

  useEffect(() => {
    const updateDisplay = () => {
      const width = window.innerWidth;
      const limit = width < 640 ? 10 : 30;
      setDisplayData(data.slice(-limit));
    };
    updateDisplay();
    window.addEventListener("resize", updateDisplay);
    return () => window.removeEventListener("resize", updateDisplay);
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6 bg-gray-900 text-white shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-lg sm:text-xl">Workout Progress (Line Chart)</CardTitle>
        <div className="flex flex-wrap gap-2">
          {[{ name: "month", opts: months }, { name: "day", opts: days }, { name: "hour", opts: hours }].map(({ name, opts }) => (
            <select
              key={name}
              name={name}
              value={filters[name]}
              onChange={handleChange}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{name.charAt(0).toUpperCase() + name.slice(1)}</option>
              {opts.map(v => (
                <option key={v} value={v}>
                  {name === "hour" ? `${v}:00` : v}
                </option>
              ))}
            </select>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[280px] sm:h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                height={50}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "4px",
                }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#f9fafb" }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ color: "#e5e7eb" }} />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={false} name="Weight (kg)" />
              <Line type="monotone" dataKey="reps" stroke="#f97316" strokeWidth={2} dot={false} name="Reps" />
              <Brush dataKey="timestamp" height={30} stroke="#6366f1" travellerWidth={10} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
