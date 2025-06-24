// UserManagement.js - Simple and Clean Version using 'users' subcollection
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
            gymName: gym.name
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

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGym = selectedGym === 'all' || user.gymId === selectedGym;
    return matchesSearch && matchesGym;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage gym members and their account permissions here</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            All Users <span className="text-gray-400">{filteredUsers.length}</span>
          </h3>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg w-64 text-gray-700"
            />
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="border rounded-lg px-3 py-2 text-gray-700"
            >
              <option value="all">All Gyms</option>
              {userGyms.map((gym) => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg border-2 border-gray-300">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">User</th>
                <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Status</th>
                <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Trainer</th>
                <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Membership</th>
                <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Gym</th>
                <th className="text-left py-4 px-6 font-bold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-black font-medium">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-black font-medium">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`border-b-2 border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="py-4 px-6 border-r border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-black text-base">{user.name}</div>
                          <div className="text-sm text-gray-600 font-medium">{user.email}</div>
                          <div className="text-xs text-gray-500">{user.phone} • Age: {user.age}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200">
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
                    <td className="py-4 px-6 border-r border-gray-200">
                      {user.assignedTrainer ? (
                        <span className="text-emerald-600 font-medium">{getTrainerName(user.assignedTrainer)}</span>
                      ) : (
                        <span className="text-gray-400 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        user.membershipType === 'vip' 
                          ? 'bg-yellow-200 text-yellow-800' 
                          : user.membershipType === 'premium'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {user.membershipType?.toUpperCase() || 'BASIC'}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-gray-200">
                      <span className="text-black font-medium">{user.gymName}</span>
                      <div className="text-xs text-gray-500">{user.gender}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openAssignModal(user)}
                          className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 font-medium text-sm transition-colors"
                          title="Assign Trainer"
                        >
                          Trainer
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 font-medium text-sm transition-colors"
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

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Age"
                    min="16"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="" className="text-black">Select Gender</option>
                    <option value="male" className="text-black">Male</option>
                    <option value="female" className="text-black">Female</option>
                    <option value="other" className="text-black">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Gym *</label>
                  <select
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="" className="text-black">Select a gym</option>
                    {userGyms.map((gym) => (
                      <option key={gym.id} value={gym.id} className="text-black">{gym.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Membership Type</label>
                  <select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="basic" className="text-black">Basic</option>
                    <option value="premium" className="text-black">Premium</option>
                    <option value="vip" className="text-black">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Emergency Contact *</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Emergency contact name and phone"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Assigned Trainer</label>
                <select
                  value={assignedTrainer}
                  onChange={(e) => setAssignedTrainer(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="" className="text-black">No trainer assigned</option>
                  {trainers
                    .filter(trainer => gymId === '' || trainer.gymId === gymId)
                    .map((trainer) => (
                      <option key={trainer.id} value={trainer.id} className="text-black">
                        {trainer.name} - {trainer.specialization}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Medical Conditions</label>
                <textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="2"
                  placeholder="Any medical conditions or allergies"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Fitness Goals</label>
                <textarea
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="2"
                  placeholder="What are their fitness goals?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="active" className="text-black">Active</option>
                  <option value="inactive" className="text-black">Inactive</option>
                  <option value="suspended" className="text-black">Suspended</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 font-bold"
                >
                  {editingUser ? 'Update' : 'Add'} User
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Trainer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Assign Trainer</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-bold text-black">User: {selectedUser?.name}</h4>
                <p className="text-sm text-gray-600">Gym: {selectedUser?.gymName}</p>
                <p className="text-sm text-gray-600">
                  Current Trainer: {selectedUser?.assignedTrainer ? getTrainerName(selectedUser.assignedTrainer) : 'None'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Available Trainers</label>
                {trainers.filter(trainer => trainer.gymId === selectedUser?.gymId && trainer.status === 'active').length === 0 ? (
                  <p className="text-gray-500 text-sm">No active trainers available in this gym</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trainers
                      .filter(trainer => trainer.gymId === selectedUser?.gymId && trainer.status === 'active')
                      .map((trainer) => (
                        <div key={trainer.id} className="flex items-center justify-between p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                          <div>
                            <div className="font-bold text-black">{trainer.name}</div>
                            <div className="text-sm text-gray-600">{trainer.specialization}</div>
                            <div className="text-xs text-gray-500">{trainer.experience} experience</div>
                          </div>
                          <button
                            onClick={() => handleAssignTrainer(trainer.id)}
                            className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 font-bold"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {selectedUser?.assignedTrainer && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleAssignTrainer('')}
                    className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 font-bold"
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