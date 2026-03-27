import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { useLocation } from '../../context/LocationContext';
import { Bell, Map as MapIcon, Compass, Anchor, ChevronRight, Zap } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import SOSButton from '../../components/ui/SOSButton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SafariDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const today = new Date();
  const todaysSafari = activeBookings.find(b => format(new Date(b.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 bg-primary-dark">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            EXPEDITION <span className="text-accent-green">CMD</span>
          </h1>
          <p className="text-accent-green font-mono text-xs mt-1 uppercase tracking-widest">
            OPERATIONAL — {format(today, 'HH:mm')}
          </p>
        </div>
        <div className="w-12 h-12 bg-card border border-accent-green/20 rounded-xl flex items-center justify-center text-accent-green">
          <Zap size={24} className={isTracking ? "animate-pulse" : "opacity-30"} />
        </div>
      </div>

      {/* Tracking Card */}
      <div className="bg-card border border-accent-green/20 p-6 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Compass size={120} className="text-accent-green" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-success animate-ping' : 'bg-danger-red'}`} />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">GPS TELEMETRY</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-text-muted text-[10px] uppercase font-bold mb-1">LATITUDE</p>
              <p className="font-mono text-lg text-white font-bold">{currentLocation?.latitude?.toFixed(4) || '-1.2921'}</p>
            </div>
            <div>
              <p className="text-text-muted text-[10px] uppercase font-bold mb-1">LONGITUDE</p>
              <p className="font-mono text-lg text-white font-bold">{currentLocation?.longitude?.toFixed(4) || '36.8219'}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
             <div className="px-3 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg text-accent-green text-[10px] font-black uppercase">
               Maasai Mara Boundary
             </div>
             <div className="px-3 py-1 bg-white/5 rounded-lg text-text-muted text-[10px] font-bold uppercase">
               Battery: {currentLocation?.batteryLevel || 100}%
             </div>
          </div>
        </div>
      </div>

      {/* Active Expedition */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
          <Anchor size={14} className="text-accent-green" />
          Active Expedition
        </h3>

        {todaysSafari ? (
          <div className="bg-surface border border-accent-green/10 p-6 rounded-3xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-black text-2xl tracking-tight mb-1">{todaysSafari.clientName}</p>
                <div className="flex items-center gap-2 text-accent-green uppercase font-bold text-[10px] tracking-widest">
                  <MapIcon size={12} />
                  {todaysSafari.packageName}
                </div>
              </div>
              <StatusBadge status={todaysSafari.status} />
            </div>

            <div className="py-4 border-y border-white/5 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-text-muted text-[10px] uppercase font-bold mb-1">PAX</p>
                  <p className="text-white font-bold">{todaysSafari.pax} GUESTS</p>
               </div>
               <div>
                  <p className="text-text-muted text-[10px] uppercase font-bold mb-1">VEHICLE</p>
                  <p className="text-white font-bold">KDL 890X</p>
               </div>
            </div>

            <button className="w-full bg-accent-green text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_20px_rgba(45,106,79,0.3)]">
              ACCESS MISSION DATA
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-dashed border-border/20 p-12 rounded-[2rem] text-center">
            <p className="text-text-muted font-bold text-sm uppercase tracking-widest">No Active Expedition</p>
          </div>
        )}
      </div>

      <SOSButton onTrigger={() => navigate('/safari/sos')} />

      <p className="text-[10px] text-center text-text-muted uppercase tracking-[0.3em] font-medium opacity-20">
        Secure Handheld Operations Terminal
      </p>
    </div>
  );
};

export default SafariDashboard;
