'use client';

import { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../api/firebase';
import LoadingOverlay from './LoadingOverlay';

const RequestResetPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if this page was accessed via URL params (coming from auth action)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    // If there's a mode parameter, redirect to appropriate page
    if (mode && oobCode) {
      handleModeRedirect(mode);
    }
  }, []);

  const handleModeRedirect = (mode) => {
    switch (mode) {
      case 'verifyEmail':
        window.location.href = '/auth-verf';
        break;
      case 'resetPassword':
        // Stay on this page for password reset
        break;
      case 'recoverEmail':
        window.location.href = '/signin';
        break;
      default:
        window.location.href = '/signin';
    }
  };

  const handleResetRequest = async () => {
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'http://localhost:3000/auth-verf',
        handleCodeInApp: true,
      });
      setMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      // Handle specific Firebase errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError(err.message);
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleResetRequest();
    }
  };

  return (
    <div className="min-h-screen bg-[url('')] flex flex-row items-start text-white relative">
      {loading && <LoadingOverlay />}
      
      <div className="p-5 rounded-lg my-20 mx-20 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1 text-green-300">Reset Password</h2>
        <p className="py-4 mb-6 text-white">
          An email will be sent to your verified email address.
          Click on the link to reset your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full p-2 mb-4 ring-1 ring-white rounded-2xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
          disabled={loading}
        />

        {error && (
          <p className="text-red-400 mb-2 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </p>
        )}
        
        {message && (
          <p className="text-green-400 mb-2 text-sm bg-green-900/20 p-2 rounded">
            {message}
          </p>
        )}

        <button
          onClick={handleResetRequest}
          disabled={loading || !email.trim()}
          className="w-full bg-green-400 text-black py-2 rounded-2xl hover:bg-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/signin'}
            className="text-green-400 hover:text-green-300 text-sm underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestResetPage;