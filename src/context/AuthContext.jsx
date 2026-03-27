/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverAuth, setDriverAuth] = useState(null);
  const [role, setRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Start onSnapshot listeners for profile and auth
        const profileRef = doc(db, 'drivers', user.uid);
        const authRef = doc(db, 'driverAuth', user.uid);

        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setDriverProfile(docSnap.data());
          }
        });

        const unsubAuth = onSnapshot(authRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDriverAuth(data);
            setRole(data.role);
            setIsApproved(data.approved);
          }
        });

        setIsLoading(false);

        return () => {
          unsubProfile();
          unsubAuth();
        };
      } else {
        setDriverProfile(null);
        setDriverAuth(null);
        setRole(null);
        setIsApproved(false);
        setIsLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    driverProfile,
    driverAuth,
    role,
    isApproved,
    isLoading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
