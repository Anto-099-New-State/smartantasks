import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where, 
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../api/firebase';

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
  
  // ✅ NEW: Load existing layouts for selected organization/gym
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  
  // UI states
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ NEW: Fetch saved layouts from Firestore
  const fetchSavedLayouts = async (organizationId, gymId = null) => {
    if (!organizationId) {
      setSavedLayouts([]);
      return;
    }

    setIsLoadingLayouts(true);
    try {
      const basePath = gymId 
        ? `organizations/${organizationId}/gyms/${gymId}/layouts`
        : `organizations/${organizationId}/layouts`;
      
      const layoutsRef = collection(db, basePath);
      const q = query(layoutsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const layoutsData = [];
      querySnapshot.forEach((doc) => {
        layoutsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setSavedLayouts(layoutsData);
      console.log('Saved layouts loaded:', layoutsData);
      
    } catch (error) {
      console.error('Error fetching saved layouts:', error);
      setSavedLayouts([]);
    } finally {
      setIsLoadingLayouts(false);
    }
  };

  // ✅ NEW: Load custom layouts when organization/gym changes
  useEffect(() => {
    if (selectedOrganization) {
      fetchCustomLayouts(selectedOrganization.id, selectedGym?.id || null);
    } else {
      setCustomLayouts([]);
    }
  }, [selectedOrganization, selectedGym]);

  // ✅ NEW: Load hotspots from a saved layout
  const loadSavedLayout = (savedLayout) => {
    if (savedLayout.hotspots && savedLayout.hotspots.length > 0) {
      // Find the matching layout
      const layout = layouts.find(l => l.id === savedLayout.layoutId);
      if (layout) {
        setSelectedLayout(layout);
        setHotspots(savedLayout.hotspots);
        console.log('Loaded saved layout:', savedLayout);
      }
    }
  };

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

  // ✅ FIXED: Fetch gyms from subcollection for selected organization
  const fetchGyms = async (organizationId) => {
    if (!organizationId) {
      setGyms([]);
      return;
    }

    setIsLoadingGyms(true);
    try {
      // ✅ Query the subcollection instead of separate collection
      const gymsRef = collection(db, 'organizations', organizationId, 'gyms');
      const q = query(gymsRef, orderBy('name'));
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
      console.error('Error fetching gyms from subcollection:', error);
      setGyms([]);
    } finally {
      setIsLoadingGyms(false);
    }
  };

  // ✅ ENHANCED: Fetch devices with proper gym and organization mapping
  const fetchDevices = async (organizationId, gymId = null) => {
    if (!organizationId) {
      setDevices([]);
      return;
    }

    setIsLoadingDevices(true);
    try {
      let devicesData = [];
      
      if (gymId) {
        // ✅ Fetch devices specifically assigned to this gym
        console.log(`Fetching devices for gym: ${gymId} in organization: ${organizationId}`);
        
        const gymDevicesQuery = query(
          collection(db, 'devices'),
          where('organizationId', '==', organizationId),
          where('gymId', '==', gymId),
          where('deviceType', '==', 'camera')
        );
        
        const gymSnapshot = await getDocs(gymDevicesQuery);
        gymSnapshot.forEach((doc) => {
          const deviceData = { id: doc.id, ...doc.data() };
          devicesData.push(deviceData);
        });
        
        console.log(`Found ${devicesData.length} devices assigned to gym ${gymId}`);
        
      } else {
        // ✅ Fetch devices at organization level (no specific gym assignment)
        console.log(`Fetching organization-level devices for: ${organizationId}`);
        
        // Query for devices that belong to organization but have no gym assignment
        const orgDevicesQuery = query(
          collection(db, 'devices'),
          where('organizationId', '==', organizationId),
          where('deviceType', '==', 'camera')
        );
        
        const orgSnapshot = await getDocs(orgDevicesQuery);
        orgSnapshot.forEach((doc) => {
          const deviceData = { id: doc.id, ...doc.data() };
          
          // ✅ Only include devices that don't have a gymId (organization-level devices)
          if (!deviceData.gymId || deviceData.gymId === null || deviceData.gymId === '') {
            devicesData.push(deviceData);
          }
        });
        
        console.log(`Found ${devicesData.length} organization-level devices`);
      }
      
      // ✅ Sort devices by name for consistent display
      devicesData.sort((a, b) => {
        const nameA = a.deviceName || '';
        const nameB = b.deviceName || '';
        return nameA.localeCompare(nameB);
      });
      
      setDevices(devicesData);
      console.log('Final devices loaded:', devicesData);
      
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

  // ✅ FIXED: Fetch gyms when organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      fetchGyms(selectedOrganization.id);
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

  // ✅ ENHANCED: Get available cameras with better filtering and status info
  const getAvailableCameras = () => {
    return devices.filter(device => {
      // Only show cameras that are available for placement
      const isAvailable = device.status === 'Inventory' || 
                         device.status === 'Assigned' || 
                         device.status === 'Active';
      
      // ✅ Additional check: make sure device matches current selection context
      const matchesContext = selectedGym 
        ? device.gymId === selectedGym.id 
        : (!device.gymId || device.gymId === null);
      
      return isAvailable && matchesContext;
    });
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

  // ✅ ENHANCED: Handle camera selection for hotspot with better data structure
  const handleCameraSelect = (camera) => {
    if (pendingHotspot) {
      const newHotspot = {
        id: Date.now(),
        x: pendingHotspot.x,
        y: pendingHotspot.y,
        camera: camera,
        // ✅ Store proper IDs and names
        organizationId: selectedOrganization.id,
        organizationName: selectedOrganization.name,
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        layoutId: selectedLayout.id,
        layoutName: selectedLayout.name,
        // ✅ Additional metadata for better tracking
        createdAt: new Date().toISOString(),
        cameraId: camera.id,
        cameraName: camera.deviceName
      };
      
      setHotspots([...hotspots, newHotspot]);
      setShowCameraSelector(false);
      setPendingHotspot(null);
      setSearchTerm('');
      
      console.log('Camera placed:', newHotspot);
    }
  };

  // Remove hotspot
  const removeHotspot = (hotspotId) => {
    setHotspots(hotspots.filter(h => h.id !== hotspotId));
    setActiveHotspot(null);
  };

  // ✅ IMPLEMENTED: Save hotspots to Firestore
  const saveHotspotsToFirestore = async () => {
    if (!selectedOrganization || !selectedLayout || hotspots.length === 0) {
      console.warn('Cannot save: Missing organization, layout, or no hotspots');
      alert('Cannot save: Please select organization, layout, and place at least one camera');
      return;
    }

    try {
      console.log('Saving hotspots to Firestore:', hotspots);
      
      // ✅ Save to different paths based on selection context
      const basePath = selectedGym 
        ? `organizations/${selectedOrganization.id}/gyms/${selectedGym.id}/layouts`
        : `organizations/${selectedOrganization.id}/layouts`;
      
      // ✅ Create layout document with metadata and hotspots
      const layoutData = {
        layoutId: selectedLayout.id,
        layoutName: selectedLayout.name,
        organizationId: selectedOrganization.id,
        organizationName: selectedOrganization.name,
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        totalCameras: hotspots.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hotspots: hotspots.map(hotspot => ({
          id: hotspot.id,
          x: hotspot.x,
          y: hotspot.y,
          cameraId: hotspot.cameraId,
          cameraName: hotspot.cameraName,
          camera: {
            id: hotspot.camera.id,
            deviceName: hotspot.camera.deviceName,
            serial: hotspot.camera.serial,
            modelNo: hotspot.camera.modelNo,
            ipAddress: hotspot.camera.ipAddress,
            status: hotspot.camera.status
          },
          createdAt: hotspot.createdAt
        }))
      };
      
      // ✅ Save layout to Firestore
      const layoutRef = collection(db, basePath);
      const layoutDocRef = await addDoc(layoutRef, layoutData);
      
      console.log('Layout saved successfully with ID:', layoutDocRef.id);
      alert(`Layout saved successfully! ${hotspots.length} cameras placed in ${selectedLayout.name}`);
      
      // ✅ Optional: Clear hotspots after successful save
      // setHotspots([]);
      
    } catch (error) {
      console.error('Error saving layout to Firestore:', error);
      alert('Error saving layout. Please try again.');
    }
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
                <span className="ml-2 text-sm text-gray-600">Loading gyms from subcollection...</span>
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
                
                {/* Individual Gyms from Subcollection */}
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
                      {gym.address && (
                        <div className="text-xs text-gray-400">
                          📍 {gym.address}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span>⚠️</span>
                      No gym locations found in subcollection
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Gyms should be stored under: organizations/{selectedOrganization.id}/gyms
                    </div>
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
            <>
              {/* Upload Layout Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📤</span>
                  Upload Custom Layout
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {/* Predefined Layouts */}
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Predefined Layouts
                </div>
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

                {/* Custom Layouts */}
                {customLayouts.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 mt-4 flex items-center gap-2">
                      Custom Layouts ({customLayouts.length})
                      {isLoadingCustomLayouts && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    {customLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className={`relative border rounded transition-colors ${
                          selectedLayout?.id === layout.id
                            ? 'bg-green-100 border-green-300'
                            : 'border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedLayout({
                            ...layout,
                            image: layout.imageURL
                          })}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium">🖼️ {layout.name}</div>
                          <div className="text-sm text-gray-500">
                            {layout.description || 'Custom layout'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(layout.fileSize / 1024 / 1024).toFixed(1)}MB • 
                            Created: {new Date(layout.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomLayout(layout);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center"
                          title="Delete layout"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Loading State for Custom Layouts */}
                {isLoadingCustomLayouts && customLayouts.length === 0 && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading custom layouts...</span>
                  </div>
                )}
              </div>
            </>
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
            {selectedGym ? (
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                📍 Showing cameras assigned to {selectedGym.name}
              </span>
            ) : (
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                📍 Showing organization-level cameras (no gym assignment)
              </span>
            )}
            {isLoadingDevices && (
              <span className="ml-2">
                <span className="animate-spin inline-block">⟳</span> Loading cameras...
              </span>
            )}
          </div>
          
          {/* ✅ NEW: Save button and saved layouts display */}
          {hotspots.length > 0 && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveHotspotsToFirestore}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                💾 Save Layout ({hotspots.length} cameras)
              </button>
              <button
                onClick={() => setHotspots([])}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          )}
          
          {/* ✅ NEW: Show saved layouts */}
          {savedLayouts.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-800 mb-2">
                📁 Saved Layouts ({savedLayouts.length})
              </h5>
              <div className="space-y-1">
                {savedLayouts.slice(0, 3).map((savedLayout) => (
                  <button
                    key={savedLayout.id}
                    onClick={() => loadSavedLayout(savedLayout)}
                    className="w-full text-left p-2 text-xs bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                  >
                    <div className="font-medium">
                      📐 {savedLayout.layoutName} ({savedLayout.totalCameras} cameras)
                    </div>
                    <div className="text-green-600">
                      Saved: {new Date(savedLayout.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {savedLayouts.length > 3 && (
                  <div className="text-xs text-green-600">
                    + {savedLayouts.length - 3} more saved layouts
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* Layout Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Custom Layout</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({
                    name: '',
                    description: '',
                    file: null,
                    filePreview: null
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={isUploading}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Context Info */}
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Uploading to:</strong> {selectedOrganization?.name}
                  {selectedGym && ` → ${selectedGym.name}`}
                </div>
              </div>

              {/* Layout Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Name *
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ground Floor Plan, Warehouse Layout"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUploading}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the layout..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={isUploading}
                  maxLength={500}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Image *
                </label>
                
                {!uploadForm.filePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <div className="text-sm text-gray-600 mb-3">
                      Click to select an image file
                    </div>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                      id="layout-upload"
                    />
                    
                    <label
                      htmlFor="layout-upload"
                      className={`inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Select Image
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={uploadForm.filePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-gray-50">
                      <div className="text-sm font-medium">{uploadForm.file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(uploadForm.file.size / 1024 / 1024).toFixed(1)}MB • {uploadForm.file.type}
                      </div>
                      <button
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null, filePreview: null }))}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                        disabled={isUploading}
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* File Requirements */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Requirements:</strong><br />
                • Supported formats: JPEG, PNG, GIF, WebP<br />
                • Max file size: 10MB<br />
                • Recommended: High resolution floor plans or blueprints
              </div>

              {/* Upload Button */}
              <button
                onClick={handleLayoutUpload}
                disabled={isUploading || !uploadForm.file || !uploadForm.name.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading to Firebase...
                  </div>
                ) : (
                  'Upload Layout'
                )}
              </button>
            </div>
          </div>
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
                        Org: {camera.organization || 'Unassigned'}
                        {camera.gymId ? ` | Gym: ${camera.gym || 'Unknown Gym'}` : ' | Gym: Organization Level'}
                      </div>
                      <div className="text-xs text-green-600">
                        Device ID: {camera.id}
                      </div>
                      <div className="text-xs text-purple-600">
                        Org ID: {camera.organizationId} | Gym ID: {camera.gymId || 'None'}
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
                      {selectedGym 
                        ? `Make sure cameras are assigned to gym "${selectedGym.name}" with gymId: ${selectedGym.id}`
                        : `Make sure cameras are assigned to organization "${selectedOrganization?.name}" with organizationId: ${selectedOrganization?.id} and no gymId`
                      }
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
            <div><strong>Org ID:</strong> {activeHotspot.organizationId}</div>
            {activeHotspot.gymId && (
              <div><strong>Gym ID:</strong> {activeHotspot.gymId}</div>
            )}
            <div><strong>Placed:</strong> {new Date(activeHotspot.createdAt).toLocaleString()}</div>
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
            <div>Gyms loaded (from subcollection): {gyms.length}</div>
            <div>Devices loaded: {devices.length}</div>
            <div>Available cameras: {filteredCameras.length}</div>
            <div>Selected Org ID: {selectedOrganization?.id || 'None'}</div>
            <div>Selected Gym ID: {selectedGym?.id || 'None'}</div>
            <div>Selected Layout: {selectedLayout?.name || 'None'}</div>
            <div>Hotspots placed: {hotspots.length}</div>
            <div>Firebase Structure: organizations/{selectedOrganization?.id || 'orgId'}/gyms/{selectedGym?.id || 'gymId'}</div>
            
            {/* Show gym structure info */}
            {selectedOrganization && (
              <div className="mt-2 p-2 bg-blue-50 rounded border">
                <div className="font-medium text-blue-800">Subcollection Query:</div>
                <div className="text-blue-600">
                  collection(db, 'organizations', '{selectedOrganization.id}', 'gyms')
                </div>
                {gyms.length > 0 && (
                  <div className="mt-1">
                    <div className="text-blue-800">Gyms found:</div>
                    {gyms.map(gym => (
                      <div key={gym.id} className="text-blue-600">
                        • {gym.name} (ID: {gym.id})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Show device mapping info */}
            {selectedOrganization && (
              <div className="mt-2 p-2 bg-green-50 rounded border">
                <div className="font-medium text-green-800">Device Mapping Logic:</div>
                <div className="text-green-600">
                  Looking for devices with organizationId: {selectedOrganization.id}
                </div>
                {selectedGym ? (
                  <div className="text-green-600">
                    AND gymId: {selectedGym.id} (specific gym assignment)
                  </div>
                ) : (
                  <div className="text-green-600">
                    AND gymId: null/empty (organization-level devices)
                  </div>
                )}
                <div className="text-green-600">
                  AND deviceType: "camera"
                </div>
                
                {devices.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-green-800">Devices Found:</div>
                    {devices.slice(0, 3).map(device => (
                      <div key={device.id} className="text-xs text-green-600">
                        • {device.deviceName} (orgId: {device.organizationId}, gymId: {device.gymId || 'null'})
                      </div>
                    ))}
                    {devices.length > 3 && (
                      <div className="text-xs text-green-600">
                        ... and {devices.length - 3} more devices
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Layouts;