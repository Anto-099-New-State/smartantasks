// AttendanceManagement.js - Enhanced with filters and better readability
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

const AttendanceManagement = ({ organizationId, userGyms = [] }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGym, setSelectedGym] = useState('all');
  const [selectedPersonType, setSelectedPersonType] = useState('all'); // New filter
  const [activeTab, setActiveTab] = useState('today');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [notes, setNotes] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarAttendance, setCalendarAttendance] = useState({});

  // Load data only when we have required props
  useEffect(() => {
    if (organizationId && userGyms && userGyms.length > 0) {
      fetchAllData();
    }
  }, [organizationId, selectedDate]);

  useEffect(() => {
    if (activeTab === 'calendar' && organizationId && userGyms?.length > 0) {
      fetchCalendarData();
    }
  }, [currentMonth, organizationId, activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTrainers(),
        fetchUsers(),
        fetchAttendanceRecords()
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
      try {
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
      } catch (error) {
        console.error(`Error fetching trainers for gym ${gym.id}:`, error);
      }
    }
    setTrainers(allTrainers);
  };

  const fetchUsers = async () => {
    const allUsers = [];
    for (const gym of userGyms) {
      try {
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
      } catch (error) {
        console.error(`Error fetching users for gym ${gym.id}:`, error);
      }
    }
    setUsers(allUsers);
  };

  const fetchAttendanceRecords = async () => {
    const allRecords = [];
    for (const gym of userGyms) {
      try {
        const attendanceRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'attendance');
        const q = query(
          attendanceRef,
          where('date', '==', selectedDate)
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
      } catch (error) {
        console.error(`Error fetching attendance for gym ${gym.id}:`, error);
      }
    }
    setAttendanceRecords(allRecords);
  };

  const fetchCalendarData = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const calendarData = {};
    
    for (const gym of userGyms) {
      try {
        const attendanceRef = collection(db, 'organizations', organizationId, 'gyms', gym.id, 'attendance');
        const q = query(
          attendanceRef,
          where('date', '>=', startDate.toISOString().split('T')[0]),
          where('date', '<=', endDate.toISOString().split('T')[0])
        );
        const snapshot = await getDocs(q);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          
          if (!calendarData[date]) {
            calendarData[date] = { present: 0, absent: 0, late: 0 };
          }
          
          calendarData[date][data.status]++;
        });
      } catch (error) {
        console.error(`Error fetching calendar data for gym ${gym.id}:`, error);
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
        markedBy: 'admin'
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

  const getAllPeople = () => {
    let allPeople = [...trainers, ...users];
    
    // Filter by gym
    if (selectedGym !== 'all') {
      allPeople = allPeople.filter(person => person.gymId === selectedGym);
    }
    
    // Filter by person type
    if (selectedPersonType !== 'all') {
      allPeople = allPeople.filter(person => person.type === selectedPersonType);
    }
    
    return allPeople;
  };

  const getPersonAttendance = (personId) => {
    return attendanceRecords.find(record => record.personId === personId);
  };

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

  const getWeeklyAnalytics = () => {
    // Calculate weekly attendance for the past 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days.map(date => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      attendance: calendarAttendance[date]?.present || 0
    }));
  };

  // Professional Calendar Component
  const Calendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-slate-200"></div>);
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
          className={`h-32 border border-slate-200 p-3 cursor-pointer transition-all hover:bg-slate-50 ${
            isToday ? 'bg-blue-50 border-blue-200' : ''
          } ${isSelected ? 'bg-emerald-50 border-emerald-300 shadow-sm' : ''}`}
        >
          <div className="font-semibold text-slate-800 text-base mb-2">{day}</div>
          {(dayAttendance.present > 0 || dayAttendance.late > 0 || dayAttendance.absent > 0) && (
            <div className="space-y-1">
              {dayAttendance.present > 0 && (
                <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-semibold">
                  ✓ {dayAttendance.present}
                </div>
              )}
              {dayAttendance.late > 0 && (
                <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-semibold">
                  ⚠ {dayAttendance.late}
                </div>
              )}
              {dayAttendance.absent > 0 && (
                <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md font-semibold">
                  ✕ {dayAttendance.absent}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-7 gap-0 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-12 flex items-center justify-center font-semibold text-slate-800 text-sm border-b border-slate-200">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0 border border-slate-200 rounded-lg overflow-hidden">
            {days}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div>
              <span className="text-slate-700 font-medium">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
              <span className="text-slate-700 font-medium">Late</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-slate-700 font-medium">Absent</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const analytics = getAnalytics();
  const weeklyData = getWeeklyAnalytics();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-slate-700 mt-1 font-medium">Track and manage attendance for trainers and users</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <select
            value={selectedGym}
            onChange={(e) => setSelectedGym(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Gyms</option>
            {userGyms && userGyms.length > 0 ? (
              userGyms.map((gym) => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))
            ) : (
              <option disabled>No gyms available</option>
            )}
          </select>
          <select
            value={selectedPersonType}
            onChange={(e) => setSelectedPersonType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All People</option>
            <option value="trainer">Trainers Only</option>
            <option value="user">Users Only</option>
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Total People</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.total}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-semibold">Present</p>
              <p className="text-3xl font-bold mt-1">{analytics.present}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-red-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-semibold">Absent</p>
              <p className="text-3xl font-bold mt-1">{analytics.absent}</p>
            </div>
            <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-semibold">Late</p>
              <p className="text-3xl font-bold mt-1">{analytics.late}</p>
            </div>
            <div className="w-12 h-12 bg-amber-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold">Attendance Rate</p>
              <p className="text-3xl font-bold mt-1">{analytics.percentage}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'today'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Today's Attendance
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'calendar'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-slate-700 mt-1 font-medium">
                  Showing {getAllPeople().length} {selectedPersonType === 'all' ? 'people' : selectedPersonType === 'trainer' ? 'trainers' : 'users'}
                  {selectedGym !== 'all' && ` from ${userGyms.find(g => g.id === selectedGym)?.name}`}
                </p>
              </div>
              <button
                onClick={() => setShowMarkModal(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Mark Attendance
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Gym</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                        <p className="text-slate-700 font-semibold">Loading attendance data...</p>
                      </div>
                    </td>
                  </tr>
                ) : getAllPeople().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-slate-700 font-semibold">No people found</p>
                        <p className="text-slate-600 text-sm font-medium">Try adjusting your filters or add trainers/users to track attendance</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getAllPeople().map((person) => {
                    const attendance = getPersonAttendance(person.id);
                    return (
                      <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              person.type === 'trainer' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                person.type === 'trainer' ? 'text-blue-800' : 'text-purple-800'
                              }`}>
                                {person.name?.charAt(0) || 'P'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                              <div className="text-sm text-slate-700 font-medium">{person.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            person.type === 'trainer' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {person.type === 'trainer' ? 'Trainer' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold">
                          {person.gymName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance ? (
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                              attendance.status === 'present' 
                                ? 'bg-emerald-100 text-emerald-800'
                                : attendance.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status === 'present' ? 'Present' : attendance.status === 'late' ? 'Late' : 'Absent'}
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                              Not Marked
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {attendance?.notes || '-'}
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Average Daily Attendance:</span>
                <span className="font-bold text-slate-900">{analytics.percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Total Trainers:</span>
                <span className="font-bold text-slate-900">{trainers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Total Users:</span>
                <span className="font-bold text-slate-900">{users.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Active Gyms:</span>
                <span className="font-bold text-slate-900">{userGyms.length}</span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-700 mb-2 font-semibold">Attendance Breakdown</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                      <span className="font-semibold text-slate-700">Present</span>
                    </div>
                    <span className="font-bold text-slate-900">{analytics.present}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                      <span className="font-semibold text-slate-700">Late</span>
                    </div>
                    <span className="font-bold text-slate-900">{analytics.late}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="font-semibold text-slate-700">Absent</span>
                    </div>
                    <span className="font-bold text-slate-900">{analytics.absent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Weekly Trend</h3>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 w-12">{day.day}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((day.attendance / Math.max(...weeklyData.map(d => d.attendance), 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-8 text-right">{day.attendance}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Gym Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Gym</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Total People</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Present Today</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {userGyms.map((gym) => {
                    const gymPeople = [...trainers, ...users].filter(p => p.gymId === gym.id);
                    const gymAttendance = attendanceRecords.filter(r => r.gymId === gym.id && r.status === 'present');
                    const rate = gymPeople.length > 0 ? Math.round((gymAttendance.length / gymPeople.length) * 100) : 0;
                    
                    return (
                      <tr key={gym.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{gym.name}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{gymPeople.length}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{gymAttendance.length}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${rate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Mark Attendance</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Select Person</label>
                <select
                  value={selectedPerson?.id || ''}
                  onChange={(e) => {
                    const person = getAllPeople().find(p => p.id === e.target.value);
                    setSelectedPerson(person);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-medium"
                >
                  <option value="">Choose a person...</option>
                  {getAllPeople().map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.type}) - {person.gymName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Status</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setAttendanceStatus('present')}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      attendanceStatus === 'present'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } border`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => setAttendanceStatus('late')}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      attendanceStatus === 'late'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } border`}
                  >
                    Late
                  </button>
                  <button
                    onClick={() => setAttendanceStatus('absent')}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      attendanceStatus === 'absent'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } border`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the attendance..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMarkModal(false);
                  setSelectedPerson(null);
                  setNotes('');
                }}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={markAttendance}
                disabled={!selectedPerson}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;