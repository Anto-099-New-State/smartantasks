"use client"
import React, { useEffect, useState } from 'react';
import { 
  Grid3X3,
  Search,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';

import { 
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../api/firebase';  // Your firebase config and initialization file
import { useRouter } from 'next/navigation';

const MainTable = ({ searchTerm, setSearchTerm , onNavigateToOrg }) => {
  const [data, setData] = useState([]);
    const router = useRouter();
  // Firestore realtime listener
  useEffect(() => {
    const q = query(collection(db, 'organizations'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(orgs);
    });
    return () => unsubscribe();
  }, []);

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-')        // Replace spaces with hyphens
      .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleRowClick = (organization, event) => {
    // Don't navigate if clicking on action buttons
    if (event.target.closest('button')) {
      return;
    }
    
    const slug = createSlug(organization.id);
    const orgWithSlug = { ...organization, slug };
    // Call parent function to handle navigation
    if (onNavigateToOrg) {
      onNavigateToOrg(orgWithSlug);
    }
    router.push(`/organizations/${slug}`);

    // In a real app, you would use React Router or Next.js router
    console.log(`Navigating to: /organizations/${slug}`);
  };
  // Functions to update Firestore document (edit)
  const handleEdit = async (user) => {
    // For demo: toggle status Active/Inactive
    try {
      const userRef = doc(db, 'organizations', user.id);
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(userRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // Delete Firestore document
  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, 'organizations', userId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Utility functions you already have (status color, avatar color)...

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Onboarding':
        return 'bg-orange-100 text-orange-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',  
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500'
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Filter data by search term
  const filteredData = Array.isArray(data) ? data.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex-1 p-6 h-full overflow-hidden flex flex-col">
      <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table Controls - Fixed at top */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span>All</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table Container - Scrollable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Your columns */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>User</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </th>
                {/* Add other headers (Status, Permissions, Email, Tags, Actions) */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((user) => (
                <tr key={user.id} 
                                  onClick={(e) => handleRowClick(user, e)}
                className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.name || '')}`}>
                        {user.avatar || user.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">@{(user.name || 'unknown').toLowerCase().replace(' ', '')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role || 'No role assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email || 'No email'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.tags && user.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {tag}
                        </span>
                      ))}
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        +{(user.tags?.length || 0) > 4 ? (user.tags.length - 4) : 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Empty State */}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <p className="text-gray-500">No data found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MainTable;
