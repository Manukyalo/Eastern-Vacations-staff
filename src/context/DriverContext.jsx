/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const { currentUser, role } = useAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [porters, setPorters] = useState([]);
  const [stats, setStats] = useState({ tripsThisMonth: 0, rating: 5.0 });

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
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveBookings(bookings);
    });

    // Listen for messages
    const messagesQuery = query(
      collection(db, `driverMessages/${currentUser.uid}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    // Listen for porters if city driver
    let unsubPorters = () => {};
    if (role === 'driver') {
      const portersQuery = query(
        collection(db, 'porters'),
        where('driverId', '==', currentUser.uid)
      );
      unsubPorters = onSnapshot(portersQuery, (snapshot) => {
        const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPorters(p);
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
    stats
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => useContext(DriverContext);
