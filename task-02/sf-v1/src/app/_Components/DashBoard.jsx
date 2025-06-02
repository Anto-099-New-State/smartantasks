"use client"
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainTable from './MainTable';
import OrganizationModal from './OrganizationModel';
import Hardware from './HardWare';

const Dashboard = () => {
  // Active tab state for navigation
  const [activeTab, setActiveTab] = useState('Organization');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Organization data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Mayoraiven',
      email: 'info@mayoraiven.com',
      role: 'Administrator',
      status: 'Active',
      tags: ['Marketing'],
      avatar: 'M',
      firstName: 'Mayor',
      lastName: 'Aiven',
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'San Francisco',
      state: 'California',
      zip: '94102'
    },
    {
      id: 2,
      name: 'Lionesse Yami',
      email: 'l.yami@emviul.com',
      role: 'Human resources',
      status: 'Active',
      tags: ['Marketing'],
      avatar: 'L',
      firstName: 'Lionesse',
      lastName: 'Yami',
      address1: '456 Oak Ave',
      address2: '',
      city: 'Los Angeles',
      state: 'California',
      zip: '90210'
    },
    {
      id: 3,
      name: 'Christian Chang',
      email: 'c.chang@emviul.com',
      role: 'Product Designer',
      status: 'Onboarding',
      tags: ['Marketing'],
      avatar: 'C',
      firstName: 'Christian',
      lastName: 'Chang',
      address1: '789 Pine St',
      address2: 'Apt 5B',
      city: 'Seattle',
      state: 'Washington',
      zip: '98101'
    },
    {
      id: 4,
      name: 'Jade Solis',
      email: 'j.solis@emviul.com',
      role: 'UI Designer',
      status: 'Active',
      tags: ['Marketing'],
      avatar: 'J',
      firstName: 'Jade',
      lastName: 'Solis',
      address1: '321 Elm St',
      address2: '',
      city: 'Austin',
      state: 'Texas',
      zip: '78701'
    },
    {
      id: 5,
      name: 'Claude Bowman',
      email: 'c.bowman@emviul.com',
      role: 'UX Designer',
      status: 'Onboarding',
      tags: ['Marketing'],
      avatar: 'C',
      firstName: 'Claude',
      lastName: 'Bowman',
      address1: '654 Maple Ave',
      address2: 'Floor 3',
      city: 'Denver',
      state: 'Colorado',
      zip: '80202'
    },
    {
      id: 6,
      name: 'Mone Lara',
      email: 'm.lara@emviul.com',
      role: 'Accounting',
      status: 'Active',
      tags: ['Marketing'],
      avatar: 'M',
      firstName: 'Mone',
      lastName: 'Lara',
      address1: '987 Cedar Rd',
      address2: '',
      city: 'Miami',
      state: 'Florida',
      zip: '33101'
    },
    {
      id: 7,
      name: 'Brooke Barber',
      email: 'b.barber@emviul.com',
      role: 'Devops',
      status: 'Active',
      tags: ['Marketing'],
      avatar: 'B',
      firstName: 'Brooke',
      lastName: 'Barber',
      address1: '147 Birch St',
      address2: 'Unit 12',
      city: 'Chicago',
      state: 'Illinois',
      zip: '60601'
    },
    {
      id: 8,
      name: 'Ayesha Drake',
      email: 'a.drake@emviul.com',
      role: 'Backend',
      status: 'Inactive',
      tags: ['Marketing'],
      avatar: 'A',
      firstName: 'Ayesha',
      lastName: 'Drake',
      address1: '258 Spruce Ave',
      address2: '',
      city: 'Boston',
      state: 'Massachusetts',
      zip: '02101'
    },
    {
      id: 9,
      name: 'Arnold Warren',
      email: 'a.warren@emviul.com',
      role: 'Sales manager',
      status: 'Inactive',
      tags: ['Marketing'],
      avatar: 'A',
      firstName: 'Arnold',
      lastName: 'Warren',
      address1: '369 Willow Ln',
      address2: 'Apt 7A',
      city: 'Portland',
      state: 'Oregon',
      zip: '97201'
    }
  ]);

  // Hardware devices state - moved to Dashboard level for shared access
  const [devices, setDevices] = useState([
    // Camera devices
    {
      id: 1,
      deviceName: 'Cam-01',
      serial: '5684236528',
      deviceType: 'camera',
      stickerStatus: 'Pending',
      ipAddress: '192.168.9.1',
      testing: 'not tested yet',
      organization: 'Mayoraiven',
      organizationId: 1,
      status: 'Active',
      modelNo: 'CAM-4K-001',
      lens: '8mm',
      avatar: '📷',
      createdDate: '2024-01-15'
    },
    {
      id: 2,
      deviceName: 'Cam-02',
      serial: '5684236527',
      deviceType: 'camera',
      stickerStatus: 'Applied',
      ipAddress: '216.72.16.8',
      testing: 'passed',
      organization: 'Lionesse Yami',
      organizationId: 2,
      status: 'Active',
      modelNo: 'CAM-4K-002',
      lens: '12mm',
      avatar: '📷',
      createdDate: '2024-02-20'
    },
    // Sensor devices
    {
      id: 3,
      deviceName: 'Sen-01',
      serial: '9876543210',
      deviceType: 'sensor',
      stickerStatus: 'Applied',
      ipAddress: '192.168.1.50',
      testing: 'passed',
      organization: 'Christian Chang',
      organizationId: 3,
      status: 'Active',
      modelNo: 'TEMP-001',
      lens: 'N/A',
      avatar: '🌡️',
      createdDate: '2024-03-10'
    }
  ]);

  // CRUD Operations for Organizations
  const handleCreateUser = async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id)) + 1
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    console.log('User created:', newUser);
  };

  const handleUpdateUser = async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userData.id ? userData : user
      )
    );
    console.log('User updated:', userData);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Also update devices that belong to this organization
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.organizationId === userId 
            ? { ...device, organization: 'Unassigned', organizationId: null }
            : device
        )
      );
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      console.log('User deleted:', userId);
    }
  };

  // CRUD Operations for Devices (to be passed to Hardware component)
  const handleCreateDevice = (deviceData) => {
    const newDevice = {
      ...deviceData,
      id: Math.max(...devices.map(d => d.id)) + 1,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    setDevices(prevDevices => [...prevDevices, newDevice]);
    console.log('Device created:', newDevice);
  };

  const handleUpdateDevice = (deviceData) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceData.id ? deviceData : device
      )
    );
    console.log('Device updated:', deviceData);
  };

  const handleDeleteDevice = (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
      console.log('Device deleted:', deviceId);
    }
  };

  // Modal handlers
  const handleNewOrganization = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmitModal = async (userData) => {
    if (editingUser) {
      await handleUpdateUser(userData);
    } else {
      await handleCreateUser(userData);
    }
  };

  // Get statistics for dashboard
  const getStats = () => {
    const activeDevices = devices.filter(d => d.status === 'Active').length;
    const totalDevices = devices.length;
    const devicesByOrg = devices.reduce((acc, device) => {
      acc[device.organization] = (acc[device.organization] || 0) + 1;
      return acc;
    }, {});

    return {
      organizations: users.length,
      activeUsers: users.filter(u => u.status === 'Active').length,
      onboardingUsers: users.filter(u => u.status === 'Onboarding').length,
      totalDevices,
      activeDevices,
      cameras: devices.filter(d => d.deviceType === 'camera').length,
      sensors: devices.filter(d => d.deviceType === 'sensor').length,
      devicesByOrg
    };
  };

  const stats = getStats();

  // Function to render content based on active tab
  const renderActiveContent = () => {
    console.log(activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
              <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                Overview and Analytics
              </span>
            </div>
            
            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Organizations</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.organizations}</p>
                <p className="text-xs text-gray-400">{stats.activeUsers} active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Devices</h3>
                <p className="text-2xl font-bold text-green-600">{stats.totalDevices}</p>
                <p className="text-xs text-gray-400">{stats.activeDevices} active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Cameras</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.cameras}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sensors</h3>
                <p className="text-2xl font-bold text-orange-600">{stats.sensors}</p>
              </div>
            </div>

            {/* Device Distribution by Organization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Devices by Organization</h3>
                <div className="space-y-3">
                  {Object.entries(stats.devicesByOrg).map(([org, count]) => (
                    <div key={org} className="flex items-center justify-between">
                      <span className="text-gray-700">{org}</span>
                      <span className="font-medium">{count} devices</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">New device added to {devices[devices.length - 1]?.organization || 'system'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{stats.activeUsers} organizations are active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{stats.onboardingUsers} users in onboarding</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveTab('Organization')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    🏢
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Organizations</div>
                    <div className="text-sm text-gray-500">Add or edit organizations</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('Hardware')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    📷
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Hardware Management</div>
                    <div className="text-sm text-gray-500">Manage IoT devices</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'Organization':
        return (
          <>
            <Header 
              title="Organizations" 
              count={users.length} 
              onNewClick={handleNewOrganization}
            />
            
            <MainTable 
              data={users}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />

            <OrganizationModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={handleSubmitModal}
              initialData={editingUser}
            />
          </>
        );

      case 'Hardware':
        return (
          <Hardware 
            organizations={users}
            devices={devices}
            onCreateDevice={handleCreateDevice}
            onUpdateDevice={handleUpdateDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        );

      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
            <p className="text-gray-600">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Pass activeTab and setActiveTab to Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Render the active content */}
        {renderActiveContent()}
      </div>
    </div>
  );
};

export default Dashboard;