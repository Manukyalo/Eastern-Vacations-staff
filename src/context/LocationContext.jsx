import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LocationEngine from '../engine/LocationEngine';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { currentUser, role, isApproved } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // track for all approved personnel roles
    const shouldTrack = ['safari_driver', 'driver', 'porter', 'tour_guide'].includes(role);
    if (shouldTrack && isApproved && currentUser) {
      LocationEngine.start(currentUser.uid, 'active', async (update) => {
        setCurrentLocation(update);
        setIsTracking(true);
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
