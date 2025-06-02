// components/Hardware.jsx - Complete Version with Firestore Integration
import React, { useState } from 'react';

const Hardware = ({ 
  organizations = [], 
  devices = [], 
  onCreateDevice, 
  onUpdateDevice, 
  onDeleteDevice,
  isLoading = false
}) => {
  // Hardware tab state (Camera or Sensor)
  const [activeHardwareTab, setActiveHardwareTab] = useState('Camera');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [organizationFilter, setOrganizationFilter] = useState('All');

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceType: activeHardwareTab.toLowerCase(),
    organization: 'Unassigned',
    organizationId: null,
    ipAddress: '',
    modelNo: '',
    lens: '',
    stickerStatus: 'Pending',
    testedBy: 'update status',
    testingStatus: 'not tested yet',
    testingDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Get filtered devices based on active tab and filters
  const getFilteredDevices = () => {
    let filteredDevices = devices.filter(device => 
      device.deviceType === activeHardwareTab.toLowerCase()
    );

    // Apply search filter
    if (searchTerm) {
      filteredDevices = filteredDevices.filter(device =>
        device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.modelNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filteredDevices = filteredDevices.filter(device => 
        device.status === statusFilter
      );
    }

    // Apply organization filter
    if (organizationFilter !== 'All') {
      if (organizationFilter === 'Unassigned') {
        filteredDevices = filteredDevices.filter(device => 
          device.organization === 'Unassigned' || !device.organization
        );
      } else {
        filteredDevices = filteredDevices.filter(device => 
          device.organization === organizationFilter
        );
      }
    }

    return filteredDevices;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If organization is selected, also set organizationId
    if (name === 'organization') {
      if (value === 'Unassigned') {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          organizationId: null
        }));
      } else {
        const selectedOrg = organizations.find(org => org.name === value);
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          organizationId: selectedOrg ? selectedOrg.id : null
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle adding new device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Find the selected organization
      const selectedOrg = formData.organization !== 'Unassigned' 
        ? organizations.find(org => org.name === formData.organization)
        : null;
      
      const newDevice = {
        deviceName: formData.deviceId,
        serial: Math.random().toString().substring(2, 12),
        deviceType: activeHardwareTab.toLowerCase(),
        stickerStatus: formData.stickerStatus,
        ipAddress: formData.ipAddress,
        testing: formData.testingStatus,
        organization: formData.organization,
        organizationId: selectedOrg ? selectedOrg.id : null,
        status: 'Inventory', // Default status for new devices
        modelNo: formData.modelNo,
        lens: formData.lens || 'N/A',
        avatar: activeHardwareTab === 'Camera' ? '📷' : '📊'
      };
      
      // Call the parent's create function (this will handle Firestore)
      await onCreateDevice(newDevice);
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing device
  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceName,
      deviceType: device.deviceType,
      organization: device.organization || 'Unassigned',
      organizationId: device.organizationId,
      ipAddress: device.ipAddress,
      modelNo: device.modelNo,
      lens: device.lens,
      stickerStatus: device.stickerStatus,
      testedBy: 'update status',
      testingStatus: device.testing,
      testingDate: device.testingDate || new Date().toISOString().split('T')[0],
      remarks: device.remarks || ''
    });
    setIsModalOpen(true);
  };

  // Handle updating device
  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Find the selected organization
      const selectedOrg = formData.organization !== 'Unassigned' 
        ? organizations.find(org => org.name === formData.organization)
        : null;
      
      const updatedDevice = {
        ...editingDevice,
        deviceName: formData.deviceId,
        organization: formData.organization,
        organizationId: selectedOrg ? selectedOrg.id : null,
        ipAddress: formData.ipAddress,
        modelNo: formData.modelNo,
        lens: formData.lens,
        stickerStatus: formData.stickerStatus,
        testing: formData.testingStatus
      };
      
      // Call the parent's update function (this will handle Firestore)
      await onUpdateDevice(updatedDevice);
      
      setIsModalOpen(false);
      setEditingDevice(null);
      resetForm();
    } catch (error) {
      console.error('Error updating device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting device
  const handleDeleteDevice = async (deviceId) => {
    try {
      // Call the parent's delete function (this will handle Firestore)
      await onDeleteDevice(deviceId);
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  // Handle opening modal for new device
  const handleNewDevice = () => {
    setEditingDevice(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Reset form helper
  const resetForm = () => {
    setFormData({
      deviceId: '', 
      deviceType: activeHardwareTab.toLowerCase(), 
      organization: 'Unassigned',
      organizationId: null,
      ipAddress: '', 
      modelNo: '', 
      lens: '',
      stickerStatus: 'Pending', 
      testedBy: 'update status', 
      testingStatus: 'not tested yet', 
      testingDate: new Date().toISOString().split('T')[0], 
      remarks: ''
    });
  };

  // Get status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Inventory': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestingColor = (testing) => {
    switch (testing) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'not tested yet': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredDevices = getFilteredDevices();
  const deviceCounts = {
    camera: devices.filter(d => d.deviceType === 'camera').length,
    sensor: devices.filter(d => d.deviceType === 'sensor').length
  };

  // Get inventory stats
  const inventoryStats = {
    total: devices.length,
    unassigned: devices.filter(d => d.organization === 'Unassigned' || !d.organization).length,
    assigned: devices.filter(d => d.organization && d.organization !== 'Unassigned').length,
    inventory: devices.filter(d => d.status === 'Inventory').length
  };

  // Loading state component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading devices...</span>
    </div>
  );

  return (
    <div className="p-6">
      
      {/* Hardware Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Hardware Inventory</h1>
        <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
          Device Inventory Management
        </span>
        {isLoading && (
          <div className="mt-2 text-sm text-blue-600">
            🔄 Syncing with Firestore...
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Devices</h3>
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : inventoryStats.total}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Unassigned</h3>
          <p className="text-2xl font-bold text-orange-600">
            {isLoading ? '...' : inventoryStats.unassigned}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned</h3>
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : inventoryStats.assigned}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">In Inventory</h3>
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? '...' : inventoryStats.inventory}
          </p>
        </div>
      </div>

      {/* Hardware Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['Camera', 'Sensor'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveHardwareTab(tab);
                  setSearchTerm(''); // Reset search when switching tabs
                  setStatusFilter('All'); // Reset filters
                  setOrganizationFilter('All');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeHardwareTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {tab === 'Camera' ? '📷' : '📊'}
                  </span>
                  {tab}s ({isLoading ? '...' : deviceCounts[tab.toLowerCase()]})
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-80">
              <input
                type="text"
                placeholder={`Search ${activeHardwareTab.toLowerCase()}s by name, serial, IP, model...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="All">All Status</option>
              <option value="Inventory">Inventory</option>
              <option value="Active">Active</option>
              <option value="Assigned">Assigned</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Organization Filter */}
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="All">All Assignments</option>
              <option value="Unassigned">Unassigned</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Add Device Button */}
            <button
              onClick={handleNewDevice}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">+</span>
              Add {activeHardwareTab}
            </button>
          </div>

          {/* Filter Results Info */}
          <div className="mt-4 text-sm text-gray-600">
            {isLoading ? (
              'Loading device data...'
            ) : (
              <>
                Showing {filteredDevices.length} of {devices.filter(d => d.deviceType === activeHardwareTab.toLowerCase()).length} {activeHardwareTab.toLowerCase()}s
                {searchTerm && ` matching "${searchTerm}"`}
                {statusFilter !== 'All' && ` with status "${statusFilter}"`}
                {organizationFilter !== 'All' && ` ${organizationFilter === 'Unassigned' ? 'unassigned' : `assigned to "${organizationFilter}"`}`}
              </>
            )}
          </div>
        </div>

        {/* Device Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Device Info
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Assignment
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  IP Address
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Testing
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Model
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {device.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{device.deviceName}</div>
                          <div className="text-sm text-gray-500">{device.serial}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        device.organization === 'Unassigned' || !device.organization
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {device.organization || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {device.ipAddress || 'Not set'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getTestingColor(device.testing)}`}>
                        {device.testing}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {device.modelNo || 'Not specified'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditDevice(device)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit device"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteDevice(device.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete device"
                        >
                          🗑️
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="More options"
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">
                      {activeHardwareTab === 'Camera' ? '📷' : '📊'}
                    </div>
                    <div className="text-lg mb-1">No {activeHardwareTab.toLowerCase()}s found</div>
                    <div className="text-sm">
                      {searchTerm || statusFilter !== 'All' || organizationFilter !== 'All'
                        ? 'Try adjusting your search or filters'
                        : `Add your first ${activeHardwareTab.toLowerCase()} to the inventory`
                      }
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 text-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingDevice ? 'Edit' : 'Add'} {activeHardwareTab} to Inventory
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDevice(null);
                }}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            {/* Device Form */}
            <form onSubmit={editingDevice ? handleUpdateDevice : handleAddDevice} className="space-y-4">
              
              {/* Device ID and Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Device ID *</label>
                  <input
                    type="text"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    placeholder={`${activeHardwareTab.substring(0,3).toUpperCase()}-01`}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Assignment</label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="Unassigned">Unassigned (Inventory)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IP Address and Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-blue-400">IP Address</label>
                  <input
                    type="text"
                    name="ipAddress"
                    value={formData.ipAddress}
                    onChange={handleInputChange}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Model No</label>
                  <input
                    type="text"
                    name="modelNo"
                    value={formData.modelNo}
                    onChange={handleInputChange}
                    placeholder="Model number"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Lens (only for cameras) */}
              {activeHardwareTab === 'Camera' && (
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Lens</label>
                  <input
                    type="text"
                    name="lens"
                    value={formData.lens}
                    onChange={handleInputChange}
                    placeholder="in mm"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Status Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Sticker Status</label>
                  <select
                    name="stickerStatus"
                    value={formData.stickerStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Applied">Applied</option>
                    <option value="Not Applied">Not Applied</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-blue-400">Testing Status</label>
                  <select
                    name="testingStatus"
                    value={formData.testingStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="not tested yet">Not tested yet</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium mt-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingDevice ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  `${editingDevice ? 'Update' : 'Add'} ${activeHardwareTab}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hardware;