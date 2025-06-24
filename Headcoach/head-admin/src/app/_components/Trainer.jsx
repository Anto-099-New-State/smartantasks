// TrainerManagement.js - Enhanced with better readability and filtering
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

const TrainerManagement = ({ organizationId, userGyms }) => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGym, setSelectedGym] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // New filter
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  // Simple form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [gymId, setGymId] = useState('');
  const [certifications, setCertifications] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('active');

  // Load trainers
  useEffect(() => {
    if (organizationId) {
      fetchTrainers();
    }
  }, [organizationId]);

  const fetchTrainers = async () => {
    setLoading(true);
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
            gymName: gym.name,
            type: 'trainer' // Add type for consistency
          });
        });
      }
      console.log(allTrainers);
      setTrainers(allTrainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSpecialization('');
    setExperience('');
    setGymId('');
    setCertifications('');
    setBio('');
    setStatus('active');
    setEditingTrainer(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setName(trainer.name || '');
    setEmail(trainer.email || '');
    setPhone(trainer.phone || '');
    setSpecialization(trainer.specialization || '');
    setExperience(trainer.experience || '');
    setGymId(trainer.gymId || '');
    setCertifications(trainer.certifications || '');
    setBio(trainer.bio || '');
    setStatus(trainer.status || 'active');
    setEditingTrainer(trainer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !specialization || !experience || !gymId) {
      alert('Please fill in all required fields');
      return;
    }

    const trainerData = {
      name,
      email,
      phone,
      specialization,
      experience,
      gymId,
      certifications,
      bio,
      status,
      lastActive: new Date().toISOString().split('T')[0],
      lastEdited: serverTimestamp()
    };

    try {
      if (editingTrainer) {
        // Update existing trainer
        const trainerRef = doc(db, 'organizations', organizationId, 'gyms', editingTrainer.gymId, 'trainers', editingTrainer.id);
        await updateDoc(trainerRef, trainerData);
        alert('Trainer updated successfully!');
      } else {
        // Add new trainer
        const trainersRef = collection(db, 'organizations', organizationId, 'gyms', gymId, 'trainers');
        await addDoc(trainersRef, {
          ...trainerData,
          createdAt: serverTimestamp()
        });
        alert('Trainer added successfully!');
      }
      
      closeModal();
      fetchTrainers();
    } catch (error) {
      console.error('Error saving trainer:', error);
      alert('Failed to save trainer');
    }
  };

  const handleDelete = async (trainer) => {
    if (!window.confirm(`Are you sure you want to delete ${trainer.name}?`)) return;
    
    try {
      const trainerRef = doc(db, 'organizations', organizationId, 'gyms', trainer.gymId, 'trainers', trainer.id);
      await deleteDoc(trainerRef);
      alert('Trainer deleted successfully!');
      fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      alert('Failed to delete trainer');
    }
  };

  // Enhanced filter function
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGym = selectedGym === 'all' || trainer.gymId === selectedGym;
    const matchesStatus = selectedStatus === 'all' || trainer.status === selectedStatus;
    return matchesSearch && matchesGym && matchesStatus;
  });

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trainer Management</h1>
          <p className="text-slate-700 mt-1 font-semibold">Manage your team members and their account permissions here</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 font-semibold transition-colors"
        >
          Add Trainers
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            All Trainers <span className="text-slate-600 font-semibold">{filteredTrainers.length}</span>
          </h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search trainers..."
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
            </select>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Trainer</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Specialization</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Experience</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Gym</th>
                <th className="text-left py-4 px-6 font-bold text-slate-800 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                      <p className="text-slate-700 font-semibold">Loading trainers...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-slate-700 font-semibold">No trainers found</p>
                      <p className="text-slate-600 text-sm font-medium">Try adjusting your filters or add new trainers</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-bold text-sm">
                            {trainer.name?.charAt(0) || 'T'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{trainer.name}</div>
                          <div className="text-sm text-slate-700 font-medium">{trainer.email}</div>
                          <div className="text-xs text-slate-600">{trainer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        trainer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trainer.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-800 font-semibold">{trainer.specialization}</span>
                      {trainer.certifications && (
                        <div className="text-xs text-slate-600 font-medium mt-1">{trainer.certifications}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800 font-semibold">{trainer.experience}</td>
                    <td className="py-4 px-6 text-sm text-slate-800 font-semibold">{trainer.gymName}</td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(trainer)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(trainer)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-semibold transition-colors"
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

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter trainer name"
                  required
                />
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

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

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
                <label className="block text-sm font-bold text-slate-800 mb-2">Specialization *</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Weight Training, Yoga"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Experience *</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., 5 years"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Certifications</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., NASM, ACE"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-lg text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="3"
                  placeholder="Brief description"
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
                </select>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 font-bold transition-colors"
                >
                  {editingTrainer ? 'Update' : 'Add'} Trainer
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
    </div>
  );
};

export default TrainerManagement;