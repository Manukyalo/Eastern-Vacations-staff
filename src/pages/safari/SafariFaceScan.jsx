import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const SafariFaceScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = location.state || {};

  if (!formData) {
    navigate('/safari/register');
    return null;
  }

  const handleCapture = async ({ descriptor, imageBlob }) => {
    const toastId = toast.loading("Finalizing Secure Expedition ID...");
    let user = null;

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      // Step 1: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      user = userCredential.user;

      // Step 2: Build registration payload
      const registrationPayload = {
        uid: user.uid,
        name: formData.fullName,
        email: cleanEmail,
        personalEmail: cleanEmail,
        phone: formData.phone || '',
        status: 'Pending',
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob, // Base64 Data URL (free on Spark Plan)
        role: 'safari_driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        loginAttempts: 0,
        lockedUntil: null,
        type: 'Safari Guide',
        driverDocId: user.uid,
      };

      // Step 3: Migrate pre-existing record to the new uid-based document
      let oldDriverData = {};
      if (formData.driverId && formData.driverId !== user.uid) {
        const oldDriverRef = doc(db, 'drivers', formData.driverId);
        const oldDriverSnap = await getDoc(oldDriverRef);
        if (oldDriverSnap.exists()) {
          oldDriverData = oldDriverSnap.data();
        }

        // Delete the stale doc
        await deleteDoc(oldDriverRef);

        // Re-point bookings that reference the old document ID
        const bookingsRef = collection(db, 'bookings');
        const qBookings = query(bookingsRef, where('driverId', '==', formData.driverId));
        const bookingsSnap = await getDocs(qBookings);
        if (!bookingsSnap.empty) {
          const batch = writeBatch(db);
          bookingsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { driverId: user.uid });
          });
          await batch.commit();
        }
      }

      // Merge old data underneath the new payload so nothing is lost
      const mergedPayload = { ...oldDriverData, ...registrationPayload };

      // Step 4: Write driver record keyed by uid
      await setDoc(doc(db, 'drivers', user.uid), mergedPayload);

      // Step 5: Write to approval queue
      await setDoc(doc(db, 'driverAuth', user.uid), registrationPayload);

      // Step 6: Admin notification
      await addDoc(collection(db, 'notifications'), {
        title: 'New Safari Registration — Approval Required',
        message: `${formData.fullName} (safari) has completed biometric setup and awaits approval.`,
        type: 'WARNING',
        targetRole: 'admin',
        date: serverTimestamp(),
        read: false
      });

      toast.success("Registration successful!", { id: toastId });
      navigate('/safari/pending');

    } catch (error) {
      console.error("🔴 Registration Critical Failure:", error.code, error.message);

      // Roll back Auth account on any failure
      if (user) {
        try {
          await deleteUser(user);
        } catch (deleteError) {
          console.error("Failed to delete user on rollback:", deleteError);
        }
      }

      let friendlyMessage = "Failed to finalize registration. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "An account with this email already exists. Please log in instead.";
      } else if (error.code === 'permission-denied') {
        friendlyMessage = "Access Denied: Contact admin to ensure your personnel record is set up.";
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      toast.error(friendlyMessage, { id: toastId, duration: 6000 });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-8 text-center mt-8">
        <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
          Expedition <span className="text-accent-green">Identity</span>
        </h2>
        <p className="text-text-muted text-xs mt-2 uppercase tracking-widest font-black">STEP 2 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        Authorized personnel only. Biometric data is used strictly for identity verification and park access logging.
      </div>
    </div>
  );
};

export default SafariFaceScan;
