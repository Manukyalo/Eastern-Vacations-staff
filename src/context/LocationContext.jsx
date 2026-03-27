/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import LocationEngine from '../engine/LocationEngine';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { currentUser, role, isApproved } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Only track if safari driver and approved
    if (role === 'safari_driver' && isApproved && currentUser) {
      LocationEngine.start(currentUser.uid, 'active', async (update) => {
        setCurrentLocation(update);
        setIsTracking(true); // Call inside callback
        
        // Push to Firestore
        try {
          const locRef = doc(db, 'driverLocations', currentUser.uid);
          await updateDoc(locRef, {
            ...update,
            lastUpdated: serverTimestamp()
          });
        } catch (error) {
          console.error('Failed to update location in Firestore', error);
        }
      });
    }

    return () => {
      LocationEngine.stop();
      setIsTracking(false);
    };
  }, [role, isApproved, currentUser]);

  const value = {
    currentLocation,
    isTracking
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
