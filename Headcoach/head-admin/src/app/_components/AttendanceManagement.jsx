// AttendanceManagement.js - Complete attendance system with analytics and calendar
"use client"
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../api/firebase';

const AttendanceManagement = ({ organizationId, userGyms }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGym, setSelectedGym] = useState('all');
  const [activeTab, setActiveTab] = useState('today'); // today, calendar, analytics
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [notes, setNotes] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarAttendance, setCalendarAttendance] = useState({});

  // Load data
  useEffect(() => {
    if (organizationId) {
      fetchAllData();
    }
  }, [organizationId, selectedDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTrainers(),
        fetchUsers(),
        fetchAttendanceRecords(),
        fetchCalendarAttendance()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
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
          type: 'trainer'
        });
      });
    }
    setTrainers(allTrainers);
  };

  const fetchUsers = async () => {
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
          type: 'user'
        });
      });
    }
    setUsers(allUsers);
  };

  const fetchAttendanceRecords = async () => {
    const allRecords = [];
    for (const gym of userGyms) {
      const attendanceRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'attendance');
      const q = query(
        attendanceRef,
        where('date', '==', selectedDate),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      
      snapshot.forEach((doc) => {
        allRecords.push({
          id: doc.id,
          ...doc.data(),
          gymId: gym.id,
          gymName: gym.name
        });
      });
    }
    setAttendanceRecords(allRecords);
  };

  const fetchCalendarAttendance = async () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const calendarData = {};
    
    for (const gym of userGyms) {
      const attendanceRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'attendance');
      
      // Get attendance for the entire month
      for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
        
        const q = query(attendanceRef, where('date', '==', date));
        const snapshot = await getDocs(q);
        
        if (!calendarData[date]) {
          calendarData[date] = { present: 0, absent: 0, late: 0 };
        }
        
        snapshot.forEach((doc) => {
          const record = doc.data();
          calendarData[date][record.status] = (calendarData[date][record.status] || 0) + 1;
        });
      }
    }
    
    setCalendarAttendance(calendarData);
  };

  const markAttendance = async () => {
    if (!selectedPerson) return;

    try {
      const attendanceRef = collection(
        db, 
        'organizations', 
        organizationId, 
        'gyms', 
        selectedPerson.gymId, 
        'attendance'
      );

      await addDoc(attendanceRef, {
        personId: selectedPerson.id,
        personName: selectedPerson.name,
        personType: selectedPerson.type,
        status: attendanceStatus,
        date: selectedDate,
        notes: notes,
        timestamp: serverTimestamp(),
        markedBy: 'admin' // You can replace with actual user
      });

      setShowMarkModal(false);
      setSelectedPerson(null);
      setNotes('');
      fetchAttendanceRecords();
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  // Get all people (trainers + users) for a gym
  const getAllPeople = () => {
    const allPeople = [...trainers, ...users];
    if (selectedGym === 'all') return allPeople;
    return allPeople.filter(person => person.gymId === selectedGym);
  };

  // Get attendance status for a person on selected date
  const getPersonAttendance = (personId) => {
    return attendanceRecords.find(record => record.personId === personId);
  };

  // Calculate analytics
  const getAnalytics = () => {
    const allPeople = getAllPeople();
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = allPeople.length - attendanceRecords.length + attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    
    return {
      total: allPeople.length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      percentage: allPeople.length > 0 ? Math.round((presentCount / allPeople.length) * 100) : 0
    };
  };

  // Calendar component
  const Calendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const dayAttendance = calendarAttendance[date] || { present: 0, absent: 0, late: 0 };
      const isToday = date === new Date().toISOString().split('T')[0];
      const isSelected = date === selectedDate;
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-100' : ''
          } ${isSelected ? 'bg-emerald-100 border-emerald-500' : ''}`}
        >
          <div className="font-medium text-sm">{day}</div>
          {(dayAttendance.present > 0 || dayAttendance.late > 0 || dayAttendance.absent > 0) && (
            <div className="mt-1 space-y-1">
              {dayAttendance.present > 0 && (
                <div className="text-xs bg-green-200 text-green-800 px-1 rounded">
                  P: {dayAttendance.present}
                </div>
              )}
              {dayAttendance.late > 0 && (
                <div className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                  L: {dayAttendance.late}
                </div>
              )}
              {dayAttendance.absent > 0 && (
                <div className="text-xs bg-red-200 text-red-800 px-1 rounded">
                  A: {dayAttendance.absent}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center font-medium text-gray-600 border border-gray-200">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
        
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Absent</span>
          </div>
        </div>
      </div>
    );
  };

  const analytics = getAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage attendance for trainers and users</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-400 rounded-lg text-black font-medium"
          />
          <select
            value={selectedGym}
            onChange={(e) => setSelectedGym(e.target.value)}
            className="px-3 py-2 border-2 border-gray-400 rounded-lg text-black font-medium"
          >
            <option value="all">All Gyms</option>
            {userGyms.map((gym) => (
              <option key={gym.id} value={gym.id}>{gym.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-300 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{analytics.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total People</div>
        </div>
        <div className="bg-green-500 rounded-lg p-6 text-center text-white">
          <div className="text-3xl font-bold">{analytics.present}</div>
          <div className="text-sm mt-1">Present</div>
        </div>
        <div className="bg-red-500 rounded-lg p-6 text-center text-white">
          <div className="text-3xl font-bold">{analytics.absent}</div>
          <div className="text-sm mt-1">Absent</div>
        </div>
        <div className="bg-yellow-500 rounded-lg p-6 text-center text-white">
          <div className="text-3xl font-bold">{analytics.late}</div>
          <div className="text-sm mt-1">Late</div>
        </div>
        <div className="bg-blue-500 rounded-lg p-6 text-center text-white">
          <div className="text-3xl font-bold">{analytics.percentage}%</div>
          <div className="text-sm mt-1">Attendance Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 px-4 rounded-md font-medium ${
            activeTab === 'today' 
              ? 'bg-white text-black shadow' 
              : 'text-gray-600'
          }`}
        >
          Today's Attendance
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-4 rounded-md font-medium ${
            activeTab === 'calendar' 
              ? 'bg-white text-black shadow' 
              : 'text-gray-600'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md font-medium ${
            activeTab === 'analytics' 
              ? 'bg-white text-black shadow' 
              : 'text-gray-600'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">
              Attendance for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <button
              onClick={() => setShowMarkModal(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium"
            >
              Mark Attendance
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Person</th>
                  <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Type</th>
                  <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Gym</th>
                  <th className="text-left py-4 px-6 font-bold text-black border-r border-gray-300">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-black">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-black font-medium">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                      Loading attendance...
                    </td>
                  </tr>
                ) : (
                  getAllPeople().map((person, index) => {
                    const attendance = getPersonAttendance(person.id);
                    return (
                      <tr key={person.id} className={`border-b-2 border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="py-4 px-6 border-r border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              person.type === 'trainer' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {person.name?.charAt(0) || 'P'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-black">{person.name}</div>
                              <div className="text-sm text-gray-600">{person.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 border-r border-gray-200">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            person.type === 'trainer' 
                              ? 'bg-blue-200 text-blue-800' 
                              : 'bg-purple-200 text-purple-800'
                          }`}>
                            {person.type === 'trainer' ? 'Trainer' : 'User'}
                          </span>
                        </td>
                        <td className="py-4 px-6 border-r border-gray-200">
                          <span className="text-black font-medium">{person.gymName}</span>
                        </td>
                        <td className="py-4 px-6 border-r border-gray-200">
                          {attendance ? (
                            <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                              attendance.status === 'present' 
                                ? 'bg-green-200 text-green-800 border border-green-400'
                                : attendance.status === 'late'
                                ? 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                                : 'bg-red-200 text-red-800 border border-red-400'
                            }`}>
                              {attendance.status === 'present' ? 'Present' : attendance.status === 'late' ? 'Late' : 'Absent'}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">Not Marked</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{attendance?.notes || '-'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && <Calendar />}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold text-black mb-4">Monthly Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Daily Attendance:</span>
                <span className="font-bold text-black">{analytics.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Best Performing Gym:</span>
                <span className="font-bold text-black">{userGyms[0]?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Attendance Records:</span>
                <span className="font-bold text-black">{attendanceRecords.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold text-black mb-4">Trends</h3>
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Advanced analytics coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Mark Attendance</h3>
              <button onClick={() => setShowMarkModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">Select Person</label>
                <select
                  value={selectedPerson?.id || ''}
                  onChange={(e) => {
                    const person = getAllPeople().find(p => p.id === e.target.value);
                    setSelectedPerson(person);
                  }}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium"
                >
                  <option value="">Choose person...</option>
                  {getAllPeople().map((person) => (
                    <option key={person.id} value={person.id} className="text-black">
                      {person.name} ({person.type}) - {person.gymName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Status</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium"
                >
                  <option value="present" className="text-black">Present</option>
                  <option value="absent" className="text-black">Absent</option>
                  <option value="late" className="text-black">Late</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white font-medium"
                  rows="3"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={markAttendance}
                  disabled={!selectedPerson}
                  className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 font-bold disabled:opacity-50"
                >
                  Mark Attendance
                </button>
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 font-bold"
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

export default AttendanceManagement;