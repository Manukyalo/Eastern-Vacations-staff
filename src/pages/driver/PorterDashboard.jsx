import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  History, 
  User, 
  Zap, 
  MapPin, 
  Clock,
  Briefcase,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const PorterDashboard = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to the porter's document in the 'drivers' collection (role: 'porter')
    const unsub = onSnapshot(doc(db, 'drivers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
      setLoading(false);
    });

    return unsub;
  }, [currentUser]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-primary-dark gap-4">
        <div className="w-12 h-12 border-4 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em]">Synching Operations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-32">
       {/* Header */}
       <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter leading-none">
            PORTER <span className="text-accent-gold">UNIT</span>
          </h1>
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
            <Zap size={10} className="text-accent-gold animate-pulse" />
            Live Deployment Status
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-accent-gold shadow-2xl">
           <User size={24} />
        </div>
      </div>

      {/* Primary Counter */}
      <div className="relative group">
        <div className="absolute inset-0 bg-accent-gold/5 blur-[40px] rounded-full" />
        <div className="relative bg-card border border-border p-8 rounded-[3rem] overflow-hidden">
          <TrendingUp size={120} className="absolute -right-8 -bottom-8 opacity-5 text-accent-gold rotate-12" />
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">Live Trip Balance</p>
            <div className="flex items-baseline gap-2">
               <h2 className="text-7xl font-mono font-black text-white tracking-tighter">
                 {(profile?.totalTrips || 0).toString().padStart(2, '0')}
               </h2>
               <p className="text-xs font-black text-text-muted uppercase">Credits</p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${profile?.status === 'Active' ? 'bg-success animate-pulse' : 'bg-danger-red shadow-[0_0_10px_red]'}`} />
               <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                 Status: <span className={profile?.status === 'Active' ? 'text-success' : 'text-danger-red'}>{profile?.status || 'Inactive'}</span>
               </p>
             </div>
             <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em] italic">Read-only metadata</p>
          </div>
        </div>
      </div>

      {/* Assignment Card */}
      <div className="space-y-4">
         <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-2">Active Assignment</h3>
         
         {profile?.assignedDriverId ? (
           <div className="bg-surface border border-border p-6 rounded-[2.5rem] space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="bg-accent-gold/10 text-accent-gold px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-accent-gold/20">
                  Deployed
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center relative shadow-xl overflow-hidden">
                   {profile?.driverPhoto ? (
                     <img src={profile.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                   ) : (
                     <User size={32} className="text-text-muted opacity-20" />
                   )}
                </div>
                <div>
                  <h4 className="text-white font-black uppercase tracking-tighter text-xl leading-none mb-1">
                    {profile?.assignedDriverName || 'Fleet Driver'}
                  </h4>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} className="text-accent-gold" />
                    Authorized Personnel
                  </p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-dark/50 border border-border/10 p-4 rounded-2xl space-y-1">
                   <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Operation Type</p>
                   <p className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                     <Briefcase size={12} className="text-accent-gold" />
                     {profile?.transferType || 'Logistics'}
                   </p>
                </div>
                <div className="bg-primary-dark/50 border border-border/10 p-4 rounded-2xl space-y-1">
                   <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Start Time</p>
                   <p className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                     <Clock size={12} className="text-accent-gold" />
                     {profile?.deploymentTime ? new Date(profile.deploymentTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                   </p>
                </div>
             </div>
           </div>
         ) : (
           <div className="bg-card border border-dashed border-border p-12 rounded-[2.5rem] text-center space-y-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center mx-auto text-text-muted opacity-30">
                <MapPin size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-white font-black uppercase tracking-widest text-xs">Waiting for Dispatch</p>
                <p className="text-[8px] text-text-muted font-bold uppercase tracking-[0.2em]">Deployment Queue: 04 Personnel Ahead</p>
              </div>
           </div>
         )}
      </div>

      {/* Info Banner */}
      <div className="bg-accent-gold/5 border border-accent-gold/10 p-6 rounded-[2rem] flex items-center justify-between group">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-gold/20 flex items-center justify-center text-accent-gold">
               <History size={20} />
            </div>
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-tight">Trip History</p>
              <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest leading-none">View past deployments</p>
            </div>
         </div>
         <ChevronRight size={18} className="text-accent-gold group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="p-4 text-center">
         <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.4em] opacity-30">
           Eastern Vacations © 2026 Logistic Hub
         </p>
      </div>
    </div>
  );
};

export default PorterDashboard;
