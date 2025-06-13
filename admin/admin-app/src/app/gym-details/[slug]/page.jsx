"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  Plus, 
  Edit, 
  Star, 
  StarOff,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Crown,
  Award,
  Target,
  Search,
  Download
} from 'lucide-react';

import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db as firebaseDb } from '../../api/firebase';
import { getCompleteOrganizationData } from '../../services/OrganizationServices';

export default function GymDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const gymId = params.gymId || params.slug;
  
  const [gym, setGym] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [headCoaches, setHeadCoaches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    specialization: '',
    experience: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      if (!gymId) {
        setError('No gym ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
              unsubscribe();
              initializeData();
            } else {
              setError('Please log in to continue');
              setLoading(false);
            }
          });
          return;
        }

        const orgData = await getCompleteOrganizationData(user.email);
        
        if (!orgData.organization || !orgData.gyms) {
          throw new Error('Invalid organization data structure');
        }
        
        setDb(orgData.db || firebaseDb);
        setOrganizationId(orgData.organization.id);

        const foundGym = orgData.gyms.find(g => g.id === gymId);
        if (!foundGym) {
          setError(`Gym not found with ID: ${gymId}`);
          setLoading(false);
          return;
        }
        
        setGym(foundGym);
        setupDataListeners(orgData.db || firebaseDb, orgData.organization.id, gymId);
        setLoading(false);
        
      } catch (err) {
        setError('Failed to load gym data: ' + err.message);
        setLoading(false);
      }
    };

    initializeData();
  }, [gymId]);

  const setupDataListeners = (database, orgId, gymId) => {
    if (!database) return;
    
    try {
      const allUsersRef = collection(database, `organizations/${orgId}/gyms/${gymId}/allUsers`);
      onSnapshot(allUsersRef, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const headCoachesRef = collection(database, `organizations/${orgId}/gyms/${gymId}/headCoaches`);
      onSnapshot(headCoachesRef, (snapshot) => {
        setHeadCoaches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userType: 'headcoach' })));
      });

      const trainersRef = collection(database, `organizations/${orgId}/gyms/${gymId}/trainers`);
      onSnapshot(trainersRef, (snapshot) => {
        setTrainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userType: 'trainer' })));
      });

      const traineesRef = collection(database, `organizations/${orgId}/gyms/${gymId}/trainees`);
      onSnapshot(traineesRef, (snapshot) => {
        setTrainees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userType: 'trainee' })));
      });
    } catch (error) {
      console.error('Error setting up listeners:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCoach = () => {
    setEditingCoach(null);
    setFormData({
      name: '', email: '', phone: '', status: 'active',
      specialization: '', experience: ''
    });
    setShowCoachForm(true);
  };

  const handleEditCoach = (person) => {
    setEditingCoach(person);
    setFormData({
      name: person.name || '', 
      email: person.email || '', 
      phone: person.phone || '',
      status: person.status || 'active', 
      specialization: person.specialization || '', 
      experience: person.experience || ''
    });
    setShowCoachForm(true);
  };

  const handleSaveCoach = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setError(null);
      
      const coachData = {
        ...formData,
        gymId,
        organizationId,
        userType: 'headcoach',
        isHeadCoach: false, // Always start as unassigned
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin'
      };

      if (editingCoach) {
        // Update in headCoaches collection (preserve isHeadCoach status)
        const updatedData = {
          ...coachData,
          isHeadCoach: editingCoach.isHeadCoach // Keep current head coach status
        };
        await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/headCoaches`, editingCoach.id), updatedData);
        
        // Find and update in allUsers collection
        const coachInAllUsers = allUsers.find(user => 
          user.email === editingCoach.email || user.id === editingCoach.id
        );
        if (coachInAllUsers) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, coachInAllUsers.id), updatedData);
        }
        
        setSuccess('Person updated successfully');
      } else {
        coachData.createdAt = serverTimestamp();
        coachData.createdBy = auth.currentUser?.email || 'admin';
        
        // Add to headCoaches collection
        const headCoachDocRef = await addDoc(collection(db, `organizations/${organizationId}/gyms/${gymId}/headCoaches`), coachData);
        
        // Add to allUsers collection with the same data
        const allUsersData = {
          ...coachData,
          headCoachDocId: headCoachDocRef.id // Reference to the headCoaches document
        };
        await addDoc(collection(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`), allUsersData);
        
        setSuccess('Person added successfully');
      }
      
      setShowCoachForm(false);
      setEditingCoach(null);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Failed to save person:', err);
      setError('Failed to save person: ' + err.message);
    }
  };

  // Helper function to find user in allUsers collection
  const findUserInAllUsers = (coach) => {
    console.log('Looking for person in allUsers:', coach);
    console.log('Available allUsers:', allUsers);
    
    // Try multiple matching strategies
    let foundUser = null;
    
    // Strategy 1: Match by email
    if (coach.email) {
      foundUser = allUsers.find(user => user.email === coach.email);
      if (foundUser) {
        console.log('Found user by email:', foundUser);
        return foundUser;
      }
    }
    
    // Strategy 2: Match by name + gym
    if (coach.name && coach.gymId) {
      foundUser = allUsers.find(user => 
        user.name === coach.name && user.gymId === coach.gymId
      );
      if (foundUser) {
        console.log('Found user by name + gym:', foundUser);
        return foundUser;
      }
    }
    
    // Strategy 3: Match by phone (if available)
    if (coach.phone) {
      foundUser = allUsers.find(user => user.phone === coach.phone);
      if (foundUser) {
        console.log('Found user by phone:', foundUser);
        return foundUser;
      }
    }
    
    console.log('No matching user found in allUsers collection');
    return null;
  };

  // Function to manually sync head coach status between collections
  const syncHeadCoachStatus = async () => {
    try {
      setError(null);
      console.log('=== SYNCING HEAD COACH STATUS ===');
      
      // Get all people with isHeadCoach: true from headCoaches collection
      const actualHeadCoaches = headCoaches.filter(person => person.isHeadCoach === true);
      console.log('Actual head coaches from headCoaches collection:', actualHeadCoaches);
      
      // Update all users in allUsers to remove head coach status first
      for (const user of allUsers) {
        if (user.userType === 'headcoach' || user.isHeadCoach) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, user.id), {
            isHeadCoach: false,
            lastUpdated: serverTimestamp(),
            syncNote: 'Status synced - removed head coach'
          });
          console.log(`Reset head coach status for ${user.name} in allUsers`);
        }
      }
      
      // Now set the correct head coaches in allUsers
      for (const headCoach of actualHeadCoaches) {
        const userInAllUsers = findUserInAllUsers(headCoach);
        if (userInAllUsers) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, userInAllUsers.id), {
            isHeadCoach: true,
            lastUpdated: serverTimestamp(),
            syncNote: 'Status synced - assigned head coach'
          });
          console.log(`✓ Synced head coach status for ${headCoach.name}`);
        } else {
          console.log(`⚠️ Head coach ${headCoach.name} not found in allUsers`);
        }
      }
      
      console.log('=== SYNC COMPLETE ===');
      setSuccess(`Synced head coach status for ${actualHeadCoaches.length} people`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Failed to sync head coach status:', err);
      setError('Failed to sync head coach status: ' + err.message);
    }
  };

  const handleAssignHeadCoach = async (coachId) => {
    try {
      setError(null);
      console.log('=== ASSIGNING HEAD COACH ===');
      console.log('Person ID to assign:', coachId);
      
      // First, find current head coach and unassign them
      const currentHeadCoach = headCoaches.find(coach => coach.isHeadCoach === true);
      console.log('Current head coach:', currentHeadCoach);
      
      if (currentHeadCoach && currentHeadCoach.id !== coachId) {
        console.log('Unassigning current head coach...');
        
        const unassignData = {
          isHeadCoach: false,
          lastUpdated: serverTimestamp(),
          updatedBy: auth.currentUser?.email || 'admin',
          headCoachRemovedAt: serverTimestamp(),
          headCoachNote: 'Removed from head coach position'
        };

        // Update in headCoaches collection
        await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/headCoaches`, currentHeadCoach.id), unassignData);
        console.log('✓ Updated headCoaches collection for removal');

        // Find and update in allUsers collection
        const currentHeadCoachInAllUsers = findUserInAllUsers(currentHeadCoach);
        if (currentHeadCoachInAllUsers) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, currentHeadCoachInAllUsers.id), unassignData);
          console.log('✓ Updated allUsers collection for removal');
        } else {
          console.log('⚠️ Current head coach not found in allUsers collection');
        }
      }
      
      // Then assign new head coach
      console.log('Assigning new head coach...');
      const newHeadCoach = headCoaches.find(coach => coach.id === coachId);
      console.log('New head coach data:', newHeadCoach);
      
      const assignData = {
        isHeadCoach: true,
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin',
        headCoachAssignedAt: serverTimestamp(),
        headCoachNote: 'Assigned as head coach'
      };

      // Update in headCoaches collection
      await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/headCoaches`, coachId), assignData);
      console.log('✓ Updated headCoaches collection for assignment');
      
      // Find and update in allUsers collection
      if (newHeadCoach) {
        const newHeadCoachInAllUsers = findUserInAllUsers(newHeadCoach);
        console.log('Found new head coach in allUsers:', newHeadCoachInAllUsers);
        
        if (newHeadCoachInAllUsers) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, newHeadCoachInAllUsers.id), assignData);
          console.log('✓ Updated allUsers collection for assignment');
        } else {
          console.log('⚠️ New head coach not found in allUsers collection, creating entry...');
          // If not found in allUsers, add them
          const coachDataForAllUsers = {
            ...newHeadCoach,
            ...assignData,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.email || 'admin'
          };
          delete coachDataForAllUsers.id; // Remove the original ID
          const newUserDoc = await addDoc(collection(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`), coachDataForAllUsers);
          console.log('✓ Created new entry in allUsers:', newUserDoc.id);
        }
      }
      
      console.log('=== HEAD COACH ASSIGNMENT COMPLETE ===');
      setSuccess('Head coach assigned successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Failed to assign head coach:', err);
      setError('Failed to assign head coach: ' + err.message);
    }
  };

  const handleUnassignHeadCoach = async (coachId) => {
    try {
      setError(null);
      console.log('=== UNASSIGNING HEAD COACH ===');
      console.log('Person ID to unassign:', coachId);
      
      const coach = headCoaches.find(coach => coach.id === coachId);
      console.log('Person to unassign:', coach);
      
      const unassignData = {
        isHeadCoach: false,
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin',
        headCoachRemovedAt: serverTimestamp(),
        headCoachNote: 'Removed from head coach position - now unassigned'
      };

      // Update in headCoaches collection
      await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/headCoaches`, coachId), unassignData);
      console.log('✓ Updated headCoaches collection');
      
      // Find and update in allUsers collection
      if (coach) {
        const coachInAllUsers = findUserInAllUsers(coach);
        console.log('Found person in allUsers:', coachInAllUsers);
        
        if (coachInAllUsers) {
          await updateDoc(doc(db, `organizations/${organizationId}/gyms/${gymId}/allUsers`, coachInAllUsers.id), unassignData);
          console.log('✓ Updated allUsers collection');
        } else {
          console.log('⚠️ Person not found in allUsers collection');
        }
      }
      
      console.log('=== HEAD COACH UNASSIGNMENT COMPLETE ===');
      setSuccess('Head coach unassigned successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Failed to unassign head coach:', err);
      setError('Failed to unassign head coach: ' + err.message);
    }
  };

  const generateGymReport = () => {
    const currentHeadCoach = headCoaches.find(person => person.isHeadCoach === true);
    const reportData = {
      gymInfo: {
        name: gym?.name || 'N/A',
        status: gym?.status || 'N/A',
        address: gym?.address || 'N/A',
        phone: gym?.phone || 'N/A'
      },
      statistics: {
        totalUsers: allUsers.length,
        headCoaches: headCoaches.filter(c => c.isHeadCoach === true).length,
        unassigned: headCoaches.filter(c => c.isHeadCoach !== true).length,
        trainers: trainers.length,
        trainees: trainees.length
      },
      currentHeadCoach: currentHeadCoach ? {
        name: currentHeadCoach.name,
        email: currentHeadCoach.email,
        assignedDate: currentHeadCoach.headCoachAssignedAt ? 
          new Date(currentHeadCoach.headCoachAssignedAt.toDate()).toLocaleDateString() : 'N/A'
      } : null,
      coaches: headCoaches.map(coach => ({
        name: coach.name,
        email: coach.email,
        status: coach.status,
        isHeadCoach: coach.isHeadCoach,
        specialization: coach.specialization || 'N/A',
        experience: coach.experience || 'N/A'
      })),
      generatedAt: new Date().toLocaleString(),
      generatedBy: auth.currentUser?.email || 'admin'
    };

    // Create and download CSV
    const csvContent = generateCSVContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${gym?.name || 'gym'}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess('Report downloaded successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const generateCSVContent = (data) => {
    let csv = `Gym Report - ${data.gymInfo.name}\n`;
    csv += `Generated on: ${data.generatedAt}\n`;
    csv += `Generated by: ${data.generatedBy}\n\n`;
    
    csv += `GYM INFORMATION\n`;
    csv += `Name,${data.gymInfo.name}\n`;
    csv += `Status,${data.gymInfo.status}\n`;
    csv += `Address,"${data.gymInfo.address}"\n`;
    csv += `Phone,${data.gymInfo.phone}\n\n`;
    
    csv += `STATISTICS\n`;
    csv += `Total Users,${data.statistics.totalUsers}\n`;
    csv += `Head Coaches,${data.statistics.headCoaches}\n`;
    csv += `Unassigned,${data.statistics.unassigned}\n`;
    csv += `Trainers,${data.statistics.trainers}\n`;
    csv += `Trainees,${data.statistics.trainees}\n\n`;
    
    if (data.currentHeadCoach) {
      csv += `CURRENT HEAD COACH\n`;
      csv += `Name,${data.currentHeadCoach.name}\n`;
      csv += `Email,${data.currentHeadCoach.email}\n`;
      csv += `Assigned Date,${data.currentHeadCoach.assignedDate}\n\n`;
    }
    
    csv += `ALL PEOPLE\n`;
    csv += `Name,Email,Status,Role,Specialization,Experience\n`;
    data.coaches.forEach(coach => {
      csv += `"${coach.name}","${coach.email}","${coach.status}","${coach.isHeadCoach ? 'Head Coach' : 'Unassigned'}","${coach.specialization}","${coach.experience}"\n`;
    });
    
    return csv;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp instanceof Date) date = timestamp;
    else date = new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const filteredCoaches = headCoaches.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'headcoach') return matchesSearch && person.isHeadCoach === true;
    if (activeTab === 'unassigned') return matchesSearch && person.isHeadCoach !== true;
    return matchesSearch;
  });

  const currentHeadCoach = headCoaches.find(person => person.isHeadCoach === true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading gym details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <div className="mt-4 space-x-2">
            <button onClick={() => router.back()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Go Back
            </button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">{gym?.name || 'Loading...'}</h1>
              {gym?.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  gym.status === 'active' ? 'bg-green-100 text-green-800' :
                  gym.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {gym.status.charAt(0).toUpperCase() + gym.status.slice(1)}
                </span>
              )}
            </div>
            
            <button
              onClick={generateGymReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={16} />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Head Coaches</h3>
                <p className="text-2xl font-bold text-gray-900">{headCoaches.filter(c => c.isHeadCoach === true).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Unassigned</h3>
                <p className="text-2xl font-bold text-gray-900">{headCoaches.filter(c => c.isHeadCoach !== true).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Trainees</h3>
                <p className="text-2xl font-bold text-gray-900">{trainees.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Head Coach Alert */}
        {currentHeadCoach && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-amber-500 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">Current Head Coach</h3>
                <p className="text-sm text-amber-700">
                  <strong>{currentHeadCoach.name}</strong> ({currentHeadCoach.email}) is currently assigned as the head coach.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* People Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">People Management</h2>
                <p className="text-sm text-gray-600 mt-1">Add people and assign head coach responsibilities</p>
              </div>
              
              <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
           
              
                <button 
                  onClick={handleAddCoach}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Person</span>
                </button>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex items-center space-x-8 mt-6">
              <button 
                onClick={() => setActiveTab('all')}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === 'all' 
                    ? 'text-emerald-600 border-b-2 border-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({headCoaches.length})
              </button>
              <button 
                onClick={() => setActiveTab('headcoach')}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === 'headcoach' 
                    ? 'text-emerald-600 border-b-2 border-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Head Coach ({headCoaches.filter(c => c.isHeadCoach === true).length})
              </button>
              <button 
                onClick={() => setActiveTab('unassigned')}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === 'unassigned' 
                    ? 'text-emerald-600 border-b-2 border-emerald-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unassigned ({headCoaches.filter(c => c.isHeadCoach !== true).length})
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mt-4">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search people..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
          
          {/* People Table */}
          {filteredCoaches.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {searchTerm ? 'No people found matching your search' : 'No people added yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCoaches.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-25 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm mr-3">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{person.name}</div>
                            <div className="text-sm text-gray-500">{person.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          person.status === 'active' 
                            ? 'text-green-700 bg-green-50' 
                            : 'text-red-700 bg-red-50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            person.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          {person.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        {person.isHeadCoach === true ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Crown size={12} className="mr-1" />
                            Head Coach
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            Unassigned
                          </span>
                        )}
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{person.specialization || 'Not specified'}</div>
                        <div className="text-xs text-gray-500">{person.experience || 'No experience listed'}</div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {person.isHeadCoach === true ? (
                            <button
                              onClick={() => handleUnassignHeadCoach(person.id)}
                              className="text-yellow-500 hover:text-yellow-700 transition-colors"
                              title="Remove Head Coach Assignment"
                            >
                              <StarOff size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignHeadCoach(person.id)}
                              className="text-gray-400 hover:text-yellow-500 transition-colors"
                              title="Assign as Head Coach"
                            >
                              <Star size={18} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEditCoach(person)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Edit Person"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Person Modal */}
      {showCoachForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserCheck className="h-5 w-5 text-blue-500 mr-2" />
                  <span>{editingCoach ? 'Edit Person' : 'Add New Person'}</span>
                </h3>
                <button onClick={() => setShowCoachForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveCoach} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                    placeholder="Enter person's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                    placeholder="person@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input 
                    type="text" 
                    name="specialization" 
                    value={formData.specialization} 
                    onChange={handleInputChange}
                    placeholder="e.g., Strength Training, Cardio, Yoga" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input 
                    type="text" 
                    name="experience" 
                    value={formData.experience} 
                    onChange={handleInputChange}
                    placeholder="e.g., 3 years, 5+ years" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{editingCoach ? 'Update Person' : 'Add Person'}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCoachForm(false)} 
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}