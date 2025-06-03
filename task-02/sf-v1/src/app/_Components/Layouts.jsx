import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../api/firebase';

function Layouts() {
  // Selection states
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  
  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [devices, setDevices] = useState([]);
  
  // Loading states
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  
  // Hotspot and camera states
  const [hotspots, setHotspots] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  
  // UI states
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Static layouts for now (can be made dynamic later)
  const [layouts] = useState([
    { id: 1, name: 'Main Floor', image: '/layouts/main-floor.jpg' },
    { id: 2, name: 'Upper Level', image: '/layouts/upper-level.jpg' },
    { id: 3, name: 'Basement', image: '/layouts/basement.jpg' },
    { id: 4, name: 'Outdoor Area', image: '/layouts/outdoor.jpg' }
  ]);

  // Fetch organizations from Firestore
  const fetchOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const q = query(collection(db, 'organizations'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const orgsData = [];
      
      querySnapshot.forEach((doc) => {
        orgsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setOrganizations(orgsData);
      console.log('Organizations loaded:', orgsData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Fetch gyms for selected organization
  const fetchGyms = async (organizationId) => {
    if (!organizationId) {
      setGyms([]);
      return;
    }

    setIsLoadingGyms(true);
    try {
      const q = query(
        collection(db, 'gyms'), 
        where('organizationId', '==', organizationId),
        orderBy('name'),
        console.log(db)
      );
      const querySnapshot = await getDocs(q);
      const gymsData = [];
      
      querySnapshot.forEach((doc) => {
        gymsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setGyms(gymsData);
      console.log('Gyms loaded for org:', organizationId, gymsData);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms([]);
    } finally {
      setIsLoadingGyms(false);
    }
  };

  // Fetch devices (cameras) for selected organization/gym
  const fetchDevices = async (organizationId, gymId = null) => {
    if (!organizationId) {
      setDevices([]);
      return;
    }

    setIsLoadingDevices(true);
    try {
      let q;
      
      if (gymId) {
        // Fetch devices for specific gym
        q = query(
          collection(db, 'devices'),
          where('organizationId', '==', organizationId),
          where('gymId', '==', gymId),
          where('deviceType', '==', 'camera'),
          orderBy('deviceName')
        );
      } else {
        // Fetch devices for organization level
        q = query(
          collection(db, 'devices'),
          where('organizationId', '==', organizationId),
          where('deviceType', '==', 'camera'),
          orderBy('deviceName')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const devicesData = [];
      
      querySnapshot.forEach((doc) => {
        devicesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setDevices(devicesData);
      console.log('Devices loaded:', devicesData);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setDevices([]);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch gyms when organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      fetchGyms(selectedOrganization.id);
      console.log(selectedOrganization.id);
    } else {
      setGyms([]);
    }
  }, [selectedOrganization]);

  // Fetch devices when organization or gym changes
  useEffect(() => {
    if (selectedOrganization) {
      fetchDevices(selectedOrganization.id, selectedGym?.id || null);
    } else {
      setDevices([]);
    }
  }, [selectedOrganization, selectedGym]);

  // Reset selections when organization changes
  useEffect(() => {
    setSelectedGym(null);
    setSelectedLayout(null);
    setHotspots([]);
  }, [selectedOrganization]);

  // Reset layout and hotspots when gym changes
  useEffect(() => {
    setSelectedLayout(null);
    setHotspots([]);
  }, [selectedGym]);

  // Reset hotspots when layout changes
  useEffect(() => {
    setHotspots([]);
  }, [selectedLayout]);

  // Get available cameras (filter by status)
  const getAvailableCameras = () => {
    return devices.filter(device => 
      device.status === 'Inventory' || 
      device.status === 'Assigned'
    );
  };

  // Filter cameras based on search term
  const getFilteredCameras = () => {
    const availableCameras = getAvailableCameras();
    
    if (!searchTerm) return availableCameras;
    
    return availableCameras.filter(camera =>
      camera.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera.modelNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle image click to place camera
  const handleImageClick = (e) => {
    if (!selectedLayout) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPendingHotspot({ x, y });
    setShowCameraSelector(true);
  };

  // Handle camera selection for hotspot
  const handleCameraSelect = (camera) => {
    if (pendingHotspot) {
      const newHotspot = {
        id: Date.now(),
        x: pendingHotspot.x,
        y: pendingHotspot.y,
        camera: camera,
        organizationId: selectedOrganization.id,
        organizationName: selectedOrganization.name,
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        layoutId: selectedLayout.id,
        layoutName: selectedLayout.name
      };
      
      setHotspots([...hotspots, newHotspot]);
      setShowCameraSelector(false);
      setPendingHotspot(null);
      setSearchTerm('');
    }
  };

  // Remove hotspot
  const removeHotspot = (hotspotId) => {
    setHotspots(hotspots.filter(h => h.id !== hotspotId));
    setActiveHotspot(null);
  };

  const filteredCameras = getFilteredCameras();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Camera Layout Management</h1>
        <p className="text-gray-600">Select organization, gym, and layout to place cameras</p>
        {(isLoadingOrgs || isLoadingGyms || isLoadingDevices) && (
          <div className="mt-2 text-sm text-blue-600">
            🔄 Loading data from Firestore...
          </div>
        )}
      </div>

      {/* Selection Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Step 1: Organization Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <h3 className="font-semibold text-lg">Select Organization</h3>
          </div>
          
          {isLoadingOrgs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading organizations...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrganization(org)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedOrganization?.id === org.id
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      ID: {org.id}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                  No organizations found in Firestore
                </div>
              )}
            </div>
          )}
          
          {!selectedOrganization && !isLoadingOrgs && (
            <div className="text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded">
              Select an organization to continue
            </div>
          )}
        </div>

        {/* Step 2: Gym Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedOrganization ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>2</span>
            <h3 className="font-semibold text-lg">Select Gym Location</h3>
          </div>
          
          {selectedOrganization ? (
            isLoadingGyms ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading gyms...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {/* Organization Level Option */}
                <button
                  onClick={() => setSelectedGym(null)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedGym === null && selectedOrganization
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">🏢 Organization Level</div>
                  <div className="text-sm text-gray-500">General organization layout</div>
                </button>
                
                {/* Individual Gyms */}
                {gyms.length > 0 ? (
                  gyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => setSelectedGym(gym)}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedGym?.id === gym.id
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium">🏋️ {gym.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {gym.id} | Org: {selectedOrganization.name}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                    No gym locations found for this organization
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
              Select an organization first
            </div>
          )}
        </div>

        {/* Step 3: Layout Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedOrganization ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>3</span>
            <h3 className="font-semibold text-lg">Select Layout</h3>
          </div>
          
          {selectedOrganization ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedLayout?.id === layout.id
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">📐 {layout.name}</div>
                  <div className="text-sm text-gray-500">Floor plan layout</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
              Select an organization first
            </div>
          )}
        </div>
      </div>

      {/* Current Selection Summary */}
      {selectedOrganization && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Current Selection:</h4>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="bg-blue-100 px-2 py-1 rounded">
              🏢 {selectedOrganization.name}
            </span>
            <span className="text-blue-600">→</span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {selectedGym ? `🏋️ ${selectedGym.name}` : '🏢 Organization Level'}
            </span>
            {selectedLayout && (
              <>
                <span className="text-blue-600">→</span>
                <span className="bg-blue-100 px-2 py-1 rounded">
                  📐 {selectedLayout.name}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-2 text-sm text-blue-700">
            Available cameras: {filteredCameras.length} | Placed cameras: {hotspots.length}
            {isLoadingDevices && (
              <span className="ml-2">
                <span className="animate-spin inline-block">⟳</span> Loading cameras...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Layout Display */}
      {selectedLayout ? (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {selectedLayout.name} - Camera Placement
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {hotspots.length} camera{hotspots.length !== 1 ? 's' : ''} placed
                </span>
                <button
                  onClick={() => setHotspots([])}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  disabled={hotspots.length === 0}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              Click on the layout to place cameras from your inventory
            </div>
          </div>
          
          {/* Layout Image with Hotspots */}
          <div className="relative">
            <img
              src="/floorImg.jpg" // Fallback image, replace with selectedLayout.image when available
              alt={selectedLayout.name}
              className="w-full h-96 object-cover cursor-crosshair"
              onClick={handleImageClick}
            />
            
            {/* Camera Hotspots */}
            {hotspots.map((spot) => (
              <div
                key={spot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(spot);
                }}
                className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full cursor-pointer hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
                style={{
                  top: `${spot.y}%`,
                  left: `${spot.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${spot.camera.deviceName} - ${spot.camera.modelNo || 'No model'}`}
              >
                <span className="text-white text-xs">📷</span>
              </div>
            ))}
            
            {/* Pending Hotspot Preview */}
            {pendingHotspot && (
              <div
                className="absolute w-6 h-6 bg-yellow-500 border-2 border-white rounded-full animate-pulse"
                style={{
                  top: `${pendingHotspot.y}%`,
                  left: `${pendingHotspot.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-white text-xs">?</span>
              </div>
            )}
          </div>
        </div>
      ) : selectedOrganization ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Layout</h3>
          <p className="text-gray-600">Choose a floor plan layout to start placing cameras</p>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600">Select an organization and gym to begin camera placement</p>
        </div>
      )}

      {/* Camera Selector Modal */}
      {showCameraSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Camera</h3>
              <button
                onClick={() => {
                  setShowCameraSelector(false);
                  setPendingHotspot(null);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Camera Selection Info */}
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Location:</strong> {selectedOrganization?.name}
                {selectedGym && ` → ${selectedGym.name}`}
              </div>
              <div className="text-sm text-blue-600">
                <strong>Layout:</strong> {selectedLayout?.name}
              </div>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search cameras by name, serial, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Loading State */}
            {isLoadingDevices && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading cameras...</span>
              </div>
            )}
            
            {/* Camera List */}
            {!isLoadingDevices && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredCameras.length > 0 ? (
                  filteredCameras.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => handleCameraSelect(camera)}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium">{camera.deviceName}</div>
                      <div className="text-sm text-gray-500">
                        Serial: {camera.serial} | Model: {camera.modelNo || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Status: {camera.status} | IP: {camera.ipAddress || 'Not set'}
                      </div>
                      <div className="text-xs text-blue-600">
                        ID: {camera.id}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">
                      {searchTerm ? 'No cameras match your search' : 'No cameras available for this location'}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Make sure cameras are assigned to this organization/gym
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Hotspot Details */}
      {activeHotspot && (
        <div className="fixed bottom-4 right-4 p-4 bg-white shadow-xl rounded-lg border w-80">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold">Camera Details</h3>
            <button
              onClick={() => setActiveHotspot(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div><strong>Device:</strong> {activeHotspot.camera.deviceName}</div>
            <div><strong>Serial:</strong> {activeHotspot.camera.serial}</div>
            <div><strong>Model:</strong> {activeHotspot.camera.modelNo || 'Not specified'}</div>
            <div><strong>Status:</strong> {activeHotspot.camera.status}</div>
            <div><strong>IP Address:</strong> {activeHotspot.camera.ipAddress || 'Not set'}</div>
            <div><strong>Organization:</strong> {activeHotspot.organizationName}</div>
            <div><strong>Location:</strong> {activeHotspot.gymName}</div>
            <div><strong>Layout:</strong> {activeHotspot.layoutName}</div>
            <div><strong>Position:</strong> {activeHotspot.x.toFixed(1)}%, {activeHotspot.y.toFixed(1)}%</div>
            <div><strong>Camera ID:</strong> {activeHotspot.camera.id}</div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              onClick={() => setActiveHotspot(null)}
            >
              Close
            </button>
            <button
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              onClick={() => removeHotspot(activeHotspot.id)}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Debug Info Panel (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Organizations loaded: {organizations.length}</div>
            <div>Gyms loaded: {gyms.length}</div>
            <div>Devices loaded: {devices.length}</div>
            <div>Available cameras: {filteredCameras.length}</div>
            <div>Selected Org ID: {selectedOrganization?.id || 'None'}</div>
            <div>Selected Gym ID: {selectedGym?.id || 'None'}</div>
            <div>Selected Layout: {selectedLayout?.name || 'None'}</div>
            <div>Hotspots placed: {hotspots.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layouts;
    