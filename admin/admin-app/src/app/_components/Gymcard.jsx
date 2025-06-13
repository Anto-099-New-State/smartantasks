import React from 'react';
import { MapPin, Clock, Users, Map } from 'lucide-react';

const GymCard = ({ 
  gym, 
  onAssignCoach, 
  onEdit, 
  onView,
  onShowMap, // New prop for map functionality
  isLoading = false 
}) => {
  const handleAssignCoach = () => {
    if (onAssignCoach && !isLoading) {
      onAssignCoach(gym);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(gym);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(gym);
    }
  };

  const handleShowMap = () => {
    if (onShowMap) {
      onShowMap(gym);
    }
  };

  // Check if gym has coordinates OR address info for mapping
  const hasLocationInfo = () => {
    // Has coordinates
    if (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) {
      return { type: 'coordinates', available: true };
    }
    
    // Has address information for geocoding
    const hasAddress = gym.address || gym.location || gym.city;
    return { type: 'address', available: hasAddress };
  };

  const locationInfo = hasLocationInfo();

  // Create address string for display
  const getAddressString = () => {
    const addressParts = [
      gym.address,
      gym.location,
      gym.city,
      gym.state
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Gym Image/Header */}
      <div 
        className="h-48 bg-gradient-to-r from-orange-400 to-red-500 relative cursor-pointer"
        onClick={handleView}
      >
        {gym.image ? (
          <img 
            src={gym.image} 
            alt={gym.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Map Button Overlay */}
        {locationInfo.available && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering handleView
              handleShowMap();
            }}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
            title="View on Map"
          >
            <Map size={16} className="text-gray-700" />
          </button>
        )}

        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold">{gym.name}</h3>
          {gym.status && (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              gym.status === 'active' ? 'bg-green-500' : 
              gym.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {gym.status}
            </span>
          )}
        </div>
      </div>

      {/* Gym Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="flex items-center space-x-1 text-gray-600 mb-1">
              <Users size={14} />
              <span>capacity</span>
            </div>
            <p className="font-semibold text-black">{gym.capacity}</p>
          </div>
          <div>
            <div className="flex items-center space-x-1 text-gray-600 mb-1">
              <Clock size={14} />
              <span>opening time</span>
            </div>
            <p className="font-semibold text-black">{gym.openingTime}</p>
          </div>
          <div className="col-span-2">
            <div className="flex items-center space-x-1 text-gray-600 mb-1">
              <MapPin size={14} />
              <span>location</span>
            </div>
            <p className="font-semibold text-black text-sm">{getAddressString()}</p>
          </div>
          <div>
            <div className="flex items-center space-x-1 text-gray-700 mb-1">
              <Clock size={14} />
              <span>closing time</span>
            </div>
            <p className="font-semibold text-black">{gym.closingTime}</p>
          </div>
        </div>

        {/* Coordinates Display (if available) */}
        {locationInfo.type === 'coordinates' && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-xs text-green-700">
              <MapPin size={12} />
              <span>📍 Coordinates: {parseFloat(gym.coordinates.lat).toFixed(4)}, {parseFloat(gym.coordinates.lng).toFixed(4)}</span>
            </div>
          </div>
        )}

        {/* Current Members Progress Bar (if available) */}
        {gym.currentMembers !== undefined && gym.capacity && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Current Members</span>
              <span>{gym.currentMembers}/{gym.capacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((gym.currentMembers / gym.capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={handleAssignCoach}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-900 text-white hover:bg-green-600'
            }`}
          >
            {isLoading ? 'Loading...' : 'Assign Coach'}
          </button>

          {/* Map Button (if location info available) */}
          {locationInfo.available && (
            <button 
              onClick={handleShowMap}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              title="View on Map"
            >
              <Map size={16} />
            </button>
          )}

          {/* Edit Button (if edit function provided) */}
          {onEdit && (
            <button 
              onClick={handleEdit}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              title="Edit Gym"
            >
              ✏️
            </button>
          )}
        </div>

        {/* Location Status Info */}
        <div className="mt-3">
          {locationInfo.type === 'coordinates' ? (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✅ Ready for mapping - coordinates available
              </p>
            </div>
          ) : locationInfo.available ? (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                🗺️ Will geocode address when mapped
              </p>
            </div>
          ) : (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                📍 Location information not available for mapping
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GymCard;