import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react-native';
import { auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, deleteUser, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import tw from '@/utils/tailwind';

export default function SafariFaceScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRegistering, setIsRegistering] = useState(false);
  const [verifyState, setVerifyState] = useState<'ready' | 'capturing' | 'success' | 'failed'>('ready');
  const cameraRef = useRef<CameraView>(null);

  // Safely extract params
  const { fullName, email, phone, password, driverId, isNewDriver } = params;

  useEffect(() => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Missing registration info. Returning to register.');
      router.replace('/safari/register');
    }
  }, [email, password, fullName]);

  const handleCapture = async () => {
    if (!cameraRef.current || isRegistering) return;

    setVerifyState('capturing');
    setIsRegistering(true);

    let createdUser: FirebaseUser | null = null;

    try {
      // Simulate photo capture delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const cleanEmail = (email as string).trim().toLowerCase();

      // Step 1: Create Firebase Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password as string);
      createdUser = userCredential.user;

      // Simulated face descriptor (Float32Array equivalent)
      const mockDescriptor = Array.from({ length: 128 }, () => Math.random() * 0.2 - 0.1);

      // Step 2: Build registration payload
      const registrationPayload = {
        uid: createdUser.uid,
        name: fullName as string,
        email: cleanEmail,
        personalEmail: cleanEmail,
        phone: (phone as string) || '',
        status: 'Pending',
        faceDescriptor: mockDescriptor,
        faceImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256', // Mock face scan image
        role: 'safari_driver',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        loginAttempts: 0,
        lockedUntil: null,
        type: 'Safari Guide',
        driverDocId: createdUser.uid,
      };

      // Step 3: Migrate pre-existing record to the new uid-based document
      let oldDriverData = {};
      if (driverId && driverId !== createdUser.uid) {
        const oldDriverRef = doc(db, 'drivers', driverId as string);
        const oldDriverSnap = await getDoc(oldDriverRef);
        if (oldDriverSnap.exists()) {
          oldDriverData = oldDriverSnap.data();
        }

        // Delete the stale doc
        await deleteDoc(oldDriverRef);

        // Re-point bookings referencing the old document ID
        const bookingsRef = collection(db, 'bookings');
        const qBookings = query(bookingsRef, where('driverId', '==', driverId));
        const bookingsSnap = await getDocs(qBookings);
        if (!bookingsSnap.empty) {
          const batch = writeBatch(db);
          bookingsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { driverId: createdUser!.uid });
          });
          await batch.commit();
        }
      }

      // Merge old data underneath the new payload so nothing is lost
      const mergedPayload = { ...oldDriverData, ...registrationPayload };

      // Step 4: Write driver record keyed by uid
      await setDoc(doc(db, 'drivers', createdUser.uid), mergedPayload);

      // Step 5: Write to approval queue
      await setDoc(doc(db, 'driverAuth', createdUser.uid), registrationPayload);

      // Step 6: Admin notification
      await addDoc(collection(db, 'notifications'), {
        title: 'New Safari Registration — Approval Required',
        message: `${fullName} (safari) has completed biometric setup and awaits approval.`,
        type: 'WARNING',
        targetRole: 'admin',
        date: serverTimestamp(),
        read: false,
      });

      setVerifyState('success');
      
      // Redirect to pending approval after showing success checkmark
      setTimeout(() => {
        setIsRegistering(false);
        router.replace('/safari/pending');
      }, 1500);

    } catch (error: any) {
      console.error('[SafariFaceScan] Registration Critical Failure:', error);
      setVerifyState('failed');
      setIsRegistering(false);

      // Roll back Auth account on any failure
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (deleteError) {
          console.error('[SafariFaceScan] Failed to delete user on rollback:', deleteError);
        }
      }

      let friendlyMessage = 'Failed to finalize registration. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists.';
      } else if (error.code === 'permission-denied') {
        friendlyMessage = 'Access Denied: Contact admin to ensure your personnel record is set up.';
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      Alert.alert('Registration Failed', friendlyMessage, [
        { text: 'Try Again', onPress: () => setVerifyState('ready') }
      ]);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark px-6 gap-6`}>
        <View style={tw`w-16 h-16 bg-accent-green/10 rounded-3xl justify-center items-center`}>
          <Camera size={32} color="#2D6A4F" />
        </View>
        <View style={tw`items-center gap-2`}>
          <Text style={tw`text-white font-bold text-lg uppercase tracking-tight text-center`}>Camera Access Required</Text>
          <Text style={tw`text-text-muted text-sm text-center leading-relaxed`}>
            Biometric enrollment requires front camera access to capture your security profile image.
          </Text>
        </View>
        <TouchableOpacity
          onPress={requestPermission}
          style={tw`bg-accent-green px-8 py-4 rounded-xl active:scale-95`}
        >
          <Text style={tw`text-white font-bold uppercase tracking-widest text-sm`}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <View style={tw`flex-grow justify-center px-6 py-8`}>
        
        {/* Header */}
        <View style={tw`items-center mb-6`}>
          <Text style={tw`text-xl font-bold text-white mb-1 uppercase tracking-widest`}>
            Expedition <Text style={tw`text-accent-green`}>Identity</Text>
          </Text>
          <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>
            Step 2 of 3 — Biometric ID Setup
          </Text>
        </View>

        {/* Camera Viewfinder */}
        <View style={tw`relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 mb-6`}>
          {verifyState !== 'success' && verifyState !== 'failed' && (
            <CameraView
              ref={cameraRef}
              style={tw`flex-1`}
              facing="front"
            >
              {/* Oval guide overlay */}
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <View style={[
                  tw`border-2 rounded-full`,
                  {
                    width: '65%',
                    aspectRatio: 3 / 4,
                    borderColor: verifyState === 'capturing' ? '#2D6A4F' : 'rgba(255,255,255,0.3)',
                    borderStyle: 'dashed',
                  }
                ]} />
              </View>
            </CameraView>
          )}

          {verifyState === 'success' && (
            <View style={tw`flex-1 bg-success/10 items-center justify-center`}>
              <View style={tw`w-20 h-20 bg-success rounded-full items-center justify-center`}>
                <CheckCircle2 size={40} color="#fff" />
              </View>
            </View>
          )}

          {verifyState === 'failed' && (
            <View style={tw`flex-1 bg-danger-red/10 items-center justify-center`}>
              <View style={tw`w-20 h-20 bg-danger-red rounded-full items-center justify-center`}>
                <XCircle size={40} color="#fff" />
              </View>
            </View>
          )}
        </View>

        {/* Status Box */}
        <View style={tw`bg-surface border border-border rounded-3xl px-6 py-5 items-center gap-2 mb-6`}>
          {verifyState === 'ready' && (
            <Text style={tw`text-accent-green font-bold uppercase tracking-widest text-xs`}>
              Position face in frame to enroll
            </Text>
          )}
          {verifyState === 'capturing' && (
            <View style={tw`flex-row items-center gap-3`}>
              <ActivityIndicator size="small" color="#2D6A4F" />
              <Text style={tw`text-accent-green font-bold uppercase tracking-widest text-xs`}>Enrolling Identity...</Text>
            </View>
          )}
          {verifyState === 'success' && (
            <Text style={tw`text-success font-bold uppercase tracking-widest text-xs`}>✓ Enrollment Complete</Text>
          )}
        </View>

        {/* Action Button */}
        {verifyState === 'ready' && (
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={tw`w-1/3 border border-border py-4 rounded-xl items-center justify-center active:scale-95`}
            >
              <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCapture}
              style={tw`flex-1 bg-accent-green py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
            >
              <Camera size={16} color="#FFFFFF" />
              <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Capture & Register</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={tw`text-center text-text-muted text-[10px] uppercase tracking-wider mt-6 px-4`}>
          Authorized personnel only. Biometric data is used strictly for identity verification and park access logging.
        </Text>

      </View>
    </SafeAreaView>
  );
}
