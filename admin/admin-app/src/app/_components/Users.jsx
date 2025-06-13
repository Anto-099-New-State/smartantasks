

// _components/Trainers.js


// _components/Users.js
import React from 'react';

const Users = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search users..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>All Users</option>
            <option>Active Members</option>
            <option>Inactive Members</option>
          </select>
        </div>
        <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
          Add User
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((user) => (
          <div key={user} className="border rounded-lg p-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-center">User {user}</h3>
            <p className="text-gray-600 text-center text-sm">Premium Member</p>
            <div className="mt-3 text-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Users;