import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Loader } from 'lucide-react';

const GymMap = ({ 
  gyms = [], 
  selectedGymId = null, 
  onGymSelect, 
  height = '400px',
  organizationId = null,
  isModal = false,
  onClose = null 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Load Leaflet CSS and JS (Free OpenStreetMap)
  useEffect(() => {
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

      // Load JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError('Failed to load map');
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !map && window.L) {
      const defaultCenter = [11.1271, 78.6569]; // Tamil Nadu, India
      
      const mapInstance = window.L.map(mapRef.current).setView(defaultCenter, 8);
      
      // Add OpenStreetMap tiles (Free)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);

      setMap(mapInstance);
    }
  }, [isLoaded, map]);

  // Create address string from gym data
  const createAddress = (gym) => {
    const addressParts = [
      gym.address,
      gym.location,
      gym.city,
      gym.state,
      'India'
    ].filter(Boolean);
    
    return addressParts.join(', ');
  };

  // Geocode gym using free Nominatim API
  const geocodeGym = async (gym) => {
    try {
      const address = createAddress(gym);
      
      if (!address || address.trim() === '' || address === 'India') {
        console.log(`Gym ${gym.name} has no address information`);
        return null;
      }

      console.log(`Geocoding ${gym.name}: ${address}`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          ...gym,
          coordinates: {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          },
          formattedAddress: data[0].display_name
        };
      }
      
      console.log(`No results found for ${gym.name}`);
      return null;
    } catch (error) {
      console.error(`Geocoding failed for ${gym.name}:`, error);
      return null;
    }
  };

  // Get marker color based on gym status
  const getMarkerColor = (status) => {
    switch (status) {
      case 'active': return '#10B981'; // Green
      case 'maintenance': return '#F59E0B'; // Yellow
      case 'closed': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  // Create custom marker icon
  const createCustomIcon = (gym) => {
    const color = getMarkerColor(gym.status);
    
    return window.L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Create markers for gyms
  useEffect(() => {
    if (map && gyms.length > 0) {
      const processGyms = async () => {
        setIsGeocoding(true);
        setGeocodingProgress({ current: 0, total: gyms.length });
        
        // Clear existing markers
        markers.forEach(marker => {
          map.removeLayer(marker);
        });

        const newMarkers = [];
        const bounds = window.L.latLngBounds();
        let hasValidMarkers = false;

        for (let i = 0; i < gyms.length; i++) {
          const gym = gyms[i];
          setGeocodingProgress({ current: i + 1, total: gyms.length });

          // Check if gym already has coordinates
          if (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) {
            const position = [
              parseFloat(gym.coordinates.lat),
              parseFloat(gym.coordinates.lng)
            ];

            // Create marker
            const marker = window.L.marker(position, { 
              icon: createCustomIcon(gym) 
            }).addTo(map);

            // Create popup content
            const popupContent = `
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${gym.name}</h3>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                  <p style="margin: 2px 0;"><strong>📍 Location:</strong> ${gym.location || 'N/A'}</p>
                  <p style="margin: 2px 0;"><strong>🏢 City:</strong> ${gym.city || 'N/A'}</p>
                  <p style="margin: 2px 0;"><strong>👥 Capacity:</strong> ${gym.capacity || 'N/A'}</p>
                  <p style="margin: 2px 0;"><strong>🕒 Hours:</strong> ${gym.openingTime || 'N/A'} - ${gym.closingTime || 'N/A'}</p>
                </div>
                <div style="margin-top: 8px;">
                  <span style="
                    background: ${getMarkerColor(gym.status)}; 
                    color: white; 
                    padding: 3px 8px; 
                    border-radius: 12px; 
                    font-size: 10px;
                    font-weight: bold;
                  ">
                    ${gym.status ? gym.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent);

            // Handle marker click
            marker.on('click', () => {
              if (onGymSelect) {
                onGymSelect(gym);
              }
            });

            // Auto-open popup for selected gym
            if (selectedGymId && gym.id === selectedGymId) {
              setTimeout(() => marker.openPopup(), 500);
            }

            newMarkers.push(marker);
            bounds.extend(position);
            hasValidMarkers = true;
          } else {
            // Try to geocode the gym
            const geocodedGym = await geocodeGym(gym);
            
            if (geocodedGym && geocodedGym.coordinates) {
              const position = [
                geocodedGym.coordinates.lat,
                geocodedGym.coordinates.lng
              ];

              // Create marker
              const marker = window.L.marker(position, { 
                icon: createCustomIcon(geocodedGym) 
              }).addTo(map);

              // Create popup content
              const popupContent = `
                <div style="min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${gym.name}</h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <p style="margin: 2px 0;"><strong>📍 Address:</strong> ${geocodedGym.formattedAddress}</p>
                    <p style="margin: 2px 0;"><strong>👥 Capacity:</strong> ${gym.capacity || 'N/A'}</p>
                    <p style="margin: 2px 0;"><strong>🕒 Hours:</strong> ${gym.openingTime || 'N/A'} - ${gym.closingTime || 'N/A'}</p>
                  </div>
                  <div style="margin-top: 8px;">
                    <span style="
                      background: ${getMarkerColor(gym.status)}; 
                      color: white; 
                      padding: 3px 8px; 
                      border-radius: 12px; 
                      font-size: 10px;
                      font-weight: bold;
                    ">
                      ${gym.status ? gym.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent);

              // Handle marker click
              marker.on('click', () => {
                if (onGymSelect) {
                  onGymSelect(gym);
                }
              });

              // Auto-open popup for selected gym
              if (selectedGymId && gym.id === selectedGymId) {
                setTimeout(() => marker.openPopup(), 500);
              }

              newMarkers.push(marker);
              bounds.extend(position);
              hasValidMarkers = true;
            }

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Add user location marker if available
        if (userLocation) {
          const userMarker = window.L.marker([userLocation.lat, userLocation.lng], {
            icon: window.L.divIcon({
              className: 'user-location-icon',
              html: `
                <div style="
                  background-color: #3B82F6;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(map);

          userMarker.bindPopup('<strong>📍 Your Location</strong>');
          newMarkers.push(userMarker);
          bounds.extend([userLocation.lat, userLocation.lng]);
          hasValidMarkers = true;
        }

        setMarkers(newMarkers);
        setIsGeocoding(false);

        // Fit map to show all markers
        if (hasValidMarkers) {
          map.fitBounds(bounds.pad(0.1));
          
          // Set minimum zoom level
          if (map.getZoom() > 15) {
            map.setZoom(15);
          }
        }
      };

      processGyms();
    }
  }, [map, gyms, selectedGymId, userLocation]);

  const centerOnUser = () => {
    if (userLocation && map) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const mapContent = (
    <div className="relative">
      {/* Map Container */}
      <div ref={mapRef} style={{ height }} className="w-full rounded-lg" />
      
      {/* Geocoding Progress */}
      {isGeocoding && (
        <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2">
            <Loader size={16} className="animate-spin text-blue-600" />
            <span className="text-sm font-medium">
              Mapping gyms... {geocodingProgress.current}/{geocodingProgress.total}
            </span>
          </div>
          <div className="mt-2 w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2 z-[1000]">
        {/* User Location */}
        {userLocation && (
          <button
            onClick={centerOnUser}
            className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors"
            title="Center on your location"
          >
            <Navigation size={16} className="text-blue-600" />
          </button>
        )}

        {/* Close button for modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors"
            title="Close map"
          >
            <X size={16} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Gym Count */}
      <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg px-3 py-2 z-[1000]">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin size={16} className="text-gray-600" />
          <span className="font-medium">{gyms.length} Gyms</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 z-[1000]">
        <div className="text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Closed</span>
          </div>
          {userLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>You</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If modal, wrap in modal container
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl h-96 max-h-[80vh] overflow-hidden">
          <div className="h-full">
            {mapContent}
          </div>
        </div>
      </div>
    );
  }

  return mapContent;
};

export default GymMap;