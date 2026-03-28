import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LocationEngine from '../engine/LocationEngine';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

        // Sync to Firestore for Admin Live Tracking
        try {
          await setDoc(doc(db, 'driverLocations', currentUser.uid), {
            driverId: currentUser.uid,
            role,
            latitude: update.latitude,
            longitude: update.longitude,
            heading: update.heading || 0,
            speed: update.speed || 0,
            batteryLevel: update.batteryLevel || 100,
            isOnline: true,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error('Location Sync Error:', error);
        }
      });

      return () => {
        LocationEngine.stop();
        // Set offline in Firestore when unmounting or stopping
        if (currentUser) {
          setDoc(doc(db, 'driverLocations', currentUser.uid), {
            isOnline: false,
            lastUpdated: serverTimestamp()
          }, { merge: true }).catch(err => console.error('Offline set failed', err));
        }
        setIsTracking(false);
      };
    }
  }, [currentUser, role, isApproved]);

  return (
    <LocationContext.Provider value={{ currentLocation, isTracking, role }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
