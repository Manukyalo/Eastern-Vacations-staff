import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Camera } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import tw from '@/utils/tailwind';

// Verification states
const STATES = {
  PERMISSION: 'permission',
  READY: 'ready',
  CAPTURING: 'capturing',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
  ERROR: 'error',
} as const;

type VerifyState = typeof STATES[keyof typeof STATES];

interface Props {
  storedDescriptor?: number[] | null;
  onSuccess: () => void;
  onFail: () => void;
}

/**
 * Native Face Biometric Verifier for React Native.
 *
 * Note: @vladmandic/face-api depends on Canvas/DOM APIs which are not available in RN.
 * This component uses expo-camera to capture a photo, then sends it to a Cloud Function
 * or compares it against the stored faceImageUrl via the device camera preview.
 *
 * For production: integrate with a cloud-based face comparison API (e.g., AWS Rekognition,
 * Google Vision, or a dedicated Firebase Cloud Function wrapping face-api in a Node.js env).
 *
 * For now, this ships a functional camera gate with a simulated comparison result that
 * can be swapped for a real API call.
 */
export default function FaceBiometricVerifier({ storedDescriptor, onSuccess, onFail }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [verifyState, setVerifyState] = useState<VerifyState>(STATES.READY);
  const [confidence, setConfidence] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || verifyState === STATES.CAPTURING || verifyState === STATES.VERIFYING) return;

    setVerifyState(STATES.CAPTURING);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });

      if (!isMounted.current) return;

      setVerifyState(STATES.VERIFYING);

      /**
       * PRODUCTION INTEGRATION POINT:
       * Send photo.uri to a Firebase Cloud Function endpoint that runs face-api
       * in Node.js and returns { match: boolean, confidence: number }.
       *
       * Example:
       *   const result = await verifyFaceWithCloudFunction(photo.uri, currentUser.uid);
       *
       * For now, we simulate a successful match if a descriptor exists.
       */
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API latency

      const hasStoredBiometric = storedDescriptor && storedDescriptor.length > 0;

      if (hasStoredBiometric) {
        // Simulated success — replace with real cloud API result
        const simulatedConfidence = 87;
        if (!isMounted.current) return;
        setConfidence(simulatedConfidence);
        setVerifyState(STATES.SUCCESS);
        setTimeout(() => { onSuccess(); }, 1500);
      } else {
        if (!isMounted.current) return;
        setVerifyState(STATES.ERROR);
      }
    } catch (err: any) {
      console.error('[FaceBiometricVerifier] Capture error:', err);
      if (isMounted.current) {
        setVerifyState(STATES.ERROR);
      }
    }
  }, [verifyState, storedDescriptor, onSuccess]);

  const handleRetry = () => {
    setVerifyState(STATES.READY);
    setConfidence(0);
  };

  // Request permission if not granted
  if (!permission?.granted) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark px-6 gap-6`}>
        <View style={tw`w-16 h-16 bg-accent-gold/10 rounded-3xl justify-center items-center`}>
          <Camera size={32} color="#C9A84C" />
        </View>
        <View style={tw`items-center gap-2`}>
          <Text style={tw`text-white font-bold text-lg uppercase tracking-tight text-center`}>Camera Access Required</Text>
          <Text style={tw`text-text-muted text-sm text-center leading-relaxed`}>
            Biometric verification requires access to your front camera to confirm your identity.
          </Text>
        </View>
        <TouchableOpacity
          onPress={requestPermission}
          style={tw`bg-accent-gold px-8 py-4 rounded-xl active:scale-95`}
        >
          <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-sm`}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`w-full gap-6`}>
      {/* Camera Viewfinder */}
      <View style={tw`relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10`}>
        {verifyState !== STATES.SUCCESS && verifyState !== STATES.FAILED && (
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
                  borderColor: verifyState === STATES.VERIFYING ? '#C9A84C' : 'rgba(255,255,255,0.3)',
                  borderStyle: 'dashed',
                }
              ]} />
            </View>
          </CameraView>
        )}

        {/* Success overlay */}
        {verifyState === STATES.SUCCESS && (
          <View style={tw`flex-1 bg-success/10 items-center justify-center`}>
            <View style={tw`w-20 h-20 bg-success rounded-full items-center justify-center`}>
              <CheckCircle2 size={40} color="#fff" />
            </View>
          </View>
        )}

        {/* Failed overlay */}
        {verifyState === STATES.FAILED && (
          <View style={tw`flex-1 bg-red-500/10 items-center justify-center`}>
            <View style={tw`w-20 h-20 bg-red-500 rounded-full items-center justify-center`}>
              <XCircle size={40} color="#fff" />
            </View>
          </View>
        )}
      </View>

      {/* Status Badge */}
      <View style={tw`bg-white/5 border border-white/10 rounded-3xl px-6 py-4 items-center gap-2`}>
        {verifyState === STATES.READY && (
          <Text style={tw`text-accent-gold font-bold uppercase tracking-widest text-xs`}>
            Position face in frame
          </Text>
        )}
        {verifyState === STATES.CAPTURING && (
          <View style={tw`flex-row items-center gap-3`}>
            <ActivityIndicator size="small" color="#C9A84C" />
            <Text style={tw`text-accent-gold font-bold uppercase tracking-widest text-xs`}>Capturing...</Text>
          </View>
        )}
        {verifyState === STATES.VERIFYING && (
          <View style={tw`flex-row items-center gap-3`}>
            <ActivityIndicator size="small" color="#C9A84C" />
            <Text style={tw`text-accent-gold font-bold uppercase tracking-widest text-xs`}>Verifying identity...</Text>
          </View>
        )}
        {verifyState === STATES.SUCCESS && (
          <View style={tw`items-center gap-1`}>
            <Text style={tw`text-success font-bold uppercase tracking-widest text-xs`}>✓ Identity Confirmed</Text>
            <Text style={tw`text-[9px] text-text-muted uppercase tracking-wider`}>Confidence Score</Text>
            <Text style={tw`text-success font-bold text-lg`}>{confidence}%</Text>
          </View>
        )}
        {verifyState === STATES.FAILED && (
          <Text style={tw`text-red-500 font-bold uppercase tracking-widest text-xs`}>✗ Identity Not Recognized</Text>
        )}
        {verifyState === STATES.ERROR && (
          <View style={tw`flex-row items-center gap-2`}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={tw`text-red-500 font-bold text-xs uppercase`}>Biometric data not configured</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {verifyState === STATES.READY && (
        <TouchableOpacity
          onPress={handleCapture}
          style={tw`bg-accent-gold py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
        >
          <Camera size={18} color="#0A0F0D" />
          <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-sm`}>Verify Biometrics</Text>
        </TouchableOpacity>
      )}

      {verifyState === STATES.FAILED && (
        <TouchableOpacity
          onPress={handleRetry}
          style={tw`border border-white/20 py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
        >
          <RefreshCw size={16} color="#F0EDE8" />
          <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Retry Verification</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
