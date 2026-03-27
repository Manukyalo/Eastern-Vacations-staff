import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceScanner = ({ onCapture, mode = 'register' }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading-models'); // loading-models, loading-camera, ready, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Load models first
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus('loading-models');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log('Models loaded successfully');
        startCamera();
      } catch (err) {
        console.error('Model loading failed:', err);
        setErrorMessage('Failed to load Face ID models. Check your connection.');
        setStatus('error');
      }
    };
    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Start camera
  const startCamera = async () => {
    setStatus('loading-camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('ready');
      }
    } catch (err) {
      console.warn('Primary camera failed, trying fallback...', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('ready');
        }
      } catch (fallbackErr) {
        setErrorMessage('Camera access denied. Please allow camera permission.');
        setStatus('error');
      }
    }
  };

  // 3. Start detection after video is playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      console.log('Video playing, starting detection in 1s...');
      setTimeout(detectFace, 1000);
    };

    video.addEventListener('playing', handlePlaying);
    return () => video.removeEventListener('playing', handlePlaying);
  }, [status]);

  const detectFace = async () => {
    if (!videoRef.current || isCapturing) return;
    
    try {
      // Wait for video to be ready (HAVE_CURRENT_DATA or better)
      if (videoRef.current.readyState < 2) {
        setTimeout(detectFace, 500);
        return;
      }

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, // REQUIRED: Fixes tensor shape error
        scoreThreshold: 0.3
      });

      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Face found!
        handleSuccess(detection);
      } else {
        // No face found, retry
        setTimeout(detectFace, 500);
      }
    } catch (err) {
      console.error('Detection error:', err);
      setTimeout(detectFace, 1000);
    }
  };

  const handleSuccess = (detection) => {
    setIsCapturing(true);
    setStatus('success');

    // Capture the frame as Base64 for Firestore storage
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const imageBlob = canvas.toDataURL('image/jpeg', 0.8);

    if (onCapture) {
      onCapture({
        descriptor: Array.from(detection.descriptor),
        imageBlob: imageBlob
      });
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-primary-dark rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col items-center justify-center">
      
      {/* Loading States */}
      {(status === 'loading-models' || status === 'loading-camera') && (
        <div className="flex flex-col items-center z-20 text-center px-6">
          <Loader2 className="text-accent-gold animate-spin mb-4" size={40} />
          <h3 className="text-white font-bold text-lg">Loading Face ID...</h3>
          <p className="text-white/50 text-sm mt-2">Please wait while we initialize the biometric engine</p>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="flex flex-col items-center z-20 text-center px-6">
          <AlertCircle className="text-danger-red mb-4" size={40} />
          <h3 className="text-white font-bold text-lg">System Error</h3>
          <p className="text-white/60 text-sm mt-2">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-full flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Reset System
          </button>
        </div>
      )}

      {/* Camera View */}
      {(status === 'ready' || status === 'success') && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width="320"
            height="240"
            className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'success' ? 'opacity-50' : 'opacity-100'}`}
          />
          
          {/* Oval Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`
              w-[70%] aspect-[3/4] border-2 rounded-[50%] transition-all duration-500
              ${status === 'success' ? 'border-success scale-110 shadow-[0_0_30px_rgba(72,187,120,0.5)]' : 'border-white/30 animate-pulse'}
            `} />
          </div>

          <div className="absolute top-8 left-0 right-0 text-center">
            <p className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold inline-block uppercase tracking-widest">
              {status === 'success' ? 'Verification Complete' : 'Position face inside the oval'}
            </p>
          </div>
        </>
      )}

      {status === 'success' && (
        <div className="absolute inset-0 bg-success/20 flex flex-col items-center justify-center z-10">
          <div className="bg-white rounded-full p-4 mb-4 shadow-2xl animate-bounce">
            <Camera className="text-success" size={32} />
          </div>
          <p className="text-white font-black uppercase tracking-tighter text-xl">Encoded</p>
        </div>
      )}
    </div>
  );
};

export default FaceScanner;

