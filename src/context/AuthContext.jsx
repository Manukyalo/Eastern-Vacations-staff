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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initialization started');
    // Safety timeout to prevent permanent black screen if Firebase hangs
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('AuthContext: Loading timed out. Forcing UI mount.');
        setIsLoading(false);
      }
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('AuthContext: onAuthStateChanged fired', user?.uid);
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
          setIsLoading(false);
        });
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
      // 1. Explicitly set offline in Firestore before signing out
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

      // 2. Clear Auth State
      await signOut(auth);
      
      // 3. Clear Local State
      setDriverProfile(null);
      setDriverAuth(null);
      setRole(null);
      setIsApproved(false);
      setCurrentUser(null);
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
