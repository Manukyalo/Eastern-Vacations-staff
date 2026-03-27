import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { User, LogOut, ShieldCheck, Map, Settings, ChevronRight, Award, Shield } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { driverProfile, driverAuth, role } = useAuth();
  const isSafari = role === 'safari_driver';
  const accentColor = isSafari ? 'text-accent-green' : 'text-accent-gold';
  const bgAccentColor = isSafari ? 'bg-accent-green' : 'bg-accent-gold';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate('/');
    } catch (err) {
      toast.error("Sign out failed");
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24">
       {/* Header */}
       <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 select-none">
              <img src="/logo.png" alt="EV" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
              DRIVER <span className={accentColor}>PROFILE</span>
            </h1>
         </div>
         <div className={`w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center ${accentColor}`}>
           <Settings size={20} />
         </div>
       </div>

       {/* Identity Card */}
       <div className="bg-card border border-border p-8 rounded-[2.5rem] relative overflow-hidden text-center">
         <div className={`absolute top-0 left-0 w-full h-1 ${bgAccentColor}`} />
         
         <div className="relative inline-block mb-4">
           <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-accent-gold/20 p-1">
             <div className="w-full h-full bg-surface rounded-[1.8rem] overflow-hidden">
               {driverAuth?.faceImageUrl ? (
                 <img src={driverAuth.faceImageUrl} alt="Identity" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <User size={40} />
                 </div>
               )}
             </div>
           </div>
           <div className={`absolute -bottom-1 -right-1 w-8 h-8 ${bgAccentColor} rounded-xl border-4 border-primary-dark flex items-center justify-center text-primary-dark shadow-lg`}>
             <ShieldCheck size={16} />
           </div>
         </div>

         <h2 className="text-2xl font-black text-white uppercase tracking-tight">{driverProfile?.name || 'Loading...'}</h2>
         <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.4em] mb-4">{role?.replace('_', ' ')}</p>
         
         <div className="flex justify-center gap-2">
           <StatusBadge status="Verified" />
           <StatusBadge status="Active" />
         </div>
       </div>

       {/* Performance Metrics */}
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col items-center justify-center text-center">
             <Award size={24} className="text-accent-gold mb-2" />
             <p className="text-[10px] font-bold text-text-muted uppercase">Reliability</p>
             <p className="text-xl font-mono font-black text-white">98%</p>
          </div>
          <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col items-center justify-center text-center">
             <Map size={24} className="text-accent-green mb-2" />
             <p className="text-[10px] font-bold text-text-muted uppercase">Coverage</p>
             <p className="text-xl font-mono font-black text-white">4.8k km</p>
          </div>
       </div>

       {/* Settings Menu */}
       <div className="bg-card border border-border rounded-[2rem] overflow-hidden">
          {[
            { label: 'Security & Biometrics', icon: Shield, path: '#' },
            { label: 'Field Manual & Protocol', icon: Map, path: '#' },
            { label: 'System Preferences', icon: Settings, path: '#' },
          ].map((item, idx) => (
            <button 
              key={idx}
              className="w-full p-6 flex items-center justify-between border-b border-white/5 active:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4 text-white font-bold text-sm uppercase tracking-tight">
                <item.icon size={20} className={accentColor} />
                {item.label}
              </div>
              <ChevronRight size={18} className="text-text-muted opacity-30" />
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className="w-full p-6 flex items-center justify-between group active:bg-danger-red/10 transition-colors"
          >
            <div className="flex items-center gap-4 text-danger-red font-black text-sm uppercase tracking-tighter">
              <LogOut size={20} />
              Terminate Session
            </div>
            <p className="text-[10px] text-danger-red font-black uppercase tracking-widest opacity-0 group-active:opacity-100 transition-opacity">Disconnect</p>
          </button>
       </div>

       <p className="text-center text-[10px] text-text-muted uppercase tracking-[0.3em] font-medium opacity-20 py-4">
         Eastern Vacations Systems • v1.0.8 (Alpha)
       </p>
    </div>
  );
};

export default Profile;
