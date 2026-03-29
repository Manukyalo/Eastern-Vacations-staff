import React, { useRef, useEffect, useState } from 'react'
import FaceEngine from '../../engine/FaceEngine'
import { AlertCircle, Camera, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'

const STATES = {
  LOADING: 'loading',
  READY: 'ready',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
  ERROR: 'error'
}

export default function FaceVerifier({ storedDescriptor, onSuccess, onFail }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const isMounted = useRef(true)
  const [state, setState] = useState(STATES.LOADING)
  const [errorMsg, setErrorMsg] = useState('')
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    isMounted.current = true
    init()
    
    return () => {
      isMounted.current = false
      stopCamera()
    }
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function init() {
    try {
      await FaceEngine.loadModels()
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      })

      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = resolve
      })

      await videoRef.current.play()

      if (isMounted.current) {
        setState(STATES.READY)
        startVerificationLoop()
      }
    } catch (err) {
      if (isMounted.current) {
        setState(STATES.ERROR)
        setErrorMsg(err.message)
      }
    }
  }

  async function startVerificationLoop() {
    if (!isMounted.current) return
    
    setState(STATES.VERIFYING)
    
    try {
      const result = await FaceEngine.verifyFace(videoRef.current, storedDescriptor)
      
      if (!isMounted.current) return

      if (result.match) {
        setConfidence(result.confidence)
        setState(STATES.SUCCESS)
        setTimeout(() => {
          onSuccess?.(result)
        }, 1500)
      } else {
        setState(STATES.FAILED)
        setTimeout(() => {
          onFail?.(result)
        }, 2000)
      }
    } catch (err) {
      if (isMounted.current) {
        setState(STATES.ERROR)
        setErrorMsg(err.message)
      }
    }
  }

  const getStatusContent = () => {
    switch(state) {
      case STATES.LOADING:
        return {
          icon: <Loader2 className="animate-spin text-safari-gold" size={24} />,
          text: 'Initializing Face ID...',
          color: 'text-white/60'
        }
      case STATES.READY:
      case STATES.VERIFYING:
        return {
          icon: <div className="w-2 h-2 bg-safari-gold rounded-full animate-pulse" />,
          text: state === STATES.READY ? 'Position face in oval' : 'Verifying identity...',
          color: 'text-safari-gold'
        }
      case STATES.SUCCESS:
        return {
          icon: <CheckCircle2 className="text-green-500" size={24} />,
          text: '✓ Identity Confirmed',
          color: 'text-green-500'
        }
      case STATES.FAILED:
        return {
          icon: <XCircle className="text-red-500" size={24} />,
          text: '✗ Identity Not Recognized',
          color: 'text-red-500'
        }
      case STATES.ERROR:
        return {
          icon: <AlertCircle className="text-red-500" size={24} />,
          text: errorMsg || 'System Error',
          color: 'text-red-500'
        }
      default:
        return { icon: null, text: '', color: '' }
    }
  }

  const content = getStatusContent()

  return (
    <div className="flex flex-col items-center justify-center w-full gap-8 p-6">
      
      {/* Video Container */}
      <div className="relative w-full max-w-sm aspect-[3/4] group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover rounded-[2rem] border-2 transition-all duration-700
            ${state === STATES.SUCCESS ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
              state === STATES.FAILED ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 
              'border-white/10 shadow-2xl'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Overlay Oval */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[70%] aspect-[3/4] rounded-[50%] border-2 transition-all duration-500
            ${state === STATES.VERIFYING ? 'border-safari-gold animate-pulse scale-105' : 
              state === STATES.SUCCESS ? 'border-green-500 scale-110' : 
              state === STATES.FAILED ? 'border-red-500 scale-95' : 
              'border-white/20'}`} 
          />
        </div>

        {/* Global States Overlay */}
        {(state === STATES.SUCCESS || state === STATES.FAILED) && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-[2rem] backdrop-blur-sm animate-in fade-in duration-500
            ${state === STATES.SUCCESS ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300
              ${state === STATES.SUCCESS ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {state === STATES.SUCCESS ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="px-8 py-4 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl min-w-[280px]">
        <div className="flex items-center justify-center gap-4">
          {content.icon}
          <span className={`text-sm font-black uppercase tracking-[0.2em] ${content.color}`}>
            {content.text}
          </span>
        </div>
        
        {state === STATES.SUCCESS && (
          <div className="mt-3 text-center animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Confidence Score</p>
            <p className="text-green-500 font-black text-lg">{confidence}%</p>
          </div>
        )}
      </div>

      {state === STATES.FAILED && (
        <button
          onClick={() => {
            setState(STATES.LOADING)
            init()
          }}
          className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          Retry Verification
        </button>
      )}

      {state === STATES.ERROR && (
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-red-600 transition-all"
        >
          System Reset
        </button>
      )}
    </div>
  )
}
