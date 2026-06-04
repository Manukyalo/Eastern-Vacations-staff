import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import tw from '@/utils/tailwind';

interface AuthContextType {
  currentUser: User | null;
  driverProfile: any;
  driverAuth: any;
  role: string | null;
  isApproved: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [driverAuth, setDriverAuth] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    // Safety timeout — if Firebase hangs > 4s, unmask the app anyway
    const safetyTimer = setTimeout(() => {
      setAuthChecked(true);
    }, 4000);

    let unsubscribeAuthSnap: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer);
      setCurrentUser(user);

      // Clean up previous listeners
      if (unsubscribeAuthSnap) {
        unsubscribeAuthSnap();
        unsubscribeAuthSnap = null;
      }
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        const authRef = doc(db, 'driverAuth', user.uid);

        unsubscribeAuthSnap = onSnapshot(authRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDriverAuth(data);
            setRole(data.role);
            setIsApproved(data.approved);

            // Dynamically listen to the correct profile collection based on role
            const profileCol = data.role === 'porter' ? 'porters' : 'drivers';
            
            if (unsubscribeProfile) {
              unsubscribeProfile();
            }
            unsubscribeProfile = onSnapshot(doc(db, profileCol, user.uid), (profSnap) => {
              if (profSnap.exists()) {
                setDriverProfile(profSnap.data());
              }
            });
          }
          setAuthChecked(true);
        }, (error) => {
          console.error('[AuthContext] Firestore auth snap error:', error);
          setAuthChecked(true);
        });
      } else {
        setDriverProfile(null);
        setDriverAuth(null);
        setRole(null);
        setIsApproved(false);
        setAuthChecked(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAuthSnap) unsubscribeAuthSnap();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(safetyTimer);
    };
  }, []);

  const logout = async () => {
    try {
      if (currentUser) {
        try {
          // Attempt location update sync before signing out
          await Promise.race([
            setDoc(doc(db, 'driverLocations', currentUser.uid), {
              isOnline: false,
              lastUpdated: serverTimestamp()
            }, { merge: true }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ]);
        } catch (e) {
          console.log('[AuthContext] Offline sync timeout/error', e);
        }
      }

      await signOut(auth);

      setDriverProfile(null);
      setDriverAuth(null);
      setRole(null);
      setIsApproved(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('[AuthContext] Logout failed', error);
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

  if (!authChecked) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark`}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
