// DeviceViewer.js - View-only device display by gym
"use client"
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from '../api/firebase';

const DeviceViewer = ({ organizationId, userGyms }) => {
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState('all');

  useEffect(() => {
    if (organizationId && userGyms?.length > 0) {
      fetchDevices();
    }
  }, [organizationId, userGyms]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const devicesRef = collection(db, 'devices');
      const snapshot = await getDocs(devicesRef);
      
      const allDevices = [];
      snapshot.forEach((doc) => {
        allDevices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Filter only assigned devices for our organization's gyms
      const assigned = allDevices.filter(device => 
        device.organizationId === organizationId && 
        device.gymId && 
        userGyms.some(gym => gym.id === device.gymId)
      );

      setAssignedDevices(assigned);
      
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDevicesByGym = () => {
    if (selectedGym === 'all') {
      return assignedDevices;
    }
    return assignedDevices.filter(device => device.gymId === selectedGym);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inventory': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDevices = getDevicesByGym();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Device Overview</h1>
          <p className="text-slate-700 mt-1">View devices assigned to your gyms</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
          {assignedDevices.length} Total Devices
        </div>
      </div>

      {/* Device Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Gym Devices <span className="text-slate-600 font-normal">({filteredDevices.length})</span>
          </h3>
          <select
            value={selectedGym}
            onChange={(e) => setSelectedGym(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Gyms</option>
            {userGyms.map((gym) => (
              <option key={gym.id} value={gym.id}>{gym.name}</option>
            ))}
          </select>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-6 font-semibold text-slate-800 text-sm uppercase tracking-wider">Device Info</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800 text-sm uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800 text-sm uppercase tracking-wider">Gym Location</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800 text-sm uppercase tracking-wider">Network</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-slate-600">Loading devices...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-600 font-medium">No devices found</p>
                      <p className="text-slate-500 text-sm">No devices are currently assigned to the selected gym(s)</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-slate-900">Model: {device.modelNo}</div>
                        <div className="text-sm text-slate-600">Serial: {device.serial}</div>
                        {device.lens && (
                          <div className="text-xs text-slate-500">Lens: {device.lens}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                        {device.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{device.gymName || 'Unassigned'}</div>
                      <div className="text-sm text-slate-500">ID: {device.gymId}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-800">{device.ipAddress || 'Not configured'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {assignedDevices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">
              {assignedDevices.filter(d => d.status?.toLowerCase() === 'active').length}
            </div>
            <div className="text-sm text-green-600 font-medium">Active Devices</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {assignedDevices.filter(d => d.status?.toLowerCase() === 'maintenance').length}
            </div>
            <div className="text-sm text-yellow-600 font-medium">In Maintenance</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">
              {assignedDevices.filter(d => d.status?.toLowerCase() === 'inventory').length}
            </div>
            <div className="text-sm text-blue-600 font-medium">In Inventory</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-800">
              {userGyms.length}
            </div>
            <div className="text-sm text-slate-600 font-medium">Total Gyms</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceViewer;