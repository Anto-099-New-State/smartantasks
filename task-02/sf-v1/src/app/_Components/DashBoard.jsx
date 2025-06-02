"use client"
import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import MainTable from './MainTable';
import OrganizationModal from './OrganizationModel';
import Hardware from './HardWare';

// Firestore imports
import { db } from '../api/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy 
} from "firebase/firestore";

const Dashboard = () => {
  // Active tab state for navigation
  const [activeTab, setActiveTab] = useState('Organization');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Loading states
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  
  // Organization data (your existing users data)
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
    }
  ]);

  // Hardware devices state - now managed with Firestore
  const [devices, setDevices] = useState([]);

  // Load devices from Firestore on component mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoadingDevices(true);
        
        // Create query to get devices ordered by creation date
        const devicesQuery = query(
          collection(db, "devices"), 
          orderBy("createdAt", "desc")
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(devicesQuery, (querySnapshot) => {
          const devicesData = [];
          querySnapshot.forEach((doc) => {
            devicesData.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setDevices(devicesData);
          setIsLoadingDevices(false);
        }, (error) => {
          console.error("Error loading devices:", error);
          setIsLoadingDevices(false);
        });

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up devices listener:", error);
        setIsLoadingDevices(false);
      }
    };

    const unsubscribe = loadDevices();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // CRUD Operations for Organizations (keeping existing logic)
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
      
      // Also update devices that belong to this organization in Firestore
      try {
        const devicesToUpdate = devices.filter(device => device.organizationId === userId);
        
        for (const device of devicesToUpdate) {
          const deviceRef = doc(db, "devices", device.id);
          await updateDoc(deviceRef, {
            organization: 'Unassigned',
            organizationId: null,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Error updating devices after organization deletion:", error);
      }
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      console.log('User deleted:', userId);
    }
  };

  // CRUD Operations for Devices (Firestore integration)
  const handleCreateDevice = async (deviceData) => {
    try {
      // Generate unique ID
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare device data for Firestore
      const firestoreDeviceData = {
        ...deviceData,
        id: deviceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      const deviceRef = doc(db, "devices", deviceId);
      await setDoc(deviceRef, firestoreDeviceData);
      
      console.log('Device created in Firestore:', firestoreDeviceData);
    } catch (error) {
      console.error("Error creating device:", error);
      alert("Failed to create device. Please try again.");
    }
  };

  const handleUpdateDevice = async (deviceData) => {
    try {
      // Prepare updated data
      const updatedData = {
        ...deviceData,
        updatedAt: new Date().toISOString()
      };
      
      // Update in Firestore
      const deviceRef = doc(db, "devices", deviceData.id);
      await updateDoc(deviceRef, updatedData);
      
      console.log('Device updated in Firestore:', updatedData);
    } catch (error) {
      console.error("Error updating device:", error);
      alert("Failed to update device. Please try again.");
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "devices", deviceId));
        
        console.log('Device deleted from Firestore:', deviceId);
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("Failed to delete device. Please try again.");
      }
    }
  };

  // Modal handlers (keeping existing logic)
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
      const orgName = device.organization || 'Unassigned';
      acc[orgName] = (acc[orgName] || 0) + 1;
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
      unassignedDevices: devices.filter(d => d.organization === 'Unassigned' || !d.organization).length,
      devicesByOrg
    };
  };

  const stats = getStats();

  // Function to render content based on active tab
  const renderActiveContent = () => {
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
                <h3 className="text-sm font-medium text-gray-500 mb-1">Unassigned Devices</h3>
                <p className="text-2xl font-bold text-orange-600">{stats.unassignedDevices}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Device Types</h3>
                <div className="text-sm text-gray-600">
                  <div>📷 Cameras: {stats.cameras}</div>
                  <div>📊 Sensors: {stats.sensors}</div>
                </div>
              </div>
            </div>

            {/* Device Distribution by Organization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Devices by Assignment</h3>
                <div className="space-y-3">
                  {Object.entries(stats.devicesByOrg).map(([org, count]) => (
                    <div key={org} className="flex items-center justify-between">
                      <span className={`text-gray-700 ${org === 'Unassigned' ? 'text-orange-600 font-medium' : ''}`}>
                        {org}
                      </span>
                      <span className="font-medium">{count} devices</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {isLoadingDevices ? 'Loading devices...' : 'Devices loaded successfully'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Real-time updates enabled
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Firestore integration active
                    </span>
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
                    <div className="font-medium">Hardware Inventory</div>
                    <div className="text-sm text-gray-500">Manage device inventory</div>
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
            isLoading={isLoadingDevices}
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