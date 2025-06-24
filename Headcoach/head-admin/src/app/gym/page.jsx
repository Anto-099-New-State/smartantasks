// VerificationPage.js - Fixed Post sign-in verification and dashboard
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../api/firebase';
import { getUserOrganization, getOrganizationGyms } from '../services/OrganizationServices';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import dynamic from 'next/dynamic';
import AttendanceManagement from '../_components/AttendanceManagement';

// Dynamic imports for Next.js
const TrainerManagement = dynamic(() => import('../_components/Trainer'), {
  loading: () => <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>
});

const UserManagement = dynamic(() => import('../_components/UserManagement'), {
  loading: () => <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>
}); 

const VerificationPage = () => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [userGyms, setUserGyms] = useState([]);
  const [allGyms, setAllGyms] = useState([]);
  const [verificationError, setVerificationError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');

  // Handle sidebar navigation
  const handleNavigation = (view) => {
    setActiveView(view);
  };

  // Get all users from all gyms' allUsers subcollections
  const getAllUsersFromGyms = async (organizationId, gyms) => {
    try {
      const allUsersPromises = gyms.map(async (gym) => {
        try {
          const allUsersRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'allUsers');
          const snapshot = await getDocs(allUsersRef);
          const users = [];
          
          snapshot.forEach((doc) => {
            users.push({
              id: doc.id,
              ...doc.data(),
              gymId: gym.id,
              gymName: gym.name
            });
          });
          
          console.log(`Found ${users.length} users in gym ${gym.name} (${gym.id})`);
          return users;
        } catch (error) {
          console.error(`Error fetching users from gym ${gym.id}:`, error);
          return [];
        }
      });

      const allUsersArrays = await Promise.all(allUsersPromises);
      return allUsersArrays.flat();
    } catch (error) {
      console.error('Error getting all users from gyms:', error);
      return [];
    }
  };

  // Check if user exists in any gym's allUsers subcollection
  const verifyUserInDatabase = async (firebaseUser) => {
    setIsVerifying(true);
    setVerificationError('');

    try {
      const organizationsRef = collection(db, 'organizations');
      const orgSnapshot = await getDocs(organizationsRef);
      
      let userFound = null;
      let userOrganization = null;
      let userGyms = [];
      let allGyms = [];

      for (const orgDoc of orgSnapshot.docs) {
        const orgData = {
          id: orgDoc.id,
          ...orgDoc.data()
        };

        const gyms = await getOrganizationGyms(orgData.id);
        const allGymUsers = await getAllUsersFromGyms(orgData.id, gyms);
        
        const foundUser = allGymUsers.find(user => 
          user.email?.toLowerCase() === firebaseUser.email?.toLowerCase()
        );

        if (foundUser) {
          userFound = foundUser;
          userOrganization = orgData;
          allGyms = gyms;
          
          userGyms = allGymUsers
            .filter(user => user.email?.toLowerCase() === firebaseUser.email?.toLowerCase())
            .map(user => gyms.find(gym => gym.id === user.gymId))
            .filter(gym => gym);

          console.log('User found in organization:', orgData.id);
          console.log('User found in gyms:', userGyms.map(g => g.name));
          break;
        }
      }

      if (userFound) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          userData: userFound
        });
        setOrganization(userOrganization);
        setUserGyms(userGyms);
        setAllGyms(allGyms);
        setIsAuthorized(true);
        
        console.log('User verified in gym allUsers:', userFound);
      } else {
        setVerificationError('Your email is not registered in any gym. Please contact your gym administrator.');
        setIsAuthorized(false);
        console.log('User not found in any gym allUsers across all organizations');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Unable to verify your access. Please try again.');
      setIsAuthorized(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify user on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await verifyUserInDatabase(firebaseUser);
      } else {
        router.push('/signin');
      }
    });

    return unsubscribe;
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Loading verification screen
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Access</h2>
          <p className="text-gray-600">Checking your registration in our gym database...</p>
        </div>
      </div>
    );
  }

  // Access denied screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{verificationError}</p>
          <button 
            onClick={handleSignOut}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Dashboard - User is verified and authorized
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200 z-50">
        {/* Logo/Brand */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Efficio</span>
        </div>

        {/* User Profile */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.userData?.name || user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</p>
            
            <button 
              onClick={() => handleNavigation('dashboard')}
              className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === 'dashboard' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${activeView === 'dashboard' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h12a2 2 0 012 2v0M9 12l2 2 4-4" />
              </svg>
              Dashboard
            </button>

            <button 
              onClick={() => handleNavigation('attendance')}
              className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === 'attendance' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${activeView === 'attendance' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Attendance
            </button>

            <button 
              onClick={() => handleNavigation('trainers')}
              className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === 'trainers' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${activeView === 'trainers' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Trainers
            </button>

            <button 
              onClick={() => handleNavigation('users')}
              className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeView === 'users' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${activeView === 'users' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Users
            </button>
          </div>

          <div className="mt-8">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</p>
            <div className="mt-2 space-y-1">
              <button 
                onClick={() => handleNavigation('floor')}
                className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'floor' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className={`mr-3 h-5 w-5 ${activeView === 'floor' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Floor
              </button>

              <button 
                onClick={() => handleNavigation('hardware')}
                className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'hardware' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className={`mr-3 h-5 w-5 ${activeView === 'hardware' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Hardware
              </button>
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button 
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
          >
            <svg className="text-gray-400 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {user?.userData?.name || user?.displayName || user?.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="search..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-6">
          {activeView === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Total Employees</p>
                      <p className="text-3xl font-bold mt-1">{userGyms.length > 0 ? 173 : 0}</p>
                      <div className="flex items-center mt-2">
                        <span className="bg-emerald-400 text-emerald-900 text-xs px-2 py-1 rounded-full font-medium">
                          +{userGyms.length > 0 ? 16 : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-emerald-200">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 115 5v1H1v-1a5 5 0 015-5z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-emerald-200">
                    +16 from last month → Details
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Present Today</p>
                      <p className="text-3xl font-bold mt-1 text-gray-900">{userGyms.length > 0 ? 156 : 0}</p>
                      <div className="flex items-center mt-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          +{userGyms.length > 0 ? 8 : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    +8 from yesterday → Details
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Late Arrivals</p>
                      <p className="text-3xl font-bold mt-1 text-gray-900">{userGyms.length > 0 ? 12 : 0}</p>
                      <div className="flex items-center mt-2">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                          -{userGyms.length > 0 ? 3 : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-orange-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    -3 from yesterday → Details
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Absent</p>
                      <p className="text-3xl font-bold mt-1 text-gray-900">{userGyms.length > 0 ? 5 : 0}</p>
                      <div className="flex items-center mt-2">
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          +{userGyms.length > 0 ? 2 : 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-red-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    +2 from yesterday → Details
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Report</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{userGyms.length > 0 ? 173 : 0}</span>
                        <span className="text-sm text-gray-500">Total Employ</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{userGyms.length > 0 ? 128 : 0}</span>
                        <span className="text-sm text-gray-500">On Time</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500">Attendance chart visualization</p>
                      <p className="text-sm text-gray-400 mt-1">Would display monthly attendance data</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Task</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-emerald-700 text-sm font-medium">Kanban</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-600 text-sm">Table</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                      <span className="text-gray-600 text-sm">List View</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <button className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                      Add trainers
                    </button>
                    <button className="w-full bg-white border border-emerald-500 text-emerald-600 py-3 px-4 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
                      Add Users
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'attendance' && (
            <div>
              <AttendanceManagement/>            
            </div>
          )}

          {activeView === 'trainers' && (
            <TrainerManagement 
              organizationId={organization?.id}
              userGyms={userGyms}
            />
          )}

          {activeView === 'users' && (
            <UserManagement 
              organizationId={organization?.id}
              userGyms={userGyms}
            />
          )}

          {(activeView === 'floor' || activeView === 'hardware') && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeView} Management
              </h2>
              
              <div className="bg-white rounded-lg border border-gray-200 p-12">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                    {activeView} Management
                  </h3>
                  <p className="text-gray-500 mb-4">
                    This feature is currently under development
                  </p>
                  <button className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VerificationPage;