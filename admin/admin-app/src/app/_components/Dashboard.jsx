"use client"
import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import MainTable from './MainTable';
import OrganizationModal from './OrganizationModel';
import Hardware from './HardWare';
import Layouts from './Layouts'

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
  orderBy,
  addDoc,
  serverTimestamp
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
  
  // Organization data - now loaded from Firestore
  const [users, setUsers] = useState([]);

  // Hardware devices state - managed with Firestore
  const [devices, setDevices] = useState([]);

  // Load organizations from Firestore
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        
        // Simple query without orderBy to avoid index issues
        const orgsCollection = collection(db, "organizations");
        
        // Set up real-time listener for organizations
        const unsubscribe = onSnapshot(orgsCollection, (querySnapshot) => {
          const orgsData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Organization document:', doc.id, data); // Debug log
            orgsData.push({
              id: doc.id,
              ...data
            });
          });
          
          setUsers(orgsData);
          setIsLoadingOrgs(false);
          console.log('Organizations loaded from Firestore:', orgsData);
        }, (error) => {
          console.error("Error loading organizations:", error);
          // Try a simple getDocs as fallback
          loadOrganizationsFallback();
        });

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up organizations listener:", error);
        // Try a simple getDocs as fallback
        loadOrganizationsFallback();
      }
    };

    // Fallback method using getDocs
    const loadOrganizationsFallback = async () => {
      try {
        console.log('Trying fallback method for organizations...');
        const querySnapshot = await getDocs(collection(db, "organizations"));
        const orgsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Fallback - Organization document:', doc.id, data);
          orgsData.push({
            id: doc.id,
            ...data
          });
        });
        
        setUsers(orgsData);
        setIsLoadingOrgs(false);
        console.log('Organizations loaded via fallback:', orgsData);
      } catch (error) {
        console.error("Fallback method also failed:", error);
        setIsLoadingOrgs(false);
      }
    };

    const unsubscribe = loadOrganizations();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);


  // Modal handlers (removed organization CRUD)
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };


  // Function to render content based on active tab
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'Organization':
        return (
          <>
            <Header 
              title="Organizations" 
              count={users.length} 
              isLoading={isLoadingOrgs}
            />
            
            {isLoadingOrgs ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading organizations from Firestore...</span>
              </div>
            ) : (
              <MainTable 
                data={users}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                readOnly={true}
              />
            )}
          </>
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