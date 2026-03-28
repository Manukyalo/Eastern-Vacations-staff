import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      // Step 4: Create Firebase Auth account FIRST
      const cleanEmail = formData.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      user = userCredential.user;

      // Step 6: Create/Link Driver Records
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
        type: 'Safari Guide'
      };

      // 6a. Update primary personnel record (if exists) or create new one using UID as ID
      const driverRef = formData.driverId ? doc(db, 'drivers', formData.driverId) : doc(db, 'drivers', user.uid);
      await setDoc(driverRef, registrationPayload, { merge: true });

      // 6b. Create request in approval queue for headquarters
      await setDoc(doc(db, 'driverAuth', user.uid), registrationPayload);

      // Step 7: Write to notifications collection
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
      console.error("🔴 Registration Critical Failure:", error);
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      
      if (user) {
        try {
          await deleteUser(user);
          console.log("Cleaned up failed Safari Auth account");
        } catch (deleteError) {
          console.error("Failed to delete user on rollback:", deleteError);
        }
      }
      
      const friendlyMessage = error.code === 'permission-denied' 
        ? "Access Denied: Please contact admin to verify your personnel record exists and has matching email."
        : error.message || "Failed to finalize registration";

      toast.error(friendlyMessage, { id: toastId, duration: 6000 });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-8 text-center mt-8">
        <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
          Expedition <span className="text-accent-green">Identity</span>
        </h2>
        <p className="text-text-muted text-xs mt-2">STEP 2 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        Authorized personnel only. Biometric data is used strictly for identity verification and park access logging.
      </div>
    </div>
  );
};

export default SafariFaceScan;
