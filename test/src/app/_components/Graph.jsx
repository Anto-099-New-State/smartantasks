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

// Generate filter options
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function WorkoutGraph() {
  const [data, setData] = useState([]);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6 bg-gray-900 text-white shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Workout Progress (Line Chart)</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <select name="month" value={filters.month} onChange={handleChange} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Month</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select name="day" value={filters.day} onChange={handleChange} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Day</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select name="hour" value={filters.hour} onChange={handleChange} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Hour</option>
            {hours.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(Math.floor(data.length / 8), 1)} height={50} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }} labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#f9fafb' }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ color: '#e5e7eb' }} />
            <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={false} name="Weight (kg)" />
            <Line type="monotone" dataKey="reps" stroke="#f97316" strokeWidth={2} dot={false} name="Reps" />
            <Brush dataKey="timestamp" height={30} stroke="#6366f1" travellerWidth={10} tickFormatter={(v) => v.split(',')[1]} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}