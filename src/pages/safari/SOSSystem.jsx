import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, ShieldAlert, Clock, PhoneCall, X, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const SOSSystem = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isTriggered, setIsTriggered] = useState(false);

  const triggerSOS = useCallback(async () => {
    if (isTriggered) return;
    setIsTriggered(true);
    const toastId = toast.loading("TRANSMITTING SOS SIGNAL...");

    try {
      await addDoc(collection(db, 'sos_alerts'), {
        type: selectedType || 'GENERAL_EMERGENCY',
        timestamp: serverTimestamp(),
        status: 'ACTIVE',
        location: { latitude: -1.2921, longitude: 36.8219 }, // Mock location
        priority: 'CRITICAL'
      });
      toast.success("SOS SIGNAL CONFIRMED BY HQ", { id: toastId });
    } catch (error) {
      console.error('SOS Failure:', error);
      toast.error("SIGNAL INTERRUPTED. RETRYING...", { id: toastId });
    }
  }, [isTriggered, selectedType]);

  useEffect(() => {
    let timer;
    if (isActive && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && isActive && !isTriggered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      triggerSOS();
    }
    return () => clearInterval(timer);
  }, [isActive, countdown, isTriggered, triggerSOS]);

  const cancelSOS = () => {
    setIsActive(false);
    setCountdown(10);
    toast("SOS ABORTED", { icon: '🛑' });
    navigate(-1);
  };

  const startSOS = (type) => {
    setSelectedType(type);
    setIsActive(true);
  };

  if (isActive) {
    return (
      <div className="fixed inset-0 z-[100] bg-danger-red flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
        <div className="absolute top-12 text-white/40 font-black text-6xl tracking-tighter opacity-10 select-none">EMERGENCY SOS</div>
        
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
           <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
           <div className="absolute inset-4 bg-white/20 rounded-full animate-pulse" />
           <div className="relative text-white font-black text-8xl transition-all duration-300 scale-110">
             {countdown}
           </div>
        </div>

        <h2 className="text-3xl font-heading font-black text-white text-center mb-4 uppercase tracking-tighter">
          {isTriggered ? 'SIGNAL TRANSMITTED' : 'BROADCASTING IN...'}
        </h2>
        <p className="text-white/80 text-center text-sm font-bold uppercase tracking-widest max-w-[280px]">
          {isTriggered 
            ? 'HQ and nearby units have been notified of your location. Stay with the vehicle.' 
            : `A CRITICAL ${selectedType?.replace('_', ' ')} ALERT will be sent to all Dispatchers and Local Rangers.`}
        </p>

        {!isTriggered && (
          <button 
            onClick={cancelSOS}
            className="mt-16 bg-white text-danger-red font-black py-5 px-12 rounded-2xl flex items-center gap-3 active:scale-95 transition-all shadow-2xl"
          >
            <X size={24} />
            CANCEL SIGNAL
          </button>
        )}

        {isTriggered && (
          <button 
             onClick={() => navigate(-1)}
             className="mt-16 bg-white/20 border border-white/40 text-white font-black py-5 px-12 rounded-2xl active:scale-95 transition-all"
          >
            DISMISS OVERLAY
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-24 h-screen flex flex-col">
       <div>
         <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
           EMERGENCY <span className="text-danger-red">PROTOCOL</span>
         </h1>
         <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-1">High-Priority Alert Terminal</p>
       </div>

       <div className="grid gap-4 flex-1">
          {[
            { id: 'MEDICAL', label: 'Medical Emergency', icon: ShieldAlert },
            { id: 'VEHICLE_BREAKDOWN', label: 'Critical Breakdown', icon: Zap },
            { id: 'SECURITY_THREAT', label: 'Security Threat', icon: AlertCircle },
            { id: 'ACCIDENT', label: 'Major Accident', icon: ShieldAlert },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => startSOS(type.id)}
              className="bg-card border border-border p-6 rounded-[2rem] flex items-center justify-between group active:bg-danger-red/10 active:border-danger-red transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-danger-red/10 rounded-2xl flex items-center justify-center text-danger-red group-active:scale-110 transition-transform">
                  <type.icon size={28} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-black uppercase tracking-tight">{type.label}</h3>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Immediate HQ Signal</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-text-muted opacity-20" />
            </button>
          ))}
       </div>

       <div className="bg-surface border border-dashed border-border p-6 rounded-2xl flex items-center gap-4">
          <PhoneCall size={24} className="text-accent-gold" />
          <div className="text-left">
             <p className="text-[10px] uppercase font-black text-text-muted">Dispatch Hotline</p>
             <p className="text-white font-mono font-bold">+254 700 000 000</p>
          </div>
       </div>
    </div>
  );
};

export default SOSSystem;
