import React, { useState, useEffect } from 'react';
import { Plus, Filter, Grid, List, Map, MapPin, Navigation } from 'lucide-react';
import GymCard from './GymCard';
import GymMap from './GymMap';

const MyGyms = ({ 
  gyms = [], 
  onAssignCoach, 
  onEditGym, 
  onViewGym,
  onAddGym,
  isLoading = false,
  organizationId = null 
}) => {
  const [filteredGyms, setFilteredGyms] = useState(gyms);
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Update filtered gyms when gyms prop changes
  useEffect(() => {
    setFilteredGyms(gyms);
  }, [gyms]);

  // Get user location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(location);
              console.log('User location obtained:', location);
            },
            (error) => {
              console.log('Could not get user location:', error.message);
            }
          );
        }
      } catch (error) {
        console.log('Geolocation not supported:', error.message);
      }
    };

    getUserLocation();
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Find nearest gyms to user location
  const findNearestGyms = (userLoc, gymList, maxDistance = 50) => {
    return gymList
      .filter(gym => gym.coordinates && gym.coordinates.lat && gym.coordinates.lng)
      .map(gym => ({
        ...gym,
        distance: calculateDistance(
          userLoc.lat,
          userLoc.lng,
          gym.coordinates.lat,
          gym.coordinates.lng
        )
      }))
      .filter(gym => gym.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  };

  // Handle sorting
  const handleSort = (sortOption) => {
    setSortBy(sortOption);
    let sorted = [...filteredGyms];
    
    switch (sortOption) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'capacity':
        sorted.sort((a, b) => b.capacity - a.capacity);
        break;
      case 'location':
        sorted.sort((a, b) => a.location.localeCompare(b.location));
        break;
      case 'status':
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
      case 'distance':
        if (userLocation) {
          sorted = findNearestGyms(userLocation, sorted, 1000); // Large radius to include all
        }
        break;
      default:
        break;
    }
    
    setFilteredGyms(sorted);
  };

  // Handle filtering
  const handleFilter = (filterOption) => {
    setFilterBy(filterOption);
    let filtered = gyms;

    if (filterOption !== 'all') {
      if (filterOption === 'nearby' && userLocation) {
        filtered = findNearestGyms(userLocation, gyms, 50).slice(0, 10); // Show top 10 nearest
      } else if (filterOption === 'with-coordinates') {
        filtered = gyms.filter(gym => gym.coordinates && gym.coordinates.lat && gym.coordinates.lng);
      } else if (filterOption === 'without-coordinates') {
        filtered = gyms.filter(gym => !gym.coordinates || !gym.coordinates.lat || !gym.coordinates.lng);
      } else if (filterOption === 'mappable') {
        // Gyms that can be mapped (have coordinates OR address info)
        filtered = gyms.filter(gym => 
          (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) ||
          gym.address || gym.location || gym.city
        );
      } else {
        filtered = gyms.filter(gym => gym.status === filterOption);
      }
    }

    // Apply search if exists
    if (searchTerm) {
      filtered = filtered.filter(gym => 
        gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gym.location && gym.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (gym.city && gym.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredGyms(filtered);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    let filtered = gyms;

    // Apply filter if exists
    if (filterBy !== 'all') {
      if (filterBy === 'nearby' && userLocation) {
        filtered = findNearestGyms(userLocation, gyms, 50).slice(0, 10);
      } else if (filterBy === 'with-coordinates') {
        filtered = gyms.filter(gym => gym.coordinates && gym.coordinates.lat && gym.coordinates.lng);
      } else if (filterBy === 'without-coordinates') {
        filtered = gyms.filter(gym => !gym.coordinates || !gym.coordinates.lat || !gym.coordinates.lng);
      } else if (filterBy === 'mappable') {
        filtered = gyms.filter(gym => 
          (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) ||
          gym.address || gym.location || gym.city
        );
      } else {
        filtered = gyms.filter(gym => gym.status === filterBy);
      }
    }

    // Apply search
    if (term) {
      filtered = filtered.filter(gym => 
        gym.name.toLowerCase().includes(term.toLowerCase()) ||
        (gym.location && gym.location.toLowerCase().includes(term.toLowerCase())) ||
        (gym.city && gym.city.toLowerCase().includes(term.toLowerCase()))
      );
    }

    setFilteredGyms(filtered);
  };

  const handleUpdateStatus = () => {
    console.log('Updating status for all gyms...');
  };

  // Handle showing gym on map
  const handleShowGymOnMap = (gym) => {
    setSelectedGymId(gym.id);
    setShowMap(true);
    setViewMode('map');
  };

  // Toggle view modes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode !== 'map') {
      setShowMap(false);
      setSelectedGymId(null);
    } else {
      setShowMap(true);
    }
  };

  // Count gyms that can be mapped
  const getMappableCount = () => {
    return gyms.filter(gym => 
      (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) ||
      gym.address || gym.location || gym.city
    ).length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Gyms</h1>
          <p className="text-gray-600 mt-1">
            Manage your gym locations and assignments
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Gym Button */}
          {onAddGym && (
            <button 
              onClick={onAddGym}
              className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus size={20} />
              <span>Add Gym</span>
            </button>
          )}
          
          {/* Update Status Button */}
          <button 
            onClick={handleUpdateStatus}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search gyms..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Filter */}
          <select 
            value={filterBy}
            onChange={(e) => handleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Gyms</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed">Closed</option>
            <option value="mappable">Mappable</option>
            <option value="with-coordinates">With Coordinates</option>
            <option value="without-coordinates">Without Coordinates</option>
            {userLocation && <option value="nearby">Nearby</option>}
          </select>

          {/* Sort */}
          <select 
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sort By</option>
            <option value="name">Name</option>
            <option value="capacity">Capacity</option>
            <option value="location">Location</option>
            <option value="status">Status</option>
            {userLocation && <option value="distance">Distance</option>}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Grid View"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="List View"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => handleViewModeChange('map')}
            className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Map View"
          >
            <Map size={20} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Gyms</h3>
          <p className="text-2xl font-bold text-gray-900">{gyms.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active</h3>
          <p className="text-2xl font-bold text-green-600">
            {gyms.filter(g => g.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Mappable</h3>
          <p className="text-2xl font-bold text-blue-600">
            {getMappableCount()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Capacity</h3>
          <p className="text-2xl font-bold text-purple-600">
            {gyms.reduce((sum, gym) => sum + (gym.capacity || 0), 0)}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Content based on view mode */}
      {!isLoading && (
        <>
          {viewMode === 'map' ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Gym Locations</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{getMappableCount()} mappable locations</span>
                </div>
              </div>
              <GymMap 
                gyms={filteredGyms}
                selectedGymId={selectedGymId}
                onGymSelect={(gym) => setSelectedGymId(gym.id)}
                height="500px"
                organizationId={organizationId}
              />
            </div>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
            }`}>
              {filteredGyms.length > 0 ? (
                filteredGyms.map((gym) => (
                  <GymCard 
                    key={gym.id} 
                    gym={gym} 
                    onAssignCoach={onAssignCoach}
                    onEdit={onEditGym}
                    onView={onViewGym}
                    onShowMap={handleShowGymOnMap}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500">
                    <Grid size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No gyms found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Map Modal */}
      {showMap && viewMode !== 'map' && (
        <GymMap 
          gyms={selectedGymId ? [filteredGyms.find(g => g.id === selectedGymId)] : filteredGyms}
          selectedGymId={selectedGymId}
          onGymSelect={(gym) => setSelectedGymId(gym.id)}
          isModal={true}
          onClose={() => {
            setShowMap(false);
            setSelectedGymId(null);
          }}
        />
      )}

      {/* Pagination - if needed */}
      {filteredGyms.length > 12 && viewMode !== 'map' && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-gray-600">
            Showing 1-{Math.min(12, filteredGyms.length)} of {filteredGyms.length} gyms
          </p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGyms;