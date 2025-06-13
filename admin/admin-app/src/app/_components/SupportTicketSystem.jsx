"use client"
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Send, 
  MessageCircle, 
  User, 
  Calendar, 
  Hash, 
  Filter,
  Search,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp,
  arrayUnion,
  getDocs,
  where
} from 'firebase/firestore';
import { auth, db as firebaseDb } from '../api/firebase';

const SupportTicketSystem = ({ organizationId }) => {
  const [tickets, setTickets] = useState([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    reason: '',
    priority: 'medium',
    category: 'general'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Firebase collection path
  const getTicketsCollection = () => {
    if (organizationId) {
      return collection(firebaseDb, `organizations/${organizationId}/supportTickets`);
    }
    return collection(firebaseDb, 'supportTickets');
  };

  // Load tickets from Firebase
  useEffect(() => {
    const loadTickets = () => {
      try {
        const ticketsRef = getTicketsCollection();
        const q = query(ticketsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const ticketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastReply: doc.data().lastReply?.toDate() || new Date(),
            chatHistory: doc.data().chatHistory || []
          }));
          
          setTickets(ticketsData);
          setLoading(false);
        }, (error) => {
          console.error('Error loading tickets:', error);
          setError('Failed to load tickets');
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up tickets listener:', error);
        setError('Failed to initialize support system');
        setLoading(false);
      }
    };

    const unsubscribe = loadTickets();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [organizationId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateTicketId = async () => {
    try {
      const ticketsRef = getTicketsCollection();
      const snapshot = await getDocs(ticketsRef);
      const ticketCount = snapshot.size;
      return `TK${String(ticketCount + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      return `TK${String(Date.now()).slice(-3)}`;
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.reason.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!auth.currentUser) {
      setError('You must be logged in to create a ticket');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ticketId = await generateTicketId();
      const ticketsRef = getTicketsCollection();
      const currentTime = new Date();
      
      const newTicket = {
        ticketId: ticketId,
        subject: formData.subject.trim(),
        reason: formData.reason.trim(),
        priority: formData.priority,
        category: formData.category,
        status: 'open',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.email,
        createdByName: auth.currentUser.displayName || auth.currentUser.email,
        lastReply: serverTimestamp(),
        organizationId: organizationId || null,
        chatHistory: [
          {
            id: 1,
            sender: auth.currentUser.email,
            senderName: auth.currentUser.displayName || auth.currentUser.email,
            senderType: 'admin',
            message: formData.reason.trim(),
            timestamp: currentTime // Use regular Date instead of serverTimestamp()
          }
        ]
      };

      await addDoc(ticketsRef, newTicket);
      
      setFormData({ subject: '', reason: '', priority: 'medium', category: 'general' });
      setShowTicketForm(false);
      setSuccess('Ticket created successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !auth.currentUser) return;

    try {
      const currentTime = new Date();
      const newChatMessage = {
        id: selectedTicket.chatHistory.length + 1,
        sender: auth.currentUser.email,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        senderType: 'admin',
        message: newMessage.trim(),
        timestamp: currentTime // Use regular Date instead of serverTimestamp()
      };

      const ticketRef = doc(firebaseDb, getTicketsCollection().path, selectedTicket.id);
      
      await updateDoc(ticketRef, {
        chatHistory: arrayUnion(newChatMessage),
        lastReply: serverTimestamp()
      });

      // Update local state for immediate UI feedback
      const updatedTicket = {
        ...selectedTicket,
        chatHistory: [...selectedTicket.chatHistory, newChatMessage],
        lastReply: currentTime
      };

      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      ));
      
      setNewMessage('');
      setSuccess('Message sent successfully');
      setTimeout(() => setSuccess(null), 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const ticketRef = doc(firebaseDb, getTicketsCollection().path, ticketId);
      
      await updateDoc(ticketRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'system'
      });

      setSuccess(`Ticket status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError('Failed to update ticket status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading support tickets...</p>
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
          <button 
            onClick={() => setError(null)}
            className="ml-3 text-white hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
              </div>
            </div>
            <button
              onClick={() => setShowTicketForm(true)}
              disabled={!auth.currentUser}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Open</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
              <div className="text-sm text-gray-600">
                Total: <span className="font-medium text-blue-600">{filteredTickets.length}</span>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No tickets match your filters' : 'No tickets created yet'}
              </p>
              {!auth.currentUser && (
                <p className="text-sm text-gray-400 mt-2">Please log in to create support tickets</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Reply
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-25 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Hash size={14} className="text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-blue-600">{ticket.ticketId}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {ticket.subject}
                          </div>
                          <div className="text-sm text-gray-500 truncate mt-1">
                            {ticket.reason}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-none cursor-pointer ${getStatusColor(ticket.status)}`}
                        >
                          <option value="open">OPEN</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="resolved">RESOLVED</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority?.toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(ticket.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.createdByName || ticket.createdBy}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(ticket.lastReply)}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowChatModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Chat History"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Plus className="h-5 w-5 text-blue-500 mr-2" />
                  Create Support Ticket
                </h3>
                <button 
                  onClick={() => setShowTicketForm(false)} 
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of the issue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical Issue</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="performance">Performance</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Please provide detailed information about your issue or request"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Submit Ticket'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTicketForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
                    Ticket #{selectedTicket.ticketId}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTicket.subject}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChatModal(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedTicket.chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'admin' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <User size={12} />
                      <span className="text-xs opacity-75">
                        {message.senderType === 'admin' ? 'You' : 'Support'}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatDateTime(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketSystem;