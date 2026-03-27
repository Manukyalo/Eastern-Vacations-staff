import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db, storage } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    
    try {
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Upload Face Image to Storage
      const faceRef = ref(storage, `driverFaces/${formData.email}/registration.jpg`);
      await uploadBytes(faceRef, imageBlob);
      const faceImageUrl = await getDownloadURL(faceRef);

      // 3. Create driverAuth document
      await setDoc(doc(db, 'driverAuth', user.uid), {
        faceDescriptor: descriptor,
        faceImageUrl: faceImageUrl,
        role: 'driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        fcmToken: null,
        loginAttempts: 0
      });

      toast.success("Registration submitted!", { id: toastId });
      navigate('/driver/pending');
    } catch (error) {
      console.error("Registration error:", error);
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
