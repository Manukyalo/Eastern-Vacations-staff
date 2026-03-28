import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db, storage } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = userCredential.user;

      // Step 5: Upload face image to Firebase Storage
      const storageRef = ref(storage, `driverFaces/${user.uid}/face.jpg`);
      await uploadBytes(storageRef, imageBlob);
      const faceImageUrl = await getDownloadURL(storageRef);

      // Step 6a: Link to Admin-created Personnel record (Firestore)
      if (formData.driverId) {
        await updateDoc(doc(db, 'drivers', formData.driverId), {
          uid: user.uid,
          status: 'Active',
          faceDescriptor: descriptor,
          registeredAt: serverTimestamp()
        });
      }

      // Step 6b: Create fast-lookup auth record (Firestore)
      await setDoc(doc(db, 'driverAuth', user.uid), {
        email: user.email,
        faceDescriptor: descriptor,
        faceImageUrl: faceImageUrl,
        role: 'safari_driver',
        approved: false, // Default to false until admin confirms
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        driverDocId: formData.driverId,
        loginAttempts: 0,
        lockedUntil: null
      });

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
      // Step 8: Navigate to pending approval page
      navigate('/safari/pending');
    } catch (error) {
      console.error("Registration error:", error);
      
      // CRITICAL: Cleanup if anything fails after Auth account created
      if (user) {
        try {
          await deleteUser(user);
          console.log("Cleaned up stalled Safari Auth account");
        } catch (deleteError) {
          console.error("Failed to cleanup stalled account:", deleteError);
        }
      }
      
      toast.error(error.message || "Failed to finalize registration", { id: toastId });
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
