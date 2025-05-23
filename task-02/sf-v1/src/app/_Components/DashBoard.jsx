"use client"
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainTable from './MainTable';
import OrganizationModal from './OrganizationModel';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Organization');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Sample data - now using state for CRUD operations
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

  // CRUD Operations
  const handleCreateUser = async (userData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id)) + 1
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    console.log('User created:', newUser);
  };

  const handleUpdateUser = async (userData) => {
    // Simulate API call
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      console.log('User deleted:', userId);
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          title="Projects" 
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
      </div>

      {/* Organization Modal */}
      <OrganizationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        initialData={editingUser}
      />
    </div>
  );
};

export default Dashboard;