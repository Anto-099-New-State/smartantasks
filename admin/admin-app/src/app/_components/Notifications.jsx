// _components/Notifications.js
import React from 'react';

const Notifications = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div>
            <p className="font-medium">New coach assigned to FitCore Downtown</p>
            <p className="text-sm text-gray-500">2 hours ago</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div>
            <p className="font-medium">Maintenance scheduled for PowerLift Pro</p>
            <p className="text-sm text-gray-500">1 day ago</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Notifications;
