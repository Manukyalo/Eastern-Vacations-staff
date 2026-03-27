import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    const toastId = toast.loading("Encrypting biometric data...");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save face as Base64 in Firestore to avoid Storage costs
      await setDoc(doc(db, 'driverAuth', user.uid), {
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob, // Base64 from FaceEngine
        role: 'safari_driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        fcmToken: null,
        loginAttempts: 0
      });

      toast.success("Expedition ID Setup Complete", { id: toastId });
      navigate('/safari/pending');
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-12 text-center mt-12">
        <h2 className="text-2xl font-heading font-black text-white px-8">
          EXPEDITION <span className="text-accent-green uppercase tracking-tight">Biometric ID</span>
        </h2>
        <div className="w-12 h-1 bg-accent-green/30 mx-auto mt-4 rounded-full" />
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />
    </div>
  );
};

export default SafariFaceScan;
