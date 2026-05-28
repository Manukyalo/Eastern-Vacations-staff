import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const DriverFaceScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = location.state || {};

  if (!formData) {
    navigate('/driver/register');
    return null;
  }

  const handleCapture = async ({ descriptor, imageBlob }) => {
    const toastId = toast.loading("Finalizing registration...");
    let user = null;
    
    try {
      // Step 4: Create Firebase Auth account FIRST
      const cleanEmail = formData.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      user = userCredential.user;

      // Step 6: Create Registration Payload
      const registrationPayload = {
        uid: user.uid,
        email: cleanEmail,
        personalEmail: cleanEmail,
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob, // Base64 Data URL (free on Spark Plan)
        role: formData.role || 'driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        fcmToken: null,
        loginAttempts: 0,
        lockedUntil: null,

        // Personal details for Admin visibility
        name: formData.fullName,
        phone: formData.phone || '',
        driverDocId: user.uid
      };

      // 6a. Perform migration if pre-existing record exists under a different ID
      if (formData.role === 'porter') {
        let oldPorterData = {};
        if (formData.driverId && formData.driverId !== user.uid) {
          const oldPorterRef = doc(db, 'porters', formData.driverId);
          const oldPorterSnap = await getDoc(oldPorterRef);
          if (oldPorterSnap.exists()) {
            oldPorterData = oldPorterSnap.data();
          }
          await deleteDoc(oldPorterRef);

          // Update bookings
          const bookingsRef = collection(db, 'bookings');
          const qBookings = query(bookingsRef, where('porterId', '==', formData.driverId));
          const bookingsSnap = await getDocs(qBookings);
          const batch = writeBatch(db);
          bookingsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { porterId: user.uid });
          });
          await batch.commit();
        }

        const porterPayload = {
          ...oldPorterData,
          id: user.uid,
          uid: user.uid,
          name: formData.fullName,
          email: cleanEmail,
          phone: formData.phone || '',
          status: oldPorterData.status || 'Active',
          totalTrips: oldPorterData.totalTrips || 0,
          registeredAt: oldPorterData.registeredAt || serverTimestamp()
        };

        await setDoc(doc(db, 'porters', user.uid), porterPayload);
        await setDoc(doc(db, 'drivers', user.uid), registrationPayload);
      } else {
        // Driver or Tour Guide
        let oldDriverData = {};
        if (formData.driverId && formData.driverId !== user.uid) {
          const oldDriverRef = doc(db, 'drivers', formData.driverId);
          const oldDriverSnap = await getDoc(oldDriverRef);
          if (oldDriverSnap.exists()) {
            oldDriverData = oldDriverSnap.data();
          }
          await deleteDoc(oldDriverRef);

          // Update bookings
          const bookingsRef = collection(db, 'bookings');
          const qBookings = query(bookingsRef, where('driverId', '==', formData.driverId));
          const bookingsSnap = await getDocs(qBookings);
          const batch = writeBatch(db);
          bookingsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { driverId: user.uid });
          });
          await batch.commit();

          // Update porters
          const portersRef = collection(db, 'porters');
          const qPorters = query(portersRef, where('driverId', '==', formData.driverId));
          const portersSnap = await getDocs(qPorters);
          const porterBatch = writeBatch(db);
          portersSnap.forEach((docSnap) => {
            porterBatch.update(docSnap.ref, { driverId: user.uid });
          });
          await porterBatch.commit();
        }

        const mergedPayload = {
          ...oldDriverData,
          ...registrationPayload
        };

        await setDoc(doc(db, 'drivers', user.uid), mergedPayload);
      }

      // 6b. Create request in approval queue for headquarters
      await setDoc(doc(db, 'driverAuth', user.uid), registrationPayload);

      // Step 7: Write to notifications collection
      await addDoc(collection(db, 'notifications'), {
        title: `New Personnel Registration (${formData.role}) — Approval Required`,
        message: `${formData.fullName} (${formData.role}) has completed face registration and awaits approval.`,
        type: 'WARNING',
        targetRole: 'admin',
        date: serverTimestamp(),
        read: false
      });

      toast.success("Registration submitted!", { id: toastId });
      navigate('/driver/pending');
    } catch (error) {
      console.error("Registration error:", error);
      
      if (user) {
        try {
          await deleteUser(user);
          console.log("Cleaned up failed Auth account");
        } catch (deleteError) {
          console.error("Failed to delete user on rollback:", deleteError);
        }
      }
      
      toast.error(error.message || "Failed to finalize registration", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-8 text-center mt-8">
        <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
          Face <span className="text-accent-gold">Verification</span>
        </h2>
        <p className="text-text-muted text-xs mt-2 uppercase tracking-widest font-black">STEP 3 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        By continuing, you agree to biometric authentication for secure logging. Your data is encrypted and stored securely.
      </div>
    </div>
  );
};

export default DriverFaceScan;
