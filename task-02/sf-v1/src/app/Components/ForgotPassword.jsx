import React from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const ForgotPassword = () => {
  return (
    <div className="relative bg-[url('/img_back.png')] bg-cover bg-center min-h-screen w-full overflow-hidden bg-[#0C1E1D] text-white flex items-center justify-center px-6">


      {/* Content container */}
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl w-full">
        <div className="w-full md:w-1/2 mb-12 md:mb-0 px-6">
          <button className="mb-6 flex items-center space-x-2 text-white hover:text-green-300">
            <ChevronLeft className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-semibold mb-2 text-green-200">Forgot password</h2>
          <p className="text-gray-200 mb-2">
            Please enter your email to reset the password
          </p>
          <p className="text-red-400 text-sm mb-6">
            an email will be sent to the given address, <br />
            kindly verify using the correct mail id.
          </p>

          <div className="mb-6">
            <label className="block mb-2 text-white font-medium">Your Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-md bg-transparent border border-white text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="example@mail.com"
            />
          </div>

          <button className="bg-green-300 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-full">
                <Link href="/auth" className="">Confirm Password</Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
