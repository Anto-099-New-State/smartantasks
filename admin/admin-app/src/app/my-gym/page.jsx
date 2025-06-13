// MainLayout.js - Clean and modular
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebase';
import { 
  getCompleteOrganizationData,
  getOrganizationGyms,
  getOrganizationCoaches 
} from '../services/OrganizationServices';

// Component imports
import Sidebar from '../_components/Sidebar';
import Header from '../_components/Header';
import MyGyms from '../_components/MyGym';
import SupportTicketSystem from '../_components/SupportTicketSystem';
import Notifications from '../_components/Notifications';
import Attendance from '../_components/Attendance';
import HeadCoaches from '../_components/HeadCoaches';
import Trainers from '../_components/Trainers';
import Users from '../_components/Users';

const MainLayout = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('my-gyms');
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  // User and Organization State
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  
  // Data State
  const [gyms, setGyms] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        try {
          const orgData = await getCompleteOrganizationData(firebaseUser.email);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
          setOrganization(orgData.organization);
          setGyms(orgData.gyms);
          setCoaches(orgData.coaches);
          setUsers(orgData.users);
          setTrainers(orgData.trainers);
          
        } catch (error) {
          console.error('Error loading organization data:', error);
        }
      } else {
        setUser(null);
        setOrganization(null);
        setGyms([]);
        setCoaches([]);
        setUsers([]);
        setTrainers([]);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Event Handlers
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveComponent(itemId);
  const handleNotificationClick = () => setActiveComponent('notifications');

  // Gym Handlers
  const handleViewGym = (gym) => router.push(`/gym-details/${gym.id}`);
  const handleEditGym = (gym) => alert(`Edit ${gym.name} - Coming soon!`);
  const handleAddGym = () => alert('Add gym - Coming soon!');
  const handleAssignCoach = (gym) => router.push(`/gym-details/${gym.id}`);

  // Coach Handlers
  const handleEditCoach = (coach) => alert(`Edit ${coach.name} - Coming soon!`);
  const handleAddPerson = () => alert('Add person - Coming soon!');
  const handleUpdateStatus = () => alert('Update status - Coming soon!');
  const handleDeleteCoach = (coach) => {
    if (window.confirm(`Delete ${coach.name}?`)) {
      alert('Delete - Coming soon!');
    }
  };

  // Component Rendering
  const renderActiveComponent = () => {
    const componentProps = {
      gyms,
      coaches,
      users,
      trainers,
      organization,
      isLoading: dataLoading,
      organizationId: organization?.id,
      // Gym handlers
      onAssignCoach: handleAssignCoach,
      onEditGym: handleEditGym,
      onViewGym: handleViewGym,
      onAddGym: handleAddGym,
      // Coach handlers
      onEditCoach: handleEditCoach,
      onAddPerson: handleAddPerson,
      onUpdateStatus: handleUpdateStatus,
      onDeleteCoach: handleDeleteCoach
    };

    switch (activeComponent) {
      case 'my-gyms':
        return <MyGyms {...componentProps} />;
      case 'notifications':
        return <Notifications {...componentProps} />;
      case 'attendance':
        return <Attendance {...componentProps} />;
      case 'head-coaches':
        return <HeadCoaches {...componentProps} />;
      case 'trainers':
        return <Trainers {...componentProps} />;
      case 'users':
        return <Users {...componentProps} />;
      case 'support':
        return <SupportTicketSystem organizationId={organization?.id} />;
      default:
        return <MyGyms {...componentProps} />;
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Access denied screen
  if (!user || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please login with an authorized email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeComponent}
        onItemClick={handleItemClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header 
          onMenuClick={handleSidebarToggle} 
          user={{
            name: user.displayName || user.email,
            email: user.email
          }}
          onNotificationClick={handleNotificationClick}
          notificationCount={3}
        />

        {/* Organization Info Bar */}
        {organization && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {organization.avatar}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-900">
                      {organization.name}
                    </span>
                    <span className="text-sm text-emerald-700 ml-2">
                      ({organization.role})
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm text-emerald-600">
                  <span>• {gyms.length} Gyms</span>
                  <span>• {coaches.length} Coaches</span>
                  <span>• {organization.city}, {organization.state}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;