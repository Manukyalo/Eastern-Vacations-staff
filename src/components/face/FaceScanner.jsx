import React, { useRef, useEffect, useState } from 'react'
import FaceEngine from '../../engine/FaceEngine'

const STATES = {
  LOADING_MODELS: 'loading_models',
  STARTING_CAMERA: 'starting_camera',
  POSITION_FACE: 'position_face',
  FACE_DETECTED: 'face_detected',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  ERROR: 'error'
}

export default function FaceScanner({ onCapture, onError }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const isMounted = useRef(true)
  const [state, setState] = useState(STATES.LOADING_MODELS)
  const [progress, setProgress] = useState(0)
  const [loadingMsg, setLoadingMsg] = useState(
    'Initializing Face ID...')
  const [samplesCount, setSamplesCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    isMounted.current = true
    init()
    
    return () => {
      isMounted.current = false
      FaceEngine.stopDetection()
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks()
        .forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const init = async () => {
    // Step 1: Load models
    try {
      await FaceEngine.loadModels((msg) => {
        if (!isMounted.current) return
        setLoadingMsg(msg)
        setProgress(prev => Math.min(prev + 33, 100))
      })
    } catch (err) {
      if (isMounted.current) {
        setState(STATES.ERROR)
        setErrorMsg(err.message || 'Face ID unavailable. Check connection.')
      }
      return
    }

    if (!isMounted.current) return

    // Step 2: Start camera
    setState(STATES.STARTING_CAMERA)
    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        })

      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream

      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = resolve
        setTimeout(reject, 10000)
      })

      await videoRef.current.play()

      if (!isMounted.current) return

      // Step 3: Start face detection
      setState(STATES.POSITION_FACE)
      startDetection()

    } catch (err) {
      if (!isMounted.current) return
      setState(STATES.ERROR)
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Enable camera in browser settings.')
      } else if (err.name === 'NotReadableError') {
        setErrorMsg('Camera in use. Close other apps and try again.')
      } else {
        setErrorMsg('Camera failed: ' + err.message)
      }
    }
  }

  const startDetection = () => {
    FaceEngine.startContinuousDetection(
      videoRef.current,
      {
        onFaceDetected: (count) => {
          if (!isMounted.current) return
          if (count >= 2) {
            setState(STATES.FACE_DETECTED)
            // The engine handles sample collection internally now, 
            // but we can track count for UI if needed.
            // For now, let's assume detection is high quality.
          }
        },
        onNoFace: () => {
          if (!isMounted.current) return
          setState(STATES.POSITION_FACE)
          setSamplesCount(0)
        },
        onCapture: (descriptor) => {
          if (!isMounted.current) return
          setState(STATES.SUCCESS)
          
          // Simple capture for the Base64 image
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          
          // Flip horizontally to match mirror view
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.6);

          stopCamera()
          onCapture?.({
            descriptor: Array.from(descriptor),
            imageBlob: imageData
          })
        },
        onError: (msg) => {
          console.warn('Detection warning:', msg)
        }
      }
    )
  }

  // UI feedback based on state
  const getOvalStyle = () => {
    switch(state) {
      case STATES.FACE_DETECTED:
      case STATES.SCANNING:
        return 'border-safari-gold shadow-[0_0_20px_rgba(212,175,55,0.5)] animate-pulse'
      case STATES.SUCCESS:
        return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
      case STATES.ERROR:
        return 'border-red-500'
      default:
        return 'border-white/20'
    }
  }

  const getStatusText = () => {
    switch(state) {
      case STATES.LOADING_MODELS:
        return loadingMsg
      case STATES.STARTING_CAMERA:
        return 'Starting camera...'
      case STATES.POSITION_FACE:
        return 'Position your face in the oval'
      case STATES.FACE_DETECTED:
        return 'Hold still — scanning...'
      case STATES.SCANNING:
        return `Capturing... ${samplesCount}/5`
      case STATES.SUCCESS:
        return '✓ Face captured successfully!'
      case STATES.ERROR:
        return errorMsg
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 p-6 bg-primary-dark">
      
      {/* Loading state */}
      {state === STATES.LOADING_MODELS && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
          <div className="w-12 h-12 border-2 border-safari-gold border-t-transparent rounded-full animate-spin" />
          <div className="space-y-3 text-center">
            <p className="text-white/80 font-medium tracking-wide">
              {loadingMsg}
            </p>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-safari-gold transition-all duration-700 ease-out"
                style={{ width: progress + '%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera view */}
      {state !== STATES.LOADING_MODELS && state !== STATES.ERROR && (
        <div className="relative w-full max-w-sm aspect-[3/4] animate-in zoom-in-95 duration-700">
          
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="w-full h-full object-cover rounded-[2rem] border border-white/10 shadow-2xl"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Face oval overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`
              w-[70%] aspect-[3/4] rounded-[50%] border-2 
              transition-all duration-500
              ${getOvalStyle()}
            `} />
          </div>

          {/* Success Overlay */}
          {state === STATES.SUCCESS && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] backdrop-blur-sm animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                ✓
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status text */}
      <div className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-xl">
        <p className={`text-center font-bold text-sm tracking-widest uppercase
          ${state === STATES.SUCCESS ? 'text-green-500' : 
            state === STATES.ERROR ? 'text-red-500' : 
            state === STATES.FACE_DETECTED ? 'text-safari-gold' : 'text-white/60'}`}>
          {getStatusText()}
        </p>
      </div>

      {/* Error retry button */}
      {state === STATES.ERROR && (
        <button
          onClick={() => {
            setState(STATES.LOADING_MODELS)
            setProgress(0)
            setErrorMsg('')
            init()
          }}
          className="bg-safari-gold text-black px-10 py-3.5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Reset System
        </button>
      )}
    </div>
  )
}
