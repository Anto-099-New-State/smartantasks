'use client'; // required if using Next.js App Router

import React, { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../api/firebase'; // adjust path as needed
import { useRouter } from 'next/navigation';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); // change to your protected route
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex bg-[url('')] bg-gradient-to-r from-[#0D1A1C] to-[#1B2C2E] text-white">
      <div className="flex flex-col px-6 mx-30 my-8 w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#A4FEB7] mb-1">Sign in</h1>
        <p className="text-gray-300 mb-4">
          Please login to continue to your account.
        </p>

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute top-3 left-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-white rounded-2xl placeholder-white focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute top-3 left-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-white rounded-2xl placeholder-white focus:outline-none"
              />
            </div>
            <Link href="/fp" className="text-blue-400 text-sm mt-1 inline-block">
              Forgot password
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleEmailLogin}
            className="w-full py-2 rounded-xl bg-[#A4FEB7] text-black font-semibold text-base cursor-pointer"
          >
            Sign in
          </button>

          {/* OR Divider */}
          <div className="text-center text-gray-400 text-sm">or</div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2 flex items-center justify-center border border-gray-500 rounded-xl text-white hover:bg-gray-800 cursor-pointer text-sm"
          >
            <FcGoogle className="mr-2 text-lg" />
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-gray-400 text-xs text-center">
            Don’t have an account?{' '}
            <Link href="/signup" className="text-blue-400">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignInForm;
