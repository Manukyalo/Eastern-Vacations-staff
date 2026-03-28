import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  User, LogOut, ShieldCheck, Map, Settings, ChevronRight, 
  Award, Shield, Calendar, Bell, Globe, Lock, History, 
  BookOpen, Info, CheckCircle2, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import LocationEngine from '../../engine/LocationEngine';
import toast from 'react-hot-toast';

const ManualContent = [
  { title: "Emergency Protocols", content: "In any life-threatening situation, trigger the SOS signal immediately. Maintain radio silence and stay with the vehicle if safe. HQ is notified instantly of your GPS position." },
  { title: "Park Rules", content: "Always maintain a distance of 25 meters from wildlife. Never exit the vehicle except in designated areas. Off-roading is strictly prohibited in National Parks." },
  { title: "Client Handling", content: "Professionalism is paramount. Ensure guests have enough water and are informed about the itinerary. Your role is primarily safety and interpretation." },
  { title: "Vehicle Breakdown", content: "Secure the vehicle. Notify HQ via Field Protocol. Keep clients informed and calm. Do not attempt major repairs in open wildlife areas." }
];

const Profile = () => {
  const navigate = useNavigate();
  const { driverProfile, driverAuth, role, currentUser } = useAuth();
  const isSafari = role === 'safari_driver';
  
  const [activeModal, setActiveModal] = useState(null); // 'security', 'manual', 'prefs', 'logout'
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Stats Logic
  const tripsCount = driverProfile?.trips ?? 0;
  const memberSince = driverAuth?.registeredAt 
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(driverAuth.registeredAt.toDate())
    : 'March 2026';

  const accentColor = isSafari ? 'text-accent-green' : 'text-accent-gold';
  const bgAccentColor = isSafari ? 'bg-accent-green' : 'bg-accent-gold';

  const handleLogout = async () => {
    try {
      setIsUpdating(true);
      // 1. Stop Tracking
      LocationEngine.stop();
      
      // 2. Clear Online Status
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'driverLocations', currentUser.uid), {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }

      // 3. Sign Out
      await signOut(auth);
      toast.success("Safe expedition. Signed out.");
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Sign-out failed');
    } finally {
      setIsUpdating(false);
      setActiveModal(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.new || passwords.new.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }

    try {
      setIsUpdating(true);
      const credential = EmailAuthProvider.credential(currentUser.email, passwords.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwords.new);
      toast.success("Security credentials updated");
      setPasswords({ current: '', new: '' });
      setActiveModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to update security");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24 min-h-screen bg-[#0A0F0D]">
       {/* Header */}
       <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 select-none bg-white/5 p-2 rounded-xl backdrop-blur-md border border-white/5">
              <img src="/logo.png" alt="EV" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tighter">
              Expedition <span className={accentColor}>Account</span>
            </h1>
         </div>
         <button 
           onClick={() => setActiveModal('prefs')}
           className={`w-12 h-12 bg-[#1A2E20] border border-white/5 rounded-2xl flex items-center justify-center ${accentColor} shadow-lg active:scale-95 transition-all`}
         >
           <Settings size={22} />
         </button>
       </div>

       {/* Identity Card */}
       <div className="bg-[#1A2E20] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden text-center shadow-2xl">
         <div className={`absolute top-0 left-0 w-full h-1.5 ${bgAccentColor} opacity-50`} />
         
         <div className="relative inline-block mb-6">
           <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-[3px] border-white/10 p-1.5 shadow-2xl bg-[#111A15]">
             <div className="w-full h-full bg-[#0A0F0D] rounded-[2rem] overflow-hidden grayscale-0 hover:grayscale transition-all duration-500">
               {driverAuth?.faceImageUrl ? (
                 <img src={driverAuth.faceImageUrl} alt="Identity" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-[#8A9E8F]">
                    <User size={48} />
                 </div>
               )}
             </div>
           </div>
           <div className={`absolute -bottom-1 -right-1 w-10 h-10 ${bgAccentColor} rounded-2xl border-4 border-[#1A2E20] flex items-center justify-center text-[#0A0F0D] shadow-xl`}>
             <ShieldCheck size={20} />
           </div>
         </div>

         <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tight leading-none mb-1">{driverProfile?.name || 'Authorized Staff'}</h2>
         <p className="text-[#8A9E8F] text-[9px] font-black uppercase tracking-[0.5em] mb-6">{role?.replace('_', ' ')} unit</p>
         
         <div className="flex justify-center gap-3">
           <StatusBadge status="Verified" />
           <StatusBadge status="Active" />
         </div>
       </div>

       {/* Real Performance Metrics */}
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111A15] border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all">
             <div className="w-12 h-12 bg-accent-gold/10 rounded-2xl flex items-center justify-center text-accent-gold mb-4">
                <Award size={26} />
             </div>
             <p className="text-[9px] font-black text-[#8A9E8F] uppercase tracking-widest mb-1.5">Trips Completed</p>
             <p className="text-2xl font-mono font-black text-white">{tripsCount}</p>
          </div>
          <div className="bg-[#111A15] border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all">
             <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green mb-4">
                <Calendar size={26} />
             </div>
             <p className="text-[9px] font-black text-[#8A9E8F] uppercase tracking-widest mb-1.5">Member Since</p>
             <p className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">{memberSince}</p>
          </div>
       </div>

       {/* Menu Control Center */}
       <div className="bg-[#1A2E20] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {[
            { label: 'Security & Biometrics', icon: Shield, id: 'security' },
            { label: 'Field Manual & Protocol', icon: BookOpen, id: 'manual' },
            { label: 'System Preferences', icon: Settings, id: 'prefs' },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveModal(item.id)}
              className="w-full p-7 flex items-center justify-between border-b border-white/5 active:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${accentColor}`}>
                   <item.icon size={22} />
                </div>
                <div className="text-left">
                  <span className="text-white font-black text-xs uppercase tracking-tight block">{item.label}</span>
                  <span className="text-[#8A9E8F] text-[8px] font-bold uppercase tracking-widest mt-0.5">Connected</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8A9E8F] opacity-30" />
            </button>
          ))}
          
          <button 
            onClick={() => setActiveModal('logout')}
            className="w-full p-7 flex items-center justify-between group active:bg-[#DC2626]/10 transition-all"
          >
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#DC2626]/10 text-danger-red group-active:scale-110 transition-transform">
                   <LogOut size={22} />
                </div>
                <div className="text-left">
                  <span className="text-danger-red font-black text-xs uppercase tracking-tight block">Terminate Session</span>
                  <span className="text-danger-red/50 text-[8px] font-bold uppercase tracking-widest mt-0.5">Security Logout</span>
                </div>
            </div>
            <AlertTriangle size={18} className="text-[#DC2626] opacity-0 group-active:opacity-100 transition-opacity" />
          </button>
       </div>

       {/* Generic Modal Manager */}
       {activeModal && (
         <div className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-[#1A2E20] border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl animate-in slide-in-from-bottom-full duration-500">
             
             {/* Modal Header */}
             <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${accentColor}`}>
                      {activeModal === 'security' && <Shield size={24} />}
                      {activeModal === 'manual' && <BookOpen size={24} />}
                      {activeModal === 'prefs' && <Settings size={24} />}
                      {activeModal === 'logout' && <LogOut size={24} className="text-danger-red" />}
                   </div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">
                     {activeModal === 'security' && 'ID Security'}
                     {activeModal === 'manual' && 'Expedition Manual'}
                     {activeModal === 'prefs' && 'System Config'}
                     {activeModal === 'logout' && 'Close Session'}
                   </h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#8A9E8F]">
                   <ChevronRight size={20} className="rotate-90" />
                </button>
             </div>

             {/* Modal Body */}
             <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
               
               {activeModal === 'security' && (
                 <div className="space-y-8">
                    <div className="flex items-center justify-between p-5 bg-[#111A15] rounded-3xl border border-white/5">
                       <div className="flex items-center gap-4">
                          <ShieldCheck className="text-accent-green" size={32} />
                          <div>
                             <p className="text-white font-black text-xs uppercase tracking-tight">Face ID Status</p>
                             <p className="text-accent-green text-[9px] font-black uppercase tracking-widest">Active & Verified ✓</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => navigate('/safari/face-scan', { state: { reVerify: true }})}
                         className="bg-white/5 px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest active:bg-white/10"
                       >
                         Update
                       </button>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                       <p className="text-[10px] text-[#8A9E8F] font-black uppercase tracking-widest px-2">Change Account Password</p>
                       <div className="space-y-3">
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Current Password"
                              className="w-full bg-[#111A15] border border-white/10 rounded-2xl py-5 px-6 text-white text-sm outline-none focus:border-accent-gold transition-all"
                              value={passwords.current}
                              onChange={e => setPasswords({...passwords, current: e.target.value})}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8A9E8F]"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <input 
                            type="password" 
                            placeholder="New Secure Password"
                            className="w-full bg-[#111A15] border border-white/10 rounded-2xl py-5 px-6 text-white text-sm outline-none focus:border-accent-gold transition-all"
                            value={passwords.new}
                            onChange={e => setPasswords({...passwords, new: e.target.value})}
                          />
                       </div>
                       <button 
                         disabled={isUpdating}
                         className="w-full bg-white text-[#0A0F0D] font-black py-5 rounded-[1.8rem] uppercase tracking-tighter text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
                       >
                         {isUpdating ? 'Securing...' : 'Update Credentials'}
                       </button>
                    </form>

                    <div className="space-y-4">
                       <p className="text-[10px] text-[#8A9E8F] font-black uppercase tracking-widest px-2">Device Trust History</p>
                       <div className="space-y-2 opacity-50">
                          {[1,2].map(i => (
                            <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 p-4 rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <History size={14} />
                                  <span className="font-bold">Authorized Session • Android PWA</span>
                               </div>
                               <span className="font-mono">15:32</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {activeModal === 'manual' && (
                 <div className="space-y-6">
                    {ManualContent.map((item, i) => (
                      <div key={i} className="bg-[#111A15] p-6 rounded-3xl border border-white/5 space-y-2">
                         <div className="flex items-center gap-3 text-accent-gold">
                            <Info size={18} />
                            <h4 className="font-black text-xs uppercase tracking-tight">{item.title}</h4>
                         </div>
                         <p className="text-[#8A9E8F] text-[11px] font-medium leading-relaxed italic">"{item.content}"</p>
                      </div>
                    ))}
                    <div className="text-center py-4 bg-accent-green/5 rounded-2xl border border-accent-green/10">
                       <p className="text-[9px] font-black text-accent-green uppercase tracking-[0.2em] mb-1 flex items-center justify-center gap-2">
                         <CheckCircle2 size={12} /> Offline Mode Enabled
                       </p>
                       <p className="text-[#8A9E8F] text-[8px] font-bold uppercase">Critical data stored for bush access</p>
                    </div>
                 </div>
               )}

               {activeModal === 'prefs' && (
                 <div className="space-y-8">
                   <div className="space-y-3">
                      <div className="flex items-center justify-between p-6 bg-[#111A15] rounded-3xl">
                         <div className="flex items-center gap-4">
                            <Bell className={accentColor} size={22} />
                            <span className="text-white font-black text-xs uppercase tracking-tight">Push Alerts</span>
                         </div>
                         <div className="w-12 h-6 bg-accent-green rounded-full relative flex items-center px-1">
                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm" />
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-[#111A15] rounded-3xl">
                         <div className="flex items-center gap-4">
                            <Map className={accentColor} size={22} />
                            <span className="text-white font-black text-xs uppercase tracking-tight">Geo-Logging</span>
                         </div>
                         <div className="w-12 h-6 bg-accent-green rounded-full relative flex items-center px-1">
                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm" />
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-[#111A15] rounded-3xl">
                         <div className="flex items-center gap-4">
                            <Globe className={accentColor} size={22} />
                            <span className="text-white font-black text-xs uppercase tracking-tight">Language</span>
                         </div>
                         <span className="text-accent-gold font-black text-[10px] uppercase">EN / SW</span>
                      </div>
                   </div>

                   <div className="text-center space-y-2">
                       <p className="text-[9px] text-[#8A9E8F] font-black uppercase tracking-[0.4em]">Eastern Vacations Systems</p>
                       <p className="text-[8px] text-[#8A9E8F] font-bold uppercase opacity-30 tracking-widest">v1.0.8-ALPHA • ENCRYPTION: AES-256</p>
                   </div>
                 </div>
               )}

               {activeModal === 'logout' && (
                 <div className="space-y-8 text-center">
                    <div className="w-24 h-24 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto text-danger-red border border-[#DC2626]/20">
                       <AlertTriangle size={48} className="animate-pulse" />
                    </div>
                    <div className="space-y-2 px-4">
                       <h4 className="text-white font-black text-2xl uppercase tracking-tight">Wait, Driver!</h4>
                       <p className="text-[#8A9E8F] text-sm font-medium leading-relaxed">
                          Terminating your session will stop **Real-time Geo-Tracking**. Dispatch will no longer see your position in the field.
                       </p>
                    </div>
                    <div className="flex flex-col gap-3">
                       <button 
                         onClick={handleLogout}
                         disabled={isUpdating}
                         className="w-full bg-[#DC2626] text-white font-black py-5 rounded-[1.8rem] uppercase tracking-tighter text-sm shadow-[0_10px_30px_rgba(220,38,38,0.3)] active:scale-95 transition-all"
                       >
                         {isUpdating ? 'Closing Transmission...' : 'Terminate Session'}
                       </button>
                       <button 
                         onClick={() => setActiveModal(null)}
                         className="w-full bg-white/5 text-[#8A9E8F] font-black py-5 rounded-[1.8rem] uppercase tracking-widest text-[10px]"
                       >
                         Stay Online
                       </button>
                    </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       <p className="text-center text-[10px] text-[#8A9E8F] uppercase tracking-[0.4em] font-medium opacity-20 py-4">
         Eastern Vacations Systems • Internal Operations
       </p>
    </div>
  );
};

export default Profile;
