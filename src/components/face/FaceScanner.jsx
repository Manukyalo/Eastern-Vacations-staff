import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const FaceScanner = ({ onCapture, mode = 'register' }) => {
  const videoRef = useRef(null);
  const isMounted = useRef(true);
  const [status, setStatus] = useState('loading-models'); // loading-models, loading-camera, ready, success, error
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Initializing biometric engine...');
  const [isCapturing, setIsCapturing] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);

  // 1. Mount management & Initial Checks
  useEffect(() => {
    isMounted.current = true;

    // 1.1 Secure Context check
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

    // 1.3 Skip loading if in session
    if (sessionStorage.getItem('faceModelsLoaded') === 'true') {
      console.log('FaceScanner: Models pre-loaded, ready for camera');
      setIsModelsLoaded(true);
    } else {
      loadModels();
    }

    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // 2. Load Models
  const loadModels = async () => {
    setStatus('loading-models');
    setLoadingMessage('Step 1/3: Loading face detector...');
    
    const retryTimer = setTimeout(() => {
      if (isMounted.current) setRetryVisible(true);
    }, 15000);

    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 30000)
    );
    
    try {
      await Promise.race([loadAllModels(), timeout]);
      clearTimeout(retryTimer);
      sessionStorage.setItem('faceModelsLoaded', 'true');
      if (isMounted.current) setIsModelsLoaded(true);
    } catch (err) {
      clearTimeout(retryTimer);
      if (isMounted.current) {
        setErrorMessage(err.message === 'timeout' 
          ? 'Loading timed out. Check connection.' 
          : 'Failed to initialize Face ID.');
        setStatus('error');
      }
    }
  };

  const loadAllModels = async () => {
    try {
      await Promise.all([
        (async () => {
          await faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL);
          if (isMounted.current) setLoadingMessage('Step 2/3: Loading landmark model...');
        })(),
        (async () => {
          await faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL);
          if (isMounted.current) setLoadingMessage('Step 3/3: Loading recognition model...');
        })(),
        (async () => {
          await faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL);
        })()
      ]);
      if (isMounted.current) setLoadingMessage('Optimizing engine...');
    } catch (err) {
      throw err;
    }
  };

  // 3. Consolidated Camera Start Sequence
  // Runs ONLY once models are loaded and video element exists
  useEffect(() => {
    if (!isModelsLoaded) return;
    
    let activeStream = null;

    const startCamera = async () => {
      if (!isMounted.current) return;
      
      setStatus('loading-camera');
      setLoadingMessage('Starting camera...');

      try {
        // Step 1: Explicit Permission Check
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          if (permission.state === 'denied') {
            throw new Error('PERMISSION_DENIED');
          }
        }

        // Step 2: Request Stream
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 320 },
            height: { ideal: 240 }
          },
          audio: false
        });

        if (!isMounted.current) {
          activeStream.getTracks().forEach(t => t.stop());
          return;
        }

        // Step 3: Bind to Video Element
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          
          // Step 4: Wait for ReadyState
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Camera timeout')), 10000);
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
            videoRef.current.onerror = reject;
          });

          // Step 5: Final Play
          await videoRef.current.play();
          if (isMounted.current) setStatus('ready');
        }
      } catch (err) {
        if (!isMounted.current) return;
        console.error('Camera startup failed:', err);
        
        if (err.message === 'PERMISSION_DENIED' || err.name === 'NotAllowedError') {
          setErrorMessage('Camera access denied. Please allow camera permission.');
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setErrorMessage('Camera is busy. Close other apps.');
        } else {
          setErrorMessage(err.message === 'Camera timeout' 
            ? 'Camera timed out. Please refresh.' 
            : 'Camera failed: ' + err.message);
        }
        setStatus('error');
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isModelsLoaded]);

  // 4. Detection Loop
  useEffect(() => {
    if (status !== 'ready' || !isMounted.current) return;

    let detectionTimeout;
    const loop = async () => {
      if (!videoRef.current || isCapturing || !isMounted.current) return;
      
      try {
        if (videoRef.current.readyState < 2) {
          detectionTimeout = setTimeout(loop, 500);
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

        if (detection && isMounted.current) {
          handleSuccess(detection);
        } else if (isMounted.current) {
          detectionTimeout = setTimeout(loop, 500);
        }
      } catch (err) {
        if (isMounted.current) detectionTimeout = setTimeout(loop, 1000);
      }
    };

    const startDetection = setTimeout(loop, 1000);
    return () => {
      clearTimeout(startDetection);
      clearTimeout(detectionTimeout);
    };
  }, [status, isCapturing]);

  const handleSuccess = (detection) => {
    setIsCapturing(true);
    setStatus('success');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (onCapture && isMounted.current) {
        onCapture({
          descriptor: Array.from(detection.descriptor),
          imageBlob: blob
        });
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-primary-dark rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col items-center justify-center">
      
      {/* Loading & Setup Screen */}
      {(status === 'loading-models' || status === 'loading-camera') && (
        <div className="flex flex-col items-center z-20 text-center px-6">
          <Loader2 className="text-accent-gold animate-spin mb-4" size={40} />
          <h3 className="text-white font-bold text-lg">{loadingMessage}</h3>
          <p className="text-white/30 text-xs mt-2 uppercase tracking-widest font-medium">Biometric Engine v2.0</p>
          
          {retryVisible && status === 'loading-models' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white/50 py-2 px-6 rounded-full text-xs transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reset Engine
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
            className="mt-6 bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-transform active:scale-95"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      )}

      {/* Stable Video View — Unmounted only if error/loading-models */}
      {isModelsLoaded && status !== 'error' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            webkit-playsinline="true"
            x5-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirrored view
              visibility: (status === 'ready' || status === 'success') ? 'visible' : 'hidden'
            }}
            className={`w-full h-full transition-opacity duration-1000 ${status === 'success' ? 'opacity-50' : 'opacity-100'}`}
          />
          
          {/* Overlay elements only show when ready */}
          {(status === 'ready' || status === 'success') && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`
                  w-[70%] aspect-[3/4] border-2 rounded-[50%] transition-all duration-700
                  ${status === 'success' ? 'border-success scale-110 shadow-[0_0_40px_rgba(72,187,120,0.6)]' : 'border-white/20 animate-pulse'}
                `} />
              </div>

              <div className="absolute top-8 left-0 right-0 text-center">
                <p className="bg-black/60 backdrop-blur-xl text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block border border-white/10">
                  {status === 'success' ? 'Face Verified' : 'Position Face Inside Oval'}
                </p>
              </div>
            </>
          )}
        </>
      )}

      {status === 'success' && (
        <div className="absolute inset-0 bg-success/10 flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-500">
          <div className="bg-white rounded-full p-5 mb-4 shadow-2xl">
            <Camera className="text-success" size={32} />
          </div>
          <p className="text-white font-black uppercase tracking-[0.3em] text-sm">Capturing Data</p>
        </div>
      )}
    </div>
  );
};

export default FaceScanner;



