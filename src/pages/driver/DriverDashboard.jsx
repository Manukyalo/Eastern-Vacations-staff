import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { Bell, MapPin, Calendar, Clock, ChevronRight, User, Compass } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useLocation } from '../../context/LocationContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile, role, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const [showPorterModal, setShowPorterModal] = useState(false);
  const [availablePorters, setAvailablePorters] = useState([]);
  const [loadingPorters, setLoadingPorters] = useState(false);

  const today = new Date();
  const todaysTrip = activeBookings.find(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    if (!isValid(bookingDate)) return false;
    return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  const fetchPorters = async () => {
    setLoadingPorters(true);
    try {
      const q = query(collection(db, 'porters'), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      setAvailablePorters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error("Failed to load operations team");
    } finally {
      setLoadingPorters(false);
    }
  };

  const handleCommenceTrip = async (porter) => {
    if (!todaysTrip) return;
    
    const loadingToast = toast.loading("Initializing Deployment...");
    try {
      // 1. Update Trip with Porter Logic
      await updateDoc(doc(db, 'bookings', todaysTrip.id), {
        status: 'Client Picked Up',
        porterId: porter.id,
        porterName: porter.name,
        commencedAt: serverTimestamp()
      });

      // 2. Update Porter's Trip Count
      await updateDoc(doc(db, 'porters', porter.id), {
        totalTrips: increment(1),
        currentDriver: driverProfile?.name || 'Assigned Driver',
        currentTripType: todaysTrip.type || 'Transfer',
        lastTripAt: serverTimestamp()
      });

      toast.success("Deployment Active", { id: loadingToast });
      setShowPorterModal(false);
      navigate(`/driver/trip/${todaysTrip.id}`);
    } catch (e) {
      toast.error("Sync Error", { id: loadingToast });
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 bg-primary-dark min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            {role === 'tour_guide' ? 'CITY' : 'FIELD'} <span className="text-accent-gold">UNIT</span>
          </h1>
          <p className="text-accent-gold font-mono text-[10px] mt-1 uppercase tracking-[0.3em] font-black">
            {role === 'tour_guide' ? 'Professional Tour Guide' : 'Fleet Operations Captain'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden select-none">
            <img src="/logo.png" alt="EV" className="w-full h-full object-contain filter brightness-125" />
          </div>
          <div className={`w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center ${isTracking ? 'text-accent-gold' : 'text-text-muted'}`}>
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="bg-card border border-border p-6 rounded-[2rem] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform duration-1000 ease-out" style={{ transform: `rotate(${currentLocation?.heading || 0}deg)` }}>
           <Compass size={120} className="text-accent-gold" />
         </div>
         <div className="relative z-10">
           <h2 className="text-2xl font-bold text-white mb-1">Jambo, {driverProfile?.name?.split(' ')[0]}</h2>
           <div className="flex items-center gap-2 mt-2">
             <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-success animate-pulse' : 'bg-danger-red'}`} />
             <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">
               {isTracking ? 'Live Telemetry Active' : 'Signal Lost - Reconnecting'}
             </p>
           </div>
         </div>
      </div>

      {/* Today's Assignment */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
          <Clock size={14} className="text-accent-gold" />
          Today's Assignment
        </h3>

        {todaysTrip ? (
          <div className="bg-surface border-l-4 border-l-accent-gold border border-border p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-accent-gold font-mono text-lg font-black">{todaysTrip.timeOfPickup || '08:00 AM'}</p>
                <p className="text-white font-bold text-xl">{todaysTrip.clientName}</p>
              </div>
              <StatusBadge status={todaysTrip.status || 'Assigned'} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-text-muted">
                <MapPin size={16} className="text-accent-gold" />
                <span className="text-sm truncate font-medium">{todaysTrip.destinations}</span>
              </div>
              <div className="flex items-center gap-3 text-text-muted">
                <Calendar size={16} className="text-accent-gold" />
                <span className="text-sm font-medium">{todaysTrip.packageName}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                if (todaysTrip.status === 'Assigned') {
                  fetchPorters();
                  setShowPorterModal(true);
                } else {
                  navigate(`/driver/trip/${todaysTrip.id}`);
                }
              }}
              className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
            >
              {todaysTrip.status === 'Assigned' ? 'SELECT PORTER & START' : 'RESUME OPERATIONS'}
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-dashed border-border p-12 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 opacity-50">
              <Calendar size={32} className="text-text-muted" />
            </div>
            <p className="text-text-muted font-bold text-sm uppercase tracking-widest">No active deployments</p>
            <p className="text-text-muted/60 text-xs mt-1">Stand by for upcoming assignments</p>
          </div>
        )}
      </div>

      {/* Upcoming Trips Row */}
      <div className="space-y-4 pb-24">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2 px-1">
          <ChevronRight size={14} className="text-accent-gold" />
          Upcoming Queue
        </h3>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {activeBookings.filter(b => b.status === 'Confirmed').slice(0, 3).map((trip, idx) => (
            <div key={idx} className="min-w-[280px] bg-card border border-border p-5 rounded-2xl shrink-0">
               <div className="flex justify-between mb-3">
                 <p className="text-accent-gold font-mono text-sm uppercase">{format(new Date(trip.date), 'MMM dd')}</p>
                 <p className="text-text-muted text-xs font-bold uppercase">{trip.timeOfPickup}</p>
               </div>
               <p className="text-white font-black truncate mb-1 uppercase tracking-tight">{trip.clientName}</p>
               <p className="text-text-muted text-[10px] font-medium uppercase tracking-widest truncate">{trip.destinations}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Porter Selection Modal */}
      {showPorterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border p-8 space-y-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Assign <span className="text-accent-gold">Personnel</span></h3>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mt-1">Ground Logistics Team</p>
              </div>
              <button onClick={() => setShowPorterModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted">
                <ChevronRight className="rotate-90" />
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
              {loadingPorters ? (
                <div className="py-12 text-center text-text-muted animate-pulse font-bold text-xs uppercase">Scanning Grid...</div>
              ) : availablePorters.length > 0 ? (
                availablePorters.map((porter) => (
                  <button 
                    key={porter.id}
                    onClick={() => handleCommenceTrip(porter)}
                    className="w-full bg-surface border border-border/50 hover:border-accent-gold p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent-gold/10 rounded-xl flex items-center justify-center text-accent-gold group-hover:bg-accent-gold group-hover:text-primary-dark transition-colors">
                        <User size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm uppercase">{porter.name}</p>
                        <p className="text-text-muted text-[8px] font-black uppercase tracking-tighter">Verified • {porter.totalTrips || 0} Missions</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-accent-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-text-muted italic opacity-50 text-xs">No approved porters currently on duty.</div>
              )}
            </div>

            <button 
              onClick={() => setShowPorterModal(false)}
              className="w-full py-4 text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel Deployment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
