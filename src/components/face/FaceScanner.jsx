import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const FaceScanner = ({ onCapture, mode = 'register' }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading-models'); // loading-models, loading-camera, ready, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Initializing biometric engine...');
  const [isCapturing, setIsCapturing] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);

  // 1. Initial Compatibility & Persistence Check
  useEffect(() => {
    // 1.1 Secure Context check (Face API requires HTTPS)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setErrorMessage('Secure connection required for Face ID. Please use HTTPS.');
      setStatus('error');
      return;
    }

    // 1.2 MediaDevices check
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Your browser does not support camera access. Please use Chrome or Safari.');
      setStatus('error');
      return;
    }

    // 1.3 Skip loading if already loaded in this session
    if (sessionStorage.getItem('faceModelsLoaded') === 'true') {
      console.log('FaceScanner: Models detected in session, skipping load...');
      initiateCameraSequence();
      return;
    }

    loadModels();

    // Cleanup tracks on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const loadModels = async () => {
    setStatus('loading-models');
    setLoadingMessage('Step 1/3: Loading face detector...');
    
    const retryTimer = setTimeout(() => setRetryVisible(true), 15000);
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 30000)
    );
    
    try {
      await Promise.race([loadAllModels(), timeout]);
      clearTimeout(retryTimer);
      sessionStorage.setItem('faceModelsLoaded', 'true');
      initiateCameraSequence();
    } catch (err) {
      clearTimeout(retryTimer);
      console.error('FaceScanner: Loading failed', err);
      setErrorMessage(err.message === 'timeout' 
        ? 'Loading timed out. Please check your connection.' 
        : 'Failed to initialize Face ID. Check your internet connection.');
      setStatus('error');
    }
  };

  const loadAllModels = async () => {
    try {
      await Promise.all([
        (async () => {
          await faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL);
          setLoadingMessage('Step 2/3: Loading landmark model...');
        })(),
        (async () => {
          await faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL);
          setLoadingMessage('Step 3/3: Loading recognition model...');
        })(),
        (async () => {
          await faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL);
        })()
      ]);
      setLoadingMessage('Optimizing engine...');
    } catch (err) {
      throw err;
    }
  };

  // 2. Camera Sequence
  const initiateCameraSequence = async () => {
    setStatus('loading-camera');
    setLoadingMessage('Requesting camera permission...');
    
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      startCamera();
    }
  };

  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions?.query) return true; // API not supported, proceed to getUserMedia
      
      const permission = await navigator.permissions.query({ name: 'camera' });
      if (permission.state === 'denied') {
        setErrorMessage('Camera permission denied. Please go to your browser settings and allow camera access for this site, then refresh the page.');
        setStatus('error');
        return false;
      }
      return true;
    } catch (err) {
      return true; // Proceed anyway, getUserMedia will catch errors
    }
  };

  const startCamera = async () => {
    setLoadingMessage('Starting camera...');
    stopCamera(); // Ensure clean slate

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
        
        // Wait for metadata ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Camera timeout')), 10000);
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
          videoRef.current.onerror = reject;
        });

        await videoRef.current.play();
        setStatus('ready');
      }
    } catch (err) {
      console.error('Camera startup failed:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Camera access denied. Please allow camera permission in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setErrorMessage('Camera is already in use by another app. Please close other apps using the camera and try again.');
      } else {
        setErrorMessage(err.message === 'Camera timeout' 
          ? 'Camera took too long to start. Please refresh and try again.' 
          : 'Camera failed to start: ' + err.message);
      }
      setStatus('error');
    }
  };

  // 3. Status handling for detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== 'ready') return;

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
      if (videoRef.current.readyState < 2) {
        setTimeout(detectFace, 500);
        return;
      }

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.3
      });

      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        handleSuccess(detection);
      } else {
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

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirror the capture as well for consistency
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
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
          <h3 className="text-white font-bold text-lg">{loadingMessage}</h3>
          <p className="text-white/40 text-sm mt-2">Loading biometric assets in parallel for high performance</p>
          
          {retryVisible && status === 'loading-models' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white/50 py-2 px-6 rounded-full text-xs transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Taking too long? Try Again
            </button>
          )}
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
            controls={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
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
              {status === 'success' ? 'Verification Complete' : 'Camera Ready — Position Face'}
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


