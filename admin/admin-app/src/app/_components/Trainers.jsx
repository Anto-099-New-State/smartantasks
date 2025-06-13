import React from 'react';

const Trainers = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Trainers</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Specialization</th>
              <th className="text-left py-3 px-4">Gym Location</th>
              <th className="text-left py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((trainer) => (
              <tr key={trainer} className="border-b">
                <td className="py-3 px-4">Trainer {trainer}</td>
                <td className="py-3 px-4">Weight Training</td>
                <td className="py-3 px-4">FitCore Downtown</td>
                <td className="py-3 px-4">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Trainers;