import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = userCredential.user;

      // Step 6: Create Registration Payload
      const registrationPayload = {
        uid: user.uid,
        email: user.email,
        personalEmail: user.email,
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob, // Base64 Data URL (free on Spark Plan)
        role: 'driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        fcmToken: null,
        loginAttempts: 0,
        lockedUntil: null,

        // Personal details for Admin visibility
        name: formData.fullName,
        phone: formData.phone,
        driverDocId: formData.driverId
      };

      // 6a. Update primary personnel record (if exists) or create new one using UID as ID
      const driverRef = formData.driverId ? doc(db, 'drivers', formData.driverId) : doc(db, 'drivers', user.uid);
      await setDoc(driverRef, registrationPayload, { merge: true });

      // 6b. Create request in approval queue for headquarters
      await setDoc(doc(db, 'driverAuth', user.uid), registrationPayload);

      // Step 7: Write to notifications collection
      await addDoc(collection(db, 'notifications'), {
        title: 'New Driver Registration — Approval Required',
        message: `${formData.fullName} (driver) has completed face registration and awaits approval.`,
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
        <p className="text-text-muted text-xs mt-2">STEP 2 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        By continuing, you agree to biometric authentication for secure logging. Your data is encrypted and stored securely.
      </div>
    </div>
  );
};

export default DriverFaceScan;
