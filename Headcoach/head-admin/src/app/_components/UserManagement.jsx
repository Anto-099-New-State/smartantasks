// UserManagement.js - Enhanced with better readability and filtering
"use client"
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../api/firebase';

const UserManagement = ({ organizationId, userGyms }) => {
  const [users, setUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGym, setSelectedGym] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // New filter
  const [selectedMembership, setSelectedMembership] = useState('all'); // New filter
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Simple form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [gymId, setGymId] = useState('');
  const [membershipType, setMembershipType] = useState('basic');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [assignedTrainer, setAssignedTrainer] = useState('');
  const [status, setStatus] = useState('active');

  // Load users and trainers
  useEffect(() => {
    if (organizationId) {
      fetchUsers();
      fetchTrainers();
    }
  }, [organizationId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = [];
      
      for (const gym of userGyms) {
        const usersRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'users');
        const snapshot = await getDocs(usersRef);
        
        snapshot.forEach((doc) => {
          allUsers.push({
            id: doc.id,
            ...doc.data(),
            gymId: gym.id,
            gymName: gym.name,
            type: 'user' // Add type for consistency
          });
        });
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const allTrainers = [];
      
      for (const gym of userGyms) {
        const trainersRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'trainers');
        const snapshot = await getDocs(trainersRef);
        
        snapshot.forEach((doc) => {
          allTrainers.push({
            id: doc.id,
            ...doc.data(),
            gymId: gym.id,
            gymName: gym.name
          });
        });
      }
      
      setTrainers(allTrainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAge('');
    setGender('');
    setGymId('');
    setMembershipType('basic');
    setEmergencyContact('');
    setMedicalConditions('');
    setFitnessGoals('');
    setAssignedTrainer('');
    setStatus('active');
    setEditingUser(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAge(user.age || '');
    setGender(user.gender || '');
    setGymId(user.gymId || '');
    setMembershipType(user.membershipType || 'basic');
    setEmergencyContact(user.emergencyContact || '');
    setMedicalConditions(user.medicalConditions || '');
    setFitnessGoals(user.fitnessGoals || '');
    setAssignedTrainer(user.assignedTrainer || '');
    setStatus(user.status || 'active');
    setEditingUser(user);
    setShowModal(true);
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowAssignModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !age || !gender || !gymId || !emergencyContact) {
      alert('Please fill in all required fields');
      return;
    }

    const userData = {
      name,
      email,
      phone,
      age: parseInt(age),
      gender,
      gymId,
      membershipType,
      emergencyContact,
      medicalConditions,
      fitnessGoals,
      assignedTrainer,
      status,
      lastActive: new Date().toISOString().split('T')[0],
      lastEdited: serverTimestamp()
    };

    try {
      if (editingUser) {
        // Update existing user
        const userRef = doc(db, 'organizations', organizationId, 'gyms', editingUser.gymId, 'users', editingUser.id);
        await updateDoc(userRef, userData);
        alert('User updated successfully!');
      } else {
        // Add new user
        const usersRef = collection(db, 'organizations', organizationId, 'gyms', gymId, 'users');
        await addDoc(usersRef, {
          ...userData,
          createdAt: serverTimestamp()
        });
        alert('User added successfully!');
      }
      
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
    
    try {
      const userRef = doc(db, 'organizations', organizationId, 'gyms', user.gymId, 'users', user.id);
      await deleteDoc(userRef);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleAssignTrainer = async (trainerId) => {
    try {
      const userRef = doc(db, 'organizations', organizationId, 'gyms', selectedUser.gymId, 'users', selectedUser.id);
      
      await updateDoc(userRef, {
        assignedTrainer: trainerId,
        lastEdited: serverTimestamp()
      });
      
      setShowAssignModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert('Trainer assigned successfully!');
    } catch (error) {
      console.error('Error assigning trainer:', error);
      alert('Failed to assign trainer');
    }
  };

  const getTrainerName = (trainerId) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.name : 'Unassigned';
  };

  // Enhanced filter function
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGym = selectedGym === 'all' || user.gymId === selectedGym;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesMembership = selectedMembership === 'all' || user.membershipType === selectedMembership;
    return matchesSearch && matchesGym && matchesStatus && matchesMembership;
  });

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-700 mt-1 font-semibold">Manage gym members and their account permissions here</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 font-semibold transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            All Users <span className="text-slate-600 font-semibold">{filteredUsers.length}</span>
          </h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg w-64 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Gyms</option>
              {userGyms.map((gym) => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
            <select
              value={selectedMembership}
              onChange={(e) => setSelectedMembership(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Memberships</option>
              <option value="basic">Basic Only</option>
              <option value="premium">Premium Only</option>
              <option value="vip">VIP Only</option>
            </select>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto bg-white rounded-lg border-2 border-slate-300">
          <table className="min-w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="text-left py-4 px-6 font-bold text-slate-800 border-r border-slate-300 text-sm uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 border-r border-slate-300 text-sm uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 border-r border-slate-300 text-sm uppercase tracking-wider">Trainer</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 border-r border-slate-300 text-sm uppercase tracking-wider">Membership</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 border-r border-slate-300 text-sm uppercase tracking-wider">Gym</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                      <p className="text-slate-700 font-semibold">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-slate-700 font-semibold">No users found</p>
                      <p className="text-slate-600 text-sm font-medium">Try adjusting your filters or add new users</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`border-b-2 border-slate-200 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">{user.name}</div>
                          <div className="text-sm text-slate-700 font-semibold">{user.email}</div>
                          <div className="text-xs text-slate-600 font-medium">{user.phone} • Age: {user.age}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                        user.status === 'active' 
                          ? 'bg-green-200 text-green-800 border border-green-400' 
                          : user.status === 'suspended'
                          ? 'bg-red-200 text-red-800 border border-red-400'
                          : 'bg-gray-200 text-gray-800 border border-gray-400'
                      }`}>
                        {user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      {user.assignedTrainer ? (
                        <span className="text-emerald-600 font-bold">{getTrainerName(user.assignedTrainer)}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.membershipType === 'vip' 
                          ? 'bg-yellow-200 text-yellow-800 border border-yellow-400' 
                          : user.membershipType === 'premium'
                          ? 'bg-blue-200 text-blue-800 border border-blue-400'
                          : 'bg-gray-200 text-gray-800 border border-gray-400'
                      }`}>
                        {user.membershipType?.toUpperCase() || 'BASIC'}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <span className="text-slate-800 font-bold">{user.gymName}</span>
                      <div className="text-xs text-slate-600 font-medium">{user.gender}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openAssignModal(user)}
                          className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 font-semibold text-sm transition-colors"
                          title="Assign Trainer"
                        >
                          Trainer
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 font-semibold text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 font-semibold text-sm transition-colors"
                        >
                          Delete
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

      {/* Enhanced User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Age"
                    min="16"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="" className="text-slate-800">Select Gender</option>
                    <option value="male" className="text-slate-800">Male</option>
                    <option value="female" className="text-slate-800">Female</option>
                    <option value="other" className="text-slate-800">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Gym *</label>
                  <select
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="" className="text-slate-800">Select a gym</option>
                    {userGyms.map((gym) => (
                      <option key={gym.id} value={gym.id} className="text-slate-800">{gym.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Membership Type</label>
                  <select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="basic" className="text-slate-800">Basic</option>
                    <option value="premium" className="text-slate-800">Premium</option>
                    <option value="vip" className="text-slate-800">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Emergency Contact *</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Emergency contact name and phone"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Assigned Trainer</label>
                <select
                  value={assignedTrainer}
                  onChange={(e) => setAssignedTrainer(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="" className="text-slate-800">No trainer assigned</option>
                  {trainers
                    .filter(trainer => gymId === '' || trainer.gymId === gymId)
                    .map((trainer) => (
                      <option key={trainer.id} value={trainer.id} className="text-slate-800">
                        {trainer.name} - {trainer.specialization}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Medical Conditions</label>
                <textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="2"
                  placeholder="Any medical conditions or allergies"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Fitness Goals</label>
                <textarea
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="2"
                  placeholder="What are their fitness goals?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="active" className="text-slate-800">Active</option>
                  <option value="inactive" className="text-slate-800">Inactive</option>
                  <option value="suspended" className="text-slate-800">Suspended</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 font-bold transition-colors"
                >
                  {editingUser ? 'Update' : 'Add'} User
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-500 text-white py-3 px-4 rounded-lg hover:bg-slate-600 font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Assign Trainer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Assign Trainer</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900">User: {selectedUser?.name}</h4>
                <p className="text-sm text-slate-700 font-medium">Gym: {selectedUser?.gymName}</p>
                <p className="text-sm text-slate-700 font-medium">
                  Current Trainer: {selectedUser?.assignedTrainer ? getTrainerName(selectedUser.assignedTrainer) : 'None'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Available Trainers</label>
                {trainers.filter(trainer => trainer.gymId === selectedUser?.gymId && trainer.status === 'active').length === 0 ? (
                  <p className="text-slate-600 text-sm font-medium">No active trainers available in this gym</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trainers
                      .filter(trainer => trainer.gymId === selectedUser?.gymId && trainer.status === 'active')
                      .map((trainer) => (
                        <div key={trainer.id} className="flex items-center justify-between p-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="font-bold text-slate-900">{trainer.name}</div>
                            <div className="text-sm text-slate-700 font-medium">{trainer.specialization}</div>
                            <div className="text-xs text-slate-600 font-medium">{trainer.experience} experience</div>
                          </div>
                          <button
                            onClick={() => handleAssignTrainer(trainer.id)}
                            className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 font-bold transition-colors"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {selectedUser?.assignedTrainer && (
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleAssignTrainer('')}
                    className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 font-bold transition-colors"
                  >
                    Remove Current Trainer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;