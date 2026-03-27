import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { Bell, MapPin, Calendar, Clock, ChevronRight, User } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { format, isValid } from 'date-fns';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile } = useAuth();
  const { activeBookings, stats } = useDriver();

  const today = new Date();
  const todaysTrip = activeBookings.find(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    if (!isValid(bookingDate)) return false;
    return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            FIELD <span className="text-accent-gold">UNIT</span>
          </h1>
          <p className="text-accent-gold font-mono text-xs mt-1 uppercase tracking-widest">
            {format(today, 'EEEE, MMM do yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden select-none">
            <img src="/logo.png" alt="EV" className="w-full h-full object-contain" />
          </div>
          <div className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center text-accent-gold">
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="bg-card border border-border p-6 rounded-[2rem] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5">
           <User size={120} />
         </div>
         <div className="relative z-10">
           <h2 className="text-2xl font-bold text-white mb-1">Jambo, {driverProfile?.name?.split(' ')[0]}</h2>
           <p className="text-text-muted text-sm">Unit status: <span className="text-success font-bold uppercase">Ready for Deployment</span></p>
         </div>
         
         <div className="grid grid-cols-3 gap-4 mt-6">
           <div 
             onClick={() => navigate('/driver/porters')}
             className="bg-surface p-3 rounded-2xl border border-border cursor-pointer active:scale-95 transition-all"
           >
             <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Porters</p>
             <p className="font-mono text-xl text-accent-gold">{(stats.portersCount || 0)}</p>
           </div>
           <div className="bg-surface p-3 rounded-2xl border border-border">
             <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Rating</p>
             <p className="font-mono text-xl text-accent-gold">{stats.rating}</p>
           </div>
           <div className="bg-surface p-3 rounded-2xl border border-border">
             <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Alerts</p>
             <p className="font-mono text-xl text-danger-red">0</p>
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

            <button className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
              COMMENCE TRIP
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
    </div>
  );
};

export default DriverDashboard;
