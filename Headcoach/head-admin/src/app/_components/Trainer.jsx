// TrainerManagement.js - Simple and Clean Version
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
            gymName: gym.name
          });
        });
      }
      
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

  // Filter trainers
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGym = selectedGym === 'all' || trainer.gymId === selectedGym;
    return matchesSearch && matchesGym;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
          <p className="text-gray-600">Manage your team members and their account permissions here</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Add Trainers
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            All Trainers <span className="text-gray-400">{filteredTrainers.length}</span>
          </h3>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search trainers..."
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
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-left py-3 px-4">Trainer</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Specialization</th>
                <th className="text-left py-3 px-4">Gym</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No trainers found
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm text-black">
                            {trainer.name?.charAt(0) || 'T'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-black">{trainer.name}</div>
                          <div className="text-sm text-gray-500">{trainer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trainer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trainer.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-black">{trainer.specialization}</td>
                    <td className="py-3 px-4 text-sm text-black">{trainer.gymName}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEditModal(trainer)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trainer)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter trainer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Gym *</label>
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
                <label className="block text-sm font-medium text-black mb-1">Specialization *</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Weight Training, Yoga"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Experience *</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., 5 years"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Certifications</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., NASM, ACE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="3"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="active" className="text-black">Active</option>
                  <option value="inactive" className="text-black">Inactive</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600"
                >
                  {editingTrainer ? 'Update' : 'Add'} Trainer
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
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