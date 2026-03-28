import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LocationEngine from '../engine/LocationEngine';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { currentUser, role, isApproved } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // track for both roles if approved
    const isDriver = role === 'safari_driver' || role === 'driver';
    if (isDriver && isApproved && currentUser) {
      LocationEngine.start(currentUser.uid, 'active', async (update) => {
        setCurrentLocation(update);
        setIsTracking(true); // Call inside callback
      });
      return () => LocationEngine.stop();
    }
  }, [currentUser, role, isApproved]);

  return (
    <LocationContext.Provider value={{ currentLocation, isTracking, role }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
