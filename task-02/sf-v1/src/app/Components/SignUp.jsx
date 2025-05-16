import React from 'react'
import { FaEyeSlash, FaPhoneAlt } from 'react-icons/fa'
import { MdOutlineVisibility } from 'react-icons/md'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'

const SignUpForm = () => {
  return (
    <div className="flex bg-[url('')] min-h-screen bg-gradient-to-r from-[#0C1E1D] to-[#10211F] text-white">
      <div className="w-100 max-w-md p-8 py-1 mx-20 sm:px-10 mx-10 ">
        <h2 className="text-3xl font-bold text-[#93F5AE] mb-2">Sign up</h2>

        <form className="space-y-3">
          {/* Name */}
          <div className="relative w-full">
            <input
              type="text"
              id="name"
              placeholder="Your Name"
              className="peer w-90 px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label
              htmlFor="name"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Your Name
            </label>
          </div>

          {/* Email */}
          <div className="relative w-full">
            <input
              type="email"
              id="email"
              placeholder="Email"
              className="peer w-90 px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Email
            </label>
          </div>

          {/* Password */}
          <div className="relative w-full">
            <input
              type="password"
              id="password"
              placeholder="Password"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Password
            </label>
            <FaEyeSlash className="absolute left-80 top-5 text-gray-400" />
          </div>

          {/* Confirm Password */}
          <div className="relative w-full">
            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm Password"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="confirm-password"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Confirm Password
            </label>
            <MdOutlineVisibility className="absolute left-80 top-5 text-gray-400 " height={20} width={20} />
          </div>

          {/* Phone Number */}
          <div className="relative w-full">
            <input
              type="tel"
              id="phone"
              placeholder="Phone Number"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="phone"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Phone Number
            </label>
            <FaPhoneAlt className="absolute left-80 top-5 text-gray-400" />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-90 py-2 rounded-md bg-[#93F5AE] text-black font-semibold hover:bg-[#7ce49e] transition"
          >
              <Link href="/signin" >Sign In</Link> 
          </button>

          {/* Or Divider */}
          <div className="w-90 text-center text-sm text-white">or</div>

          {/* Google Sign In */}
          <button className="w-90 py-2 flex items-center justify-center bg-white text-black rounded-md hover:bg-gray-100 transition">
            <FcGoogle className="mr-2 text-lg" />
            Continue with Google
          </button>

          {/* Sign In Link */}
          <p className="w-90 px-5 text-sm text-white text-center">
            Already have an account?{' '}
            <a href="signin" className="text-blue-400 hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default SignUpForm
