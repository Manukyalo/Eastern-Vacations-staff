import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../../context/DriverContext';
import { Map, Compass, ChevronRight, Filter, Search } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const SafariTrips = () => {
  const navigate = useNavigate();
  const { activeBookings } = useDriver();

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24 bg-primary-dark">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            EXPEDITION <span className="text-accent-green">QUEUE</span>
          </h1>
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Field Deployments</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green/50" size={18} />
        <input 
          type="text" 
          placeholder="Lookup Expedition Name..." 
          className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none text-sm font-medium"
        />
      </div>

      <div className="space-y-4">
        {activeBookings.length > 0 ? (
          activeBookings.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => navigate(`/safari/trip/${trip.id}`)}
              className="bg-card border border-accent-green/10 p-6 rounded-[2rem] hover:border-accent-green/30 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-accent-green/10 rounded-lg flex items-center justify-center text-accent-green">
                     <Map size={16} />
                   </div>
                   <span className="text-accent-green font-mono text-xs uppercase font-bold tracking-widest">{format(new Date(trip.date), 'MMM dd')}</span>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{trip.clientName}</h3>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mt-1 truncate">{trip.packageName}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                 <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
                   <Compass size={14} className="text-accent-green" />
                   {trip.pax} Guests
                 </div>
                 <div className="text-accent-green flex items-center gap-1 text-[10px] font-black uppercase">
                   Mission Data <ChevronRight size={14} />
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-text-muted italic opacity-30">
            Stand by. No expeditions queued.
          </div>
        )}
      </div>
    </div>
  );
};

export default SafariTrips;
