import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { AlertCircle, ShieldAlert, PhoneCall, X, ChevronRight, Zap, Shield, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMERGENCY_TYPES = [
  {
    id: 'MEDICAL',
    label: 'MEDICAL EMERGENCY',
    subtitle: 'IMMEDIATE HQ SIGNAL',
    icon: Shield,
    color: '#DC2626',
    message: 'Driver requires immediate medical assistance. Send emergency services.'
  },
  {
    id: 'VEHICLE_BREAKDOWN',
    label: 'CRITICAL BREAKDOWN',
    subtitle: 'IMMEDIATE HQ SIGNAL', 
    icon: Zap,
    color: '#DC2626',
    message: 'Vehicle has broken down. Driver and clients stranded.'
  },
  {
    id: 'SECURITY_THREAT',
    label: 'SECURITY THREAT',
    subtitle: 'IMMEDIATE HQ SIGNAL',
    icon: AlertCircle,
    color: '#DC2626',
    message: 'Security threat detected. Driver and clients in danger.'
  },
  {
    id: 'ACCIDENT',
    label: 'MAJOR ACCIDENT',
    subtitle: 'IMMEDIATE HQ SIGNAL',
    icon: Shield,
    color: '#DC2626',
    message: 'Major accident occurred. Multiple casualties possible.'
  }
];

const SOSSystem = () => {
  const navigate = useNavigate();
  const { currentUser, driverProfile, driverAuth } = useAuth();
  const { currentLocation } = useLocation();
  
  const [sosStatus, setSosStatus] = useState('idle'); // idle, transmitting, transmitted, acknowledged, resolved, failed
  const [sosId, setSosId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const unsubscribeRef = useRef(null);

  const triggerSOS = async (emergencyType) => {
    setSosStatus('transmitting');
    setShowConfirmation(false);
    
    // Step 1: Get location with fallback
    let latitude = currentLocation?.latitude || null;
    let longitude = currentLocation?.longitude || null;
    
    if (!latitude) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (gpsError) {
        console.warn('GPS unavailable:', gpsError.message);
      }
    }

    // Step 2: Get driver info from AuthContext
    const driverId = currentUser?.uid;
    const driverName = driverProfile?.name ?? currentUser?.email ?? 'Unknown Driver';
    const driverRole = driverAuth?.role ?? 'safari_driver';

    // Step 3: Write SOS to Firestore
    try {
      const typeInfo = EMERGENCY_TYPES.find(t => t.id === emergencyType) || { label: emergencyType };
      
      const sosData = {
        driverId: driverId || 'anonymous',
        driverName: driverName,
        driverRole: driverRole,
        emergencyType: emergencyType,
        latitude: latitude,
        longitude: longitude,
        locationAvailable: latitude !== null,
        status: 'Active',
        createdAt: serverTimestamp(),
        acknowledgedAt: null,
        resolvedAt: null,
        message: `EMERGENCY: ${typeInfo.label} reported by ${driverName}${latitude ? ` at coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : ' — GPS unavailable'}`
      };

      const sosRef = await addDoc(collection(db, 'sosAlerts'), sosData);

      // Step 4: Write to notifications collection
      await addDoc(collection(db, 'notifications'), {
        title: `🚨 SOS ALERT — ${driverName}`,
        message: sosData.message,
        type: 'CRITICAL',
        targetRole: 'both',
        date: serverTimestamp(),
        read: false,
        sosId: sosRef.id,
        link: '/admin/sos-alerts'
      });

      // Step 5: Open WhatsApp with SOS message
      const adminWhatsApp = import.meta.env.VITE_ADMIN_WHATSAPP;
      if (adminWhatsApp) {
        const waMessage = encodeURIComponent(
          `🚨 EMERGENCY SOS ALERT\n` +
          `Driver: ${driverName}\n` +
          `Emergency: ${typeInfo.label}\n` +
          `${latitude ? 
            `Location: https://maps.google.com/?q=${latitude},${longitude}\n` : 
            'Location: GPS unavailable\n'}` +
          `Time: ${new Date().toLocaleTimeString()}\n`
        );
        window.open(`https://wa.me/${adminWhatsApp}?text=${waMessage}`, '_blank');
      }

      setSosStatus('transmitted');
      setSosId(sosRef.id);

      // Step 6: Listen for admin acknowledgement
      unsubscribeRef.current = onSnapshot(
        doc(db, 'sosAlerts', sosRef.id),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'Acknowledged') {
              setSosStatus('acknowledged');
            }
            if (data.status === 'Resolved') {
              setSosStatus('resolved');
              if (unsubscribeRef.current) unsubscribeRef.current();
            }
          }
        }
      );

    } catch (firestoreError) {
      console.error('SOS write failed:', firestoreError);
      setSosStatus('failed');
      setErrorMsg('Signal failed: ' + firestoreError.message + '. Try calling the dispatch hotline directly.');
    }
  };

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const handleCallHotline = () => {
    const phone = import.meta.env.VITE_ADMIN_EMERGENCY_PHONE || '+254 700 000 000';
    window.open(`tel:${phone}`);
  };

  if (sosStatus !== 'idle') {
    return (
      <div className={`fixed inset-0 z-[100] ${sosStatus === 'failed' ? 'bg-[#0A0F0D]' : 'bg-[#DC2626]'} flex flex-col items-center justify-center p-8 animate-in fade-in duration-300`}>
        <div className="absolute top-12 text-white/40 font-black text-6xl tracking-tighter opacity-10 select-none uppercase">
          {sosStatus === 'failed' ? 'Signal Failed' : 'Emergency SOS'}
        </div>
        
        {/* Pulsing Radio Wave Animation */}
        {(sosStatus === 'transmitting' || sosStatus === 'transmitted') && (
          <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
             <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
             <div className="absolute inset-4 bg-white/10 rounded-full animate-pulse" />
             <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center text-danger-red shadow-[0_0_50px_rgba(255,255,255,0.4)]">
                {sosStatus === 'transmitting' ? <Send size={48} className="animate-pulse" /> : <CheckCircle size={48} />}
             </div>
          </div>
        )}

        {sosStatus === 'acknowledged' && (
          <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#16A34A]/20 rounded-full animate-pulse" />
            <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center text-[#16A34A] shadow-2xl">
              <Shield size={48} />
            </div>
          </div>
        )}

        <div className="text-center space-y-4 max-w-[280px]">
          <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tighter leading-none">
            {sosStatus === 'transmitting' && 'Transmitting Signal...'}
            {sosStatus === 'transmitted' && 'Signal Transmitted'}
            {sosStatus === 'acknowledged' && 'HQ Acknowledged'}
            {sosStatus === 'resolved' && 'Emergency Resolved'}
            {sosStatus === 'failed' && 'Signal Failed'}
          </h2>

          <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
            {sosStatus === 'transmitting' && 'Connecting to Eastern Vacations HQ Security Grid...'}
            {sosStatus === 'transmitted' && 'HQ and nearby units have been notified of your location. Stay with the vehicle.'}
            {sosStatus === 'acknowledged' && 'Help is on the way. Stay calm and maintain radio silence unless contacted.'}
            {sosStatus === 'resolved' && 'The emergency situation has been marked as resolved by HQ Command.'}
            {sosStatus === 'failed' && errorMsg}
          </p>

          {(sosStatus === 'transmitted' || sosStatus === 'acknowledged') && (
            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 mt-6 backdrop-blur-md">
               <p className="text-[9px] text-white/60 uppercase font-black tracking-widest mb-1.5">Last Known Position</p>
               <p className="text-white font-mono text-[11px] font-bold">
                 {currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 'GPS OFFLINE'}
               </p>
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-col gap-4 w-full max-w-xs px-6">
          {sosStatus === 'failed' && (
            <>
              <button 
                onClick={() => triggerSOS(selectedType)} 
                className="w-full bg-[#DC2626] text-white font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl uppercase tracking-tighter text-sm"
              >
                Retry Transmission
              </button>
              <button 
                onClick={handleCallHotline} 
                className="w-full bg-white text-[#0A0F0D] font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl uppercase tracking-tighter text-sm flex items-center justify-center gap-3"
              >
                <PhoneCall size={20} /> Call Dispatch
              </button>
            </>
          )}

          {(sosStatus === 'transmitted' || sosStatus === 'acknowledged' || sosStatus === 'resolved') && (
            <button 
               onClick={() => navigate(-1)}
               className="w-full bg-white/10 border border-white/20 text-white font-black py-5 rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-[10px]"
            >
              Dismiss Overlay
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-24 min-h-screen flex flex-col bg-[#0A0F0D]">
       <div className="px-2">
         <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
           Emergency <span className="text-danger-red">Protocol</span>
         </h1>
         <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-1 opacity-60">High-Priority Alert Terminal</p>
       </div>

       <div className="grid gap-4 flex-1">
          {EMERGENCY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setShowConfirmation(true);
              }}
              className="bg-[#1A2E20] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group active:bg-danger-red/10 active:border-danger-red transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-danger-red/10 rounded-2xl flex items-center justify-center text-danger-red group-active:scale-110 transition-transform">
                  <type.icon size={30} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-black uppercase tracking-tight text-sm leading-tight">{type.label}</h3>
                  <p className="text-[#8A9E8F] text-[10px] font-bold uppercase tracking-widest mt-1">{type.subtitle}</p>
                </div>
              </div>
              <ChevronRight size={22} className="text-[#8A9E8F] opacity-20" />
            </button>
          ))}
       </div>

       <button 
         onClick={handleCallHotline}
         className="bg-[#111A15] border border-dashed border-white/10 p-6 rounded-3xl flex items-center justify-between active:bg-white/5 transition-colors"
       >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-gold/10 rounded-xl flex items-center justify-center">
              <PhoneCall size={22} className="text-accent-gold" />
            </div>
            <div className="text-left">
               <p className="text-[9px] uppercase font-black text-[#8A9E8F] tracking-widest">Dispatch Hotline</p>
               <p className="text-white font-mono font-bold tracking-widest text-sm">+254 700 000 000</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-accent-gold opacity-50" />
       </button>

       {/* Confirmation Bottom Sheet */}
       {showConfirmation && (
         <div className="fixed inset-0 z-[110] flex items-end justify-center px-4 pb-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-[#1A2E20] border border-white/10 rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500 shadow-3xl">
             <div className="text-center space-y-3">
               <div className="w-20 h-20 bg-danger-red/20 text-danger-red rounded-full flex items-center justify-center mx-auto mb-2 border border-danger-red/30">
                 <AlertCircle size={40} className="animate-pulse" />
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Confirm Alert?</h3>
               <p className="text-[#8A9E8F] text-xs font-bold leading-relaxed px-4">
                 This will immediately alert HQ and dispatch emergency response for a <span className="text-white">{EMERGENCY_TYPES.find(t => t.id === selectedType)?.label}</span>.
               </p>
             </div>
             <div className="flex flex-col gap-4">
               <button 
                 onClick={() => triggerSOS(selectedType)}
                 className="w-full bg-[#DC2626] text-white font-black py-5 rounded-[1.8rem] active:scale-95 transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] uppercase tracking-tighter text-sm"
               >
                 Confirm — Send SOS
               </button>
               <button 
                 onClick={() => setShowConfirmation(false)}
                 className="w-full bg-white/5 text-[#8A9E8F] font-black py-5 rounded-[1.8rem] active:scale-95 transition-all uppercase tracking-widest text-[10px]"
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default SOSSystem;
