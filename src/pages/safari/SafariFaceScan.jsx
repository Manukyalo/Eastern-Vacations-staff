import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
    
    try {
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Link to Admin-created Personnel record
      if (formData.driverId) {
        await updateDoc(doc(db, 'drivers', formData.driverId), {
          uid: user.uid,
          status: 'Active',
          faceDescriptor: descriptor,
          registeredAt: serverTimestamp()
        });
      }

      // 3. Create fast-lookup auth record
      await setDoc(doc(db, 'driverAuth', user.uid), {
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob,
        role: 'safari_driver',
        approved: false, // Default to false until admin confirms
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        driverDocId: formData.driverId
      });

      toast.success("Registration successful!", { id: toastId });
      navigate('/safari/pending');
    } catch (error) {
      console.error("Registration error:", error);
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
