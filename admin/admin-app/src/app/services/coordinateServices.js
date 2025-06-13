// coordinatesService.js
import { 
  doc, 
  updateDoc, 
  collection, 
  getDocs,
  setDoc 
} from 'firebase/firestore';
import { db } from '../api/firebase'; // Adjust path as needed

// Add coordinates to a gym document
export const addGymCoordinates = async (organizationId, gymId, coordinates) => {
  try {
    const gymRef = doc(db, 'organizations', organizationId, 'gyms', gymId);
    
    await updateDoc(gymRef, {
      coordinates: {
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng)
      },
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Coordinates added to gym ${gymId}`);
    return true;
  } catch (error) {
    console.error('Error adding coordinates to gym:', error);
    throw error;
  }
};

// Geocode address to get coordinates using Google Maps API
export const geocodeAddress = async (address) => {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

// Update gym with coordinates based on address
export const updateGymWithCoordinates = async (organizationId, gymId, address) => {
  try {
    console.log(`Geocoding address for gym ${gymId}: ${address}`);
    
    const coordinates = await geocodeAddress(address);
    await addGymCoordinates(organizationId, gymId, coordinates);
    
    console.log(`Successfully updated gym ${gymId} with coordinates:`, coordinates);
    return coordinates;
  } catch (error) {
    console.error('Error updating gym with coordinates:', error);
    throw error;
  }
};

// Batch update all gyms in organization with coordinates
export const batchUpdateGymsWithCoordinates = async (organizationId, gyms) => {
  try {
    console.log(`Batch updating ${gyms.length} gyms with coordinates...`);
    
    const updatePromises = gyms.map(async (gym) => {
      try {
        // Skip if gym already has coordinates
        if (gym.coordinates && gym.coordinates.lat && gym.coordinates.lng) {
          console.log(`Gym ${gym.id} already has coordinates, skipping...`);
          return { gymId: gym.id, status: 'skipped', reason: 'already has coordinates' };
        }

        // Create address string from gym data
        const addressParts = [
          gym.address,
          gym.location,
          gym.city,
          gym.state,
          gym.country
        ].filter(Boolean);
        
        if (addressParts.length === 0) {
          console.log(`Gym ${gym.id} has no address information, skipping...`);
          return { gymId: gym.id, status: 'skipped', reason: 'no address information' };
        }

        const address = addressParts.join(', ');
        const coordinates = await updateGymWithCoordinates(organizationId, gym.id, address);
        
        return { 
          gymId: gym.id, 
          status: 'success', 
          coordinates,
          address 
        };
      } catch (error) {
        console.error(`Failed to update gym ${gym.id}:`, error);
        return { 
          gymId: gym.id, 
          status: 'error', 
          error: error.message 
        };
      }
    });

    const results = await Promise.all(updatePromises);
    
    const summary = {
      total: gyms.length,
      successful: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'error').length,
      details: results
    };

    console.log('Batch update summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

// Get current location using browser geolocation
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('User denied the request for Geolocation'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('The request to get user location timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Find nearest gyms to a given location
export const findNearestGyms = (userLocation, gyms, maxDistance = 50) => {
  const gymsWithDistance = gyms
    .filter(gym => gym.coordinates && gym.coordinates.lat && gym.coordinates.lng)
    .map(gym => ({
      ...gym,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        gym.coordinates.lat,
        gym.coordinates.lng
      )
    }))
    .filter(gym => gym.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  return gymsWithDistance;
};