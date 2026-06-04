import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface Booking {
  id: string;
  clientName: string;
  packageName: string;
  destinations: string;
  date: string;
  timeOfPickup: string;
  status: string;
  type?: string;
  [key: string]: any;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  [key: string]: any;
}

interface Porter {
  id: string;
  name: string;
  status: string;
  totalTrips?: number;
  [key: string]: any;
}

interface DriverContextType {
  activeBookings: Booking[];
  messages: Message[];
  porters: Porter[];
  stats: { tripsThisMonth: number; rating: number };
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const DriverProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, role } = useAuth();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [porters, setPorters] = useState<Porter[]>([]);
  const [stats] = useState({ tripsThisMonth: 0, rating: 5.0 });

  useEffect(() => {
    if (!currentUser) return;

    // Listen for assigned bookings based on role
    const field = role === 'porter' ? 'porterId' : 'driverId';
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where(field, '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setActiveBookings(bookings);
    }, (err) => {
      console.log('[DriverContext] Bookings subscribe error:', err);
    });

    // Listen for messages
    const messagesQuery = query(
      collection(db, `driverMessages/${currentUser.uid}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    }, (err) => {
      console.log('[DriverContext] Messages subscribe error:', err);
    });

    // Listen for porters if city driver
    let unsubPorters = () => {};
    if (role === 'driver') {
      const portersQuery = query(
        collection(db, 'porters'),
        where('driverId', '==', currentUser.uid)
      );
      unsubPorters = onSnapshot(portersQuery, (snapshot) => {
        const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Porter));
        setPorters(p);
      }, (err) => {
        console.log('[DriverContext] Porters subscribe error:', err);
      });
    }

    return () => {
      unsubBookings();
      unsubMessages();
      unsubPorters();
    };
  }, [currentUser, role]);

  const value = {
    activeBookings,
    messages,
    porters,
    stats,
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};
