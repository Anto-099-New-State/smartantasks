import React from 'react'

function page() {
  return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#1f3c35] to-[#111716] text-white">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-[#111716]/80 backdrop-blur-sm border border-[#9effb0]">
        <h1 className="text-4xl font-bold mb-4">Login to <span className="text-[#9effb0]">Smartan</span></h1>
        <form className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-[#1f3c35] border border-[#9effb0]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#9effb0]"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-[#1f3c35] border border-[#9effb0]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#9effb0]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 mt-4 bg-[#9effb0] text-[#111716] font-bold rounded-lg hover:bg-[#8beea0] transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default page