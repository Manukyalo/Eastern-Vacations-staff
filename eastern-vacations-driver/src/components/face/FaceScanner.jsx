import React, { useRef, useEffect, useState } from 'react';
import FaceEngine from '../../engine/FaceEngine';
import { Camera, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

const FaceScanner = ({ onCapture, mode = 'register', driverEmail }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, ready, scanning, success, error
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: mode === 'register' ? 'user' : 'user' }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStatus('ready');
    } catch (err) {
      console.error('Camera access denied:', err);
      setStatus('error');
      setErrorMessage('Camera access denied. Please enable permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleScan = async () => {
    if (status !== 'ready') return;
    setStatus('scanning');
    setProgress(0);

    try {
      // Simulate progress for UI
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const result = await FaceEngine.registerFace(videoRef.current, driverEmail);
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
      
      if (onCapture) {
        onCapture(result);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Face capture failed. Please ensure you are in a well-lit area.');
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-primary-dark rounded-2xl overflow-hidden border border-border shadow-2xl">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${status === 'scanning' ? 'brightness-75' : ''}`}
      />

      {/* Oval Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
        <div className={`
          w-[75%] aspect-[3/4.5] border-2 rounded-[50%] transition-all duration-300
          ${status === 'scanning' ? 'border-accent-gold scale-105 shadow-[0_0_20px_rgba(201,168,76,0.5)]' : 'border-white/30'}
          ${status === 'success' ? 'border-success' : ''}
          ${status === 'error' ? 'border-danger-red' : ''}
        `} />
      </div>

      {/* Overlay Feedback */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
        {status === 'ready' && (
          <p className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
            Position face in oval
          </p>
        )}
        
        {status === 'scanning' && (
          <div className="flex flex-col items-center">
            <p className="bg-accent-gold text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-4">
              Scanning... {progress}%
            </p>
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-accent-gold transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-success/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={24} />
            <span className="font-bold uppercase tracking-wider">Face Captured</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-danger-red/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 max-w-[80%] text-center">
            <AlertCircle size={24} className="shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6">
        {status === 'ready' && (
          <button
            onClick={handleScan}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 border-4 border-primary-dark rounded-full" />
          </button>
        )}
        
        {status === 'error' && (
          <button
            onClick={startCamera}
            className="bg-accent-gold text-primary-dark font-bold py-3 px-8 rounded-full flex items-center gap-2 pointer-events-auto"
          >
            <RefreshCcw size={20} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceScanner;
