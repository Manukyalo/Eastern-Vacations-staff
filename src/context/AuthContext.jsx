/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverAuth, setDriverAuth] = useState(null);
  const [role, setRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  // authChecked: set true after the very FIRST onAuthStateChanged fires — used solely for the cold-start splash guard
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Safety timeout — if Firebase hangs > 4s, unmask the app anyway
    const safetyTimer = setTimeout(() => {
      setAuthChecked(true);
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer);
      setCurrentUser(user);

      if (user) {
        const profileRef = doc(db, 'drivers', user.uid);
        const authRef = doc(db, 'driverAuth', user.uid);

        onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) setDriverProfile(docSnap.data());
        });

        onSnapshot(authRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDriverAuth(data);
            setRole(data.role);
            setIsApproved(data.approved);
          }
          // Mark auth resolved after first Firestore response (hit or miss)
          setAuthChecked(true);
        });
      } else {
        // Logged out — clear all profile state immediately
        setDriverProfile(null);
        setDriverAuth(null);
        setRole(null);
        setIsApproved(false);
        setAuthChecked(true);
      }
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(safetyTimer);
    };
  }, []);

  const logout = async () => {
    try {
      if (currentUser) {
        try {
          await Promise.race([
            setDoc(doc(db, 'driverLocations', currentUser.uid), {
              isOnline: false,
              lastUpdated: serverTimestamp()
            }, { merge: true }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ]);
        } catch (e) {
          console.log('Offline sync timeout', e);
        }
      }

      await signOut(auth);

      setDriverProfile(null);
      setDriverAuth(null);
      setRole(null);
      setIsApproved(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const value = {
    currentUser,
    driverProfile,
    driverAuth,
    role,
    isApproved,
    isLoading: !authChecked,
    logout
  };

  // Only block the UI for the very first cold-start auth resolution
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-primary-dark">
        <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
