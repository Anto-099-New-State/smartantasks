// organizationService.js (Updated for Subcollections)
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc
} from 'firebase/firestore';

// You need to import your existing Firebase config
// Replace this with your actual Firebase config import
import { db } from '../api/firebase'; // Adjust path as needed

// Get user's organization by email
export const getUserOrganization = async (email) => {
  try {
    console.log('Searching for organization with email:', email);
    
    // Query organizations collection where email matches
    const orgQuery = query(
      collection(db, 'organizations'), 
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(orgQuery);
    
    if (querySnapshot.empty) {
      console.log('No organization found for email:', email);
      return null;
    }
    
    // Get the first organization document
    const orgDoc = querySnapshot.docs[0];
    const orgData = {
      id: orgDoc.id,
      ...orgDoc.data()
    };
    
    console.log('Found organization:', orgData);
    return orgData;
    
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

// Get gyms subcollection for a specific organization
export const getOrganizationGyms = async (organizationId) => {
  try {
    console.log('Searching for gyms in organization subcollection:', organizationId);
    
    // Reference to the gyms subcollection inside the organization document
    const gymsCollectionRef = collection(db, 'organizations', organizationId, 'gyms');
    
    // Get all documents from the gyms subcollection
    const querySnapshot = await getDocs(gymsCollectionRef);
    const gyms = [];
    
    querySnapshot.forEach((doc) => {
      gyms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${gyms.length} gyms in organization ${organizationId} subcollection`);
    return gyms;
    
  } catch (error) {
    console.error('Error fetching gyms from subcollection:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

// Get coaches subcollection for a specific organization
export const getOrganizationCoaches = async (organizationId) => {
  try {
    console.log('Searching for coaches in organization subcollection:', organizationId);
    
    // Reference to the coaches subcollection inside the organization document
    const coachesCollectionRef = collection(db, 'organizations', organizationId, 'coaches');
    
    // Get all documents from the coaches subcollection
    const querySnapshot = await getDocs(coachesCollectionRef);
    const coaches = [];
    
    querySnapshot.forEach((doc) => {
      coaches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${coaches.length} coaches in organization ${organizationId} subcollection`);
    return coaches;
    
  } catch (error) {
    console.error('Error fetching coaches from subcollection:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

// Get users subcollection for a specific organization
export const getOrganizationUsers = async (organizationId) => {
  try {
    console.log('Searching for users in organization subcollection:', organizationId);
    
    // Reference to the users subcollection inside the organization document
    const usersCollectionRef = collection(db, 'organizations', organizationId, 'users');
    
    // Get all documents from the users subcollection
    const querySnapshot = await getDocs(usersCollectionRef);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${users.length} users in organization ${organizationId} subcollection`);
    return users;
    
  } catch (error) {
    console.error('Error fetching users from subcollection:', error);
    return [];
  }
};

// Get trainers subcollection for a specific organization
export const getOrganizationTrainers = async (organizationId) => {
  try {
    console.log('Searching for trainers in organization subcollection:', organizationId);
    
    // Reference to the trainers subcollection inside the organization document
    const trainersCollectionRef = collection(db, 'organizations', organizationId, 'trainers');
    
    // Get all documents from the trainers subcollection
    const querySnapshot = await getDocs(trainersCollectionRef);
    const trainers = [];
    
    querySnapshot.forEach((doc) => {
      trainers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${trainers.length} trainers in organization ${organizationId} subcollection`);
    return trainers;
    
  } catch (error) {
    console.error('Error fetching trainers from subcollection:', error);
    return [];
  }
};

// Alternative: Get gyms with query inside subcollection (if you need filtering)
export const getOrganizationGymsWithFilter = async (organizationId, filters = {}) => {
  try {
    console.log('Searching for gyms with filters in organization subcollection:', organizationId);
    
    // Reference to the gyms subcollection
    const gymsCollectionRef = collection(db, 'organizations', organizationId, 'gyms');
    
    let gymsQuery = gymsCollectionRef;
    
    // Apply filters if provided
    if (filters.status) {
      gymsQuery = query(gymsCollectionRef, where('status', '==', filters.status));
    }
    
    if (filters.location) {
      gymsQuery = query(gymsQuery, where('location', '==', filters.location));
    }
    
    const querySnapshot = await getDocs(gymsQuery);
    const gyms = [];
    
    querySnapshot.forEach((doc) => {
      gyms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${gyms.length} filtered gyms in organization ${organizationId}`);
    return gyms;
    
  } catch (error) {
    console.error('Error fetching filtered gyms from subcollection:', error);
    return [];
  }
};

// Get complete organization data with subcollections
export const getCompleteOrganizationData = async (email) => {
  try {
    console.log('Getting complete organization data for:', email);
    
    // First get the organization
    const organization = await getUserOrganization(email);
    
    if (!organization) {
      throw new Error('User not found in any organization');
    }
    
    console.log('Organization found, fetching subcollections...');
    
    // Then fetch all related data from subcollections in parallel
    const [gyms, coaches, users, trainers] = await Promise.all([
      getOrganizationGyms(organization.id),
      getOrganizationCoaches(organization.id),
      getOrganizationUsers(organization.id),
      getOrganizationTrainers(organization.id)
    ]);
    
    const result = {
      organization,
      gyms,
      coaches,
      users,
      trainers
    };
    
    console.log('Complete organization data with subcollections:', result);
    return result;
    
  } catch (error) {
    console.error('Error fetching complete organization data:', error);
    throw error;
  }
};