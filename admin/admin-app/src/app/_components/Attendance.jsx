
// _components/Attendance.js
import React from 'react';

const Attendance = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Today's Check-ins</h3>
          <p className="text-2xl font-bold text-blue-600">247</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Active Members</h3>
          <p className="text-2xl font-bold text-green-600">1,850</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Peak Hours</h3>
          <p className="text-2xl font-bold text-purple-600">6-8 PM</p>
        </div>
      </div>
    </div>
  </div>
);

export default Attendance;