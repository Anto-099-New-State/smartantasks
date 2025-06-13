import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  Crown, 
  Award, 
  MapPin, 
  Mail, 
  Phone,
  Edit,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Loader,
  Download,
  Upload,
  Building,
  Target,
  Calendar,
  User,
  UserCheck,
  X
} from 'lucide-react';

import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { auth, db as firebaseDb } from '../api/firebase';
import { getCompleteOrganizationData } from '../services/OrganizationServices';

const OrganizationUsersManagement = () => {
  const [organizationData, setOrganizationData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetGym, setTargetGym] = useState('');
  const [availableGyms, setAvailableGyms] = useState([]);
  const [filterBy, setFilterBy] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentGymFilter, setCurrentGymFilter] = useState('All');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    initializeOrganizationData();
  }, []);

  const initializeOrganizationData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
          if (authUser) {
            unsubscribe();
            initializeOrganizationData();
          } else {
            setError('Please log in to continue');
            setLoading(false);
          }
        });
        return;
      }

      console.log('Initializing organization data for user:', user.email);
      const orgData = await getCompleteOrganizationData(user.email);
      
      console.log('Organization data received:', orgData);
      
      if (!orgData || !orgData.organization || !orgData.gyms) {
        throw new Error('Invalid organization data structure');
      }

      // Use the database from orgData, fallback to firebaseDb if not available
      const database = orgData.db || firebaseDb;
      if (!database) {
        throw new Error('No Firebase database instance available');
      }

      console.log('Database instance:', database);
      console.log('Organization:', orgData.organization);
      console.log('Gyms:', orgData.gyms);

      setOrganizationData(orgData);
      setDb(database);
      setGyms(orgData.gyms);
      // Set available gyms for transfer (all gyms in current organization)
      setAvailableGyms(orgData.gyms);
      
      await loadAllUsers({ ...orgData, db: database });
      setLoading(false);
      
    } catch (err) {
      console.error('Error initializing organization data:', err);
      setError('Failed to load organization data: ' + err.message);
      setLoading(false);
    }
  };

  // Debug function to check the database and data structure
  const debugOrganizationData = (orgData) => {
    console.log('=== DEBUGGING ORGANIZATION DATA ===');
    console.log('orgData:', orgData);
    console.log('orgData.db:', orgData.db);
    console.log('orgData.db type:', typeof orgData.db);
    console.log('firebaseDb:', firebaseDb);
    console.log('firebaseDb type:', typeof firebaseDb);
    console.log('organization:', orgData.organization);
    console.log('gyms:', orgData.gyms);
    console.log('gyms length:', orgData.gyms?.length);
    
    if (orgData.gyms && orgData.gyms.length > 0) {
      console.log('First gym:', orgData.gyms[0]);
      console.log('First gym ID:', orgData.gyms[0].id);
      console.log('First gym name:', orgData.gyms[0].name);
    }
    console.log('=== END DEBUG ===');
  };

  const loadAllUsers = async (orgData) => {
    debugOrganizationData(orgData);
    
    const allUsersData = [];
    
    console.log('Loading users for organization:', orgData.organization.id);
    console.log('Available gyms:', orgData.gyms);
    console.log('Database instance check:', !!orgData.db);
    
    // Validate database instance
    const database = orgData.db || firebaseDb;
    if (!database) {
      console.error('No database instance available');
      setError('Database connection not available');
      return;
    }
    
    console.log('Using database:', database);
    
    for (const gym of orgData.gyms) {
      try {
        console.log(`\n--- Processing gym: ${gym.name} (${gym.id}) ---`);
        
        // Construct the path carefully
        const orgId = orgData.organization.id;
        const gymId = gym.id;
        const pathString = `organizations/${orgId}/gyms/${gymId}/allUsers`;
        console.log('Collection path:', pathString);
        console.log('Organization ID:', orgId);
        console.log('Gym ID:', gymId);
        
        // Create collection reference
        console.log('Creating collection reference...');
        const allUsersRef = collection(database, pathString);
        console.log('Collection reference created successfully:', !!allUsersRef);
        
        // Get documents
        console.log('Fetching documents...');
        const allUsersSnapshot = await getDocs(allUsersRef);
        console.log(`✓ Found ${allUsersSnapshot.docs.length} users in gym ${gym.name}`);
        
        allUsersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          console.log(`  - User: ${userData.name || 'Unnamed'} (${doc.id})`);
          
          allUsersData.push({
            id: doc.id,
            firestoreId: doc.id, // Keep original Firestore document ID
            ...userData,
            gymId: gym.id,
            gymName: gym.name,
            organizationId: orgData.organization.id,
            organizationName: orgData.organization.name || 'Current Organization',
            // Ensure we have fallback values for display
            name: userData.name || 'Unnamed User',
            email: userData.email || 'No Email',
            userType: userData.userType || 'user',
            status: userData.status || 'unknown'
          });
        });

      } catch (gymErr) {
        console.error(`\n❌ Error loading users for gym ${gym.name} (${gym.id}):`);
        console.error('Error code:', gymErr.code);
        console.error('Error message:', gymErr.message);
        console.error('Full error:', gymErr);
        console.error('Error details:', {
          code: gymErr.code,
          message: gymErr.message,
          gymId: gym.id,
          gymName: gym.name,
          orgId: orgData.organization.id,
          pathAttempted: `organizations/${orgData.organization.id}/gyms/${gym.id}/allUsers`
        });
        
        // Set a more specific error message
        if (gymErr.code === 'permission-denied') {
          console.error('Permission denied - check Firestore rules');
        } else if (gymErr.message.includes('Expected first argument to collection()')) {
          console.error('Database instance issue - invalid Firestore instance');
        }
        
        // Continue with other gyms even if one fails
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log('Total users loaded:', allUsersData.length);
    console.log('Users by gym:');
    const usersByGym = allUsersData.reduce((acc, user) => {
      acc[user.gymName] = (acc[user.gymName] || 0) + 1;
      return acc;
    }, {});
    console.table(usersByGym);
    
    setAllUsers(allUsersData);
  };

  const getFilteredUsers = () => {
    return allUsers.filter(user => {
      // Simplified filter logic - only Head Coach, Unassigned, Assigned
      let roleMatch = false;
      
      if (filterBy === 'All') {
        roleMatch = true;
      } else if (filterBy === 'headcoach') {
        // Only show users who are actually head coaches (isHeadCoach === true)
        roleMatch = user.isHeadCoach === true;
      } else if (filterBy === 'unassigned') {
        // Show coaches who are not head coaches (have headcoach userType but isHeadCoach !== true)
        roleMatch = user.userType === 'headcoach' && user.isHeadCoach !== true;
      } else if (filterBy === 'assigned') {
        // Show all other staff (trainers, trainees, active users who are not coaches)
        roleMatch = (user.userType === 'trainer' || user.userType === 'trainee') && user.isHeadCoach !== true;
      }

      // Filter by gym
      const gymMatch = currentGymFilter === 'All' || user.gymId === currentGymFilter;

      // Filter by search term
      const searchMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.gymName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userType?.toLowerCase().includes(searchTerm.toLowerCase());

      return roleMatch && gymMatch && searchMatch;
    });
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleTransferUsers = async () => {
    if (!targetGym || selectedUsers.length === 0) {
      setError('Please select target gym and users to transfer');
      return;
    }

    const usersToTransfer = allUsers.filter(user => selectedUsers.includes(user.id));

    try {
      setTransferLoading(true);
      setError(null);

      const targetGymData = availableGyms.find(gym => gym.id === targetGym);
      const currentOrgData = organizationData.organization;

      console.log('Starting intra-organization transfer process...');
      console.log(`Transferring ${usersToTransfer.length} users`);
      console.log(`Target gym: ${targetGymData.name} within ${currentOrgData.name}`);

      let actualTransferCount = 0;

      for (const user of usersToTransfer) {
        console.log(`Transferring user: ${user.name} (${user.firestoreId || user.id})`);
        
        // Skip if user is already in the target gym
        if (user.gymId === targetGym) {
          console.log(`⚠️ User ${user.name} is already in target gym, skipping...`);
          continue;
        }
        
        // Prepare user data for transfer - keep all existing data
        const transferData = {
          ...user,
          // Update gym info (organization stays the same)
          gymId: targetGym,
          gymName: targetGymData.name,
          // Add transfer metadata
          transferredAt: serverTimestamp(),
          transferredBy: auth.currentUser?.email || 'admin',
          previousGym: user.gymName,
          lastUpdated: serverTimestamp(),
          transferHistory: [
            ...(user.transferHistory || []),
            {
              from: `${user.gymName}`,
              to: `${targetGymData.name}`,
              transferredAt: new Date().toISOString(),
              transferredBy: auth.currentUser?.email || 'admin',
              type: 'intra-organization'
            }
          ]
        };

        // Remove fields that shouldn't be transferred
        delete transferData.id;
        delete transferData.firestoreId;

        console.log('Transfer data prepared for:', user.name);

        // Add to target gym within same organization
        const targetPath = `organizations/${currentOrgData.id}/gyms/${targetGym}/allUsers`;
        console.log(`Adding to target path: ${targetPath}`);
        
        await addDoc(collection(db, targetPath), transferData);
        console.log(`✓ Added ${user.name} to target gym`);

        // Remove from source gym
        const sourcePath = `organizations/${user.organizationId}/gyms/${user.gymId}/allUsers`;
        const sourceDocId = user.firestoreId || user.id;
        console.log(`Removing from source path: ${sourcePath}/${sourceDocId}`);
        
        await deleteDoc(doc(db, sourcePath, sourceDocId));
        console.log(`✓ Removed ${user.name} from source gym`);
        
        actualTransferCount++;
      }

      const successMessage = `Successfully transferred ${actualTransferCount} user(s) to ${targetGymData.name}`;
      console.log(successMessage);
      setSuccess(successMessage);
      
      // Reset form
      setSelectedUsers([]);
      setShowTransferModal(false);
      setTargetGym('');
      
      // Reload users data to reflect changes
      console.log('Reloading users data...');
      await loadAllUsers(organizationData);
      
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('Transfer failed:', err);
      setError('Failed to transfer users: ' + err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const exportUsersData = () => {
    const filteredUsers = getFilteredUsers();
    const csvContent = generateUsersCSV(filteredUsers);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `organization_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess('Users data exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const generateUsersCSV = (users) => {
    let csv = `Organization Users Report\n`;
    csv += `Organization: ${organizationData?.organization?.name || 'N/A'}\n`;
    csv += `Generated on: ${new Date().toLocaleString()}\n`;
    csv += `Total Users: ${users.length}\n\n`;
    
    csv += `Name,Email,User Type,Role,Status,Gym,Organization,Phone,Specialization,Experience,Join Date,Created By\n`;
    users.forEach(user => {
      const joinDate = user.createdAt ? 
        (user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()) 
        : 'N/A';
      
      csv += `"${user.name || ''}","${user.email || ''}","${user.userType || ''}","${user.isHeadCoach ? 'Head Coach' : user.userType || ''}","${user.status || ''}","${user.gymName || ''}","${user.organizationName || ''}","${user.phone || ''}","${user.specialization || ''}","${user.experience || ''}","${joinDate}","${user.createdBy || ''}"\n`;
    });
    
    return csv;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'onboarding':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getUserTypeColor = (userType, isHeadCoach) => {
    // Check isHeadCoach boolean value explicitly
    if (isHeadCoach === true) return 'bg-amber-100 text-amber-800 border border-amber-200';
    
    switch (userType) {
      case 'trainer':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'trainee':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'headcoach':
        // If userType is headcoach but isHeadCoach is not true, treat as unassigned
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      default:
        return 'bg-purple-100 text-purple-800 border border-purple-200';
    }
  };

  const getUserTypeIcon = (userType, isHeadCoach) => {
    // Check isHeadCoach boolean value explicitly
    if (isHeadCoach === true) return <Crown size={12} className="mr-1" />;
    
    switch (userType) {
      case 'trainer':
        return <Award size={12} className="mr-1" />;
      case 'trainee':
        return <Target size={12} className="mr-1" />;
      case 'headcoach':
        // If userType is headcoach but isHeadCoach is not true, show as unassigned
        return <UserCheck size={12} className="mr-1" />;
      default:
        return <User size={12} className="mr-1" />;
    }
  };

  const getUserDisplayName = (userType, isHeadCoach) => {
    // Determine display name based on actual role
    if (isHeadCoach === true) {
      return 'Head Coach';
    }
    
    switch (userType) {
      case 'trainer':
        return 'Assigned Staff';
      case 'trainee':
        return 'Assigned Staff';
      case 'headcoach':
        // If userType is headcoach but isHeadCoach is not true, show as Unassigned
        return 'Unassigned';
      default:
        return 'Assigned Staff';
    }
  };

  const getStats = () => {
    const total = allUsers.length;
    // Only count users who are actually head coaches (isHeadCoach === true)
    const headCoaches = allUsers.filter(user => user.isHeadCoach === true).length;
    // Unassigned: headcoach userType but not actually head coaches
    const unassigned = allUsers.filter(user => user.userType === 'headcoach' && user.isHeadCoach !== true).length;
    // Assigned: trainers and trainees
    const assigned = allUsers.filter(user => (user.userType === 'trainer' || user.userType === 'trainee') && user.isHeadCoach !== true).length;
    const activeUsers = allUsers.filter(user => user.status === 'active').length;
    
    console.log('=== SIMPLIFIED USER STATS DEBUG ===');
    console.log('Total users:', total);
    console.log('Head Coaches (isHeadCoach === true):', headCoaches);
    console.log('Unassigned (userType === headcoach but isHeadCoach !== true):', unassigned);
    console.log('Assigned (trainers + trainees, excluding head coaches):', assigned);
    console.log('Active users:', activeUsers);
    console.log('=== END STATS DEBUG ===');
    
    return { total, headCoaches, unassigned, assigned, activeUsers };
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
      day: 'numeric'
    });
  };

  const filteredUsers = getFilteredUsers();
  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading organization users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 border border-emerald-400">
          <CheckCircle size={20} />
          <span className="font-medium">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 border border-red-400">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                Organization User Management
              </h1>
              <p className="text-slate-600 mt-2 font-medium">
                Transfer users between gyms within {organizationData?.organization?.name || 'your organization'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportUsersData}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md hover:shadow-lg font-medium"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                  <ArrowRight size={16} />
                  <span>Transfer ({selectedUsers.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards - Simplified to match the filter options */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Users</h3>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Crown className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Head Coaches</h3>
                  <p className="text-2xl font-bold text-slate-900">{stats.headCoaches}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-slate-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Unassigned</h3>
                  <p className="text-2xl font-bold text-slate-900">{stats.unassigned}</p>
                </div>
              </div>
            </div>
            
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Active</h3>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Simplified User Type Filter - Only Head Coach, Unassigned, Assigned */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors font-medium"
            >
              <option value="All">All Users</option>
              <option value="headcoach">Head Coaches</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned Staff</option>
            </select>

            {/* Gym Filter */}
            <select
              value={currentGymFilter}
              onChange={(e) => setCurrentGymFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors font-medium"
            >
              <option value="All">All Gyms</option>
              {gyms.map(gym => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))}
            </select>

            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200"
            >
              <span>{selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Gym</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <div className="text-slate-500">
                        <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
                        <p className="text-slate-600">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={`${user.gymId}-${user.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-4 shadow-md">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{user.name || 'No Name'}</div>
                            <div className="text-sm text-slate-500">{user.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getUserTypeColor(user.userType, user.isHeadCoach)}`}>
                          {getUserTypeIcon(user.userType, user.isHeadCoach)}
                          {getUserDisplayName(user.userType, user.isHeadCoach)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}></div>
                          {user.status?.charAt(0)?.toUpperCase() + user.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin size={14} className="text-slate-400 mr-2" />
                          <span className="text-sm font-medium text-slate-900">{user.gymName}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail size={12} className="mr-2 text-slate-400" />
                            <span className="truncate max-w-32">{user.email || 'No email'}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone size={12} className="mr-2 text-slate-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 space-y-1">
                          {user.specialization && (
                            <div className="truncate max-w-32" title={user.specialization}>
                              <span className="font-medium text-slate-600">Spec:</span> {user.specialization}
                            </div>
                          )}
                          {user.experience && (
                            <div>
                              <span className="font-medium text-slate-600">Exp:</span> {user.experience}
                            </div>
                          )}
                          {user.membershipType && (
                            <div>
                              <span className="font-medium text-slate-600">Type:</span> {user.membershipType}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-2 text-slate-400" />
                            {formatDate(user.createdAt)}
                          </div>
                          {user.createdBy && (
                            <div className="text-xs text-slate-500 mt-1">
                              by {user.createdBy}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-50"
                            title="More actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 text-sm text-slate-600 text-center font-medium">
            Showing {filteredUsers.length} of {allUsers.length} users
            {selectedUsers.length > 0 && (
              <span className="ml-4 text-blue-600">• {selectedUsers.length} selected for transfer</span>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <ArrowRight className="h-6 w-6 text-blue-600 mr-3" />
                  Transfer Users to Another Gym
                </h3>
                <button 
                  onClick={() => setShowTransferModal(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-4 font-medium">
                  You are about to transfer {selectedUsers.length} user(s) to another gym within your organization:
                </p>
                <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
                  {allUsers
                    .filter(user => selectedUsers.includes(user.id))
                    .map(user => (
                      <div key={user.id} className="text-sm py-2 flex items-center justify-between bg-white rounded-lg px-3 border border-slate-100">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs mr-3">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{user.name}</span>
                            <span className="text-slate-500 ml-2 text-xs">({getUserDisplayName(user.userType, user.isHeadCoach)})</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">From: {user.gymName}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Select Target Gym
                  </label>
                  <select
                    value={targetGym}
                    onChange={(e) => setTargetGym(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors font-medium"
                  >
                    <option value="">Choose a gym...</option>
                    {availableGyms.map(gym => (
                      <option key={gym.id} value={gym.id}>{gym.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Only gyms within {organizationData?.organization?.name || 'your organization'} are shown
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">Note:</span> Users will be moved to the selected gym within your organization. 
                    Their organization membership and user roles will remain the same. Head coaches can be transferred and will retain their head coach status at the new gym.
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-8">
                <button
                  onClick={handleTransferUsers}
                  disabled={!targetGym || transferLoading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-md hover:shadow-lg"
                >
                  {transferLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      <span>Transfer to Gym</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationUsersManagement;