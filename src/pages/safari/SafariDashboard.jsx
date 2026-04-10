import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { useLocation } from '../../context/LocationContext';
import { 
  Bell, MapPin, Compass, Anchor, ChevronRight, Zap, 
  Users, Calendar, Clock, Tent, Car, ShieldCheck, AlertTriangle,
  Package
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import SOSButton from '../../components/ui/SOSButton';
import { NetworkStatusBadge } from '../../components/NetworkStatusBadge';
import { format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SafariDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const today = new Date();
  const todaysSafari = activeBookings.find(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    if (!isValid(bookingDate)) return false;
    return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  // Upcoming confirmed bookings (not today)
  const upcomingBookings = activeBookings
    .filter(b => b.status === 'Confirmed' && b !== todaysSafari)
    .slice(0, 4);

  const getPaymentColor = (status) => {
    if (status === 'Fully Paid') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'Partially Paid') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  return (
    <div className="p-5 pt-12 space-y-7 animate-in fade-in duration-700 bg-primary-dark min-h-screen">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-start px-1">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            FIELD <span className="text-accent-green">EXPEDITION</span>
          </h1>
          <p className="text-accent-green font-mono text-[10px] mt-1 uppercase tracking-[0.2em] font-bold">
            {format(today, 'EEEE, MMM do yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden select-none">
            <img src="/logo.png" alt="EV" className="w-full h-full object-contain filter brightness-125" />
          </div>
          <div className={`w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center ${isTracking ? 'text-accent-green' : 'text-text-muted'}`}>
            <MapPin size={20} />
          </div>
        </div>
      </div>

      {/* ── GPS Telemetry Card ── */}
      <div className="bg-card border border-accent-green/20 p-5 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10" style={{ transform: `rotate(${currentLocation?.heading || 0}deg)` }}>
          <Compass size={100} className="text-accent-green" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">GPS TELEMETRY</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-text-muted text-[9px] uppercase font-bold mb-1">LATITUDE</p>
              <p className="font-mono text-base text-white font-bold">{currentLocation?.latitude?.toFixed(4) || '-1.2921'}</p>
            </div>
            <div>
              <p className="text-text-muted text-[9px] uppercase font-bold mb-1">LONGITUDE</p>
              <p className="font-mono text-base text-white font-bold">{currentLocation?.longitude?.toFixed(4) || '36.8219'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
             <div className="px-3 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg text-accent-green text-[9px] font-black uppercase">
               Field Unit Active
             </div>
             <div className="px-3 py-1 bg-white/5 rounded-lg text-text-muted text-[9px] font-bold uppercase">
               Battery: {currentLocation?.batteryLevel || 100}%
             </div>
             {currentUser?.uid && (
               <NetworkStatusBadge driverId={currentUser.uid} />
             )}
           </div>
        </div>
      </div>

      {/* ── Today's Mission Brief ── */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted flex items-center gap-2 px-1">
          <Anchor size={13} className="text-accent-green" />
          Active Expedition
        </h3>

        {todaysSafari ? (
          <div className="bg-surface border border-accent-green/15 rounded-3xl overflow-hidden">
            
            {/* Booking Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-start">
              <div>
                <p className="text-white font-black text-2xl tracking-tight leading-tight">{todaysSafari.clientName}</p>
                <div className="flex items-center gap-1.5 text-accent-green mt-1">
                  <Package size={11} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{todaysSafari.packageName || 'Custom Safari'}</span>
                </div>
              </div>
              <StatusBadge status={todaysSafari.status} />
            </div>

            {/* Itinerary Grid */}
            <div className="grid grid-cols-2 gap-px bg-white/5">
              
              {/* Destinations */}
              <div className="bg-surface p-4 col-span-2">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-1.5 flex items-center gap-1">
                  <MapPin size={10} /> Destinations
                </p>
                <p className="text-white font-bold text-sm leading-relaxed">
                  {todaysSafari.destinations || todaysSafari.location || 'Parks & Reserves TBD'}
                </p>
              </div>

              {/* Duration */}
              <div className="bg-surface p-4">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-1">
                  <Clock size={10} className="inline mr-1" />Duration
                </p>
                <p className="text-white font-bold text-sm">{todaysSafari.durationText || '—'}</p>
              </div>

              {/* Date */}
              <div className="bg-surface p-4">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-1">
                  <Calendar size={10} className="inline mr-1" />Departs
                </p>
                <p className="text-white font-bold text-sm">
                  {todaysSafari.date ? format(new Date(todaysSafari.date), 'MMM dd, yyyy') : '—'}
                </p>
              </div>

              {/* Pax */}
              <div className="bg-surface p-4">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-1">
                  <Users size={10} className="inline mr-1" />Guests
                </p>
                <p className="text-white font-bold">
                  {typeof todaysSafari.pax === 'object'
                    ? `${todaysSafari.pax.adults || 0}A ${todaysSafari.pax.children > 0 ? `· ${todaysSafari.pax.children}C` : ''}`
                    : `${todaysSafari.pax || 1} guests`
                  }
                </p>
              </div>

              {/* Vehicle */}
              <div className="bg-surface p-4">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-1">
                  <Car size={10} className="inline mr-1" />Vehicle
                </p>
                <p className="text-white font-bold text-sm truncate">
                  {todaysSafari.vehicleId || 'Assigned by HQ'}
                </p>
              </div>

              {/* Payment Status */}
              <div className="bg-surface p-4 col-span-2">
                <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mb-2">
                  <ShieldCheck size={10} className="inline mr-1" />Payment Status
                </p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPaymentColor(todaysSafari.paymentStatus)}`}>
                  {todaysSafari.paymentStatus === 'Fully Paid'
                    ? <ShieldCheck size={10} /> 
                    : <AlertTriangle size={10} />}
                  {todaysSafari.paymentStatus || 'Unpaid'}
                </span>
              </div>
            </div>

            {/* Access Button */}
            <div className="p-5">
              <button 
                onClick={() => navigate(`/safari/trip/${todaysSafari.id}`)}
                className="w-full bg-accent-green text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_20px_rgba(45,106,79,0.3)]"
              >
                ACCESS MISSION DATA
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-dashed border-border/20 p-12 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <Tent size={36} className="text-text-muted opacity-30 mb-3" />
            <p className="text-text-muted font-bold text-sm uppercase tracking-widest">No Active Expedition</p>
            <p className="text-text-muted/50 text-[10px] mt-1 font-medium">Stand by for incoming mission brief</p>
          </div>
        )}
      </div>

      {/* ── Upcoming Bookings Queue ── */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-3 pb-24">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted flex items-center gap-2 px-1">
            <ChevronRight size={13} className="text-accent-green" />
            Upcoming Queue
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {upcomingBookings.map((trip, idx) => (
              <div key={idx} className="min-w-[260px] bg-card border border-border p-5 rounded-2xl shrink-0 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-accent-green font-mono text-sm font-black uppercase">
                    {trip.date ? format(new Date(trip.date), 'MMM dd') : '—'}
                  </p>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="text-white font-black truncate uppercase tracking-tight">{trip.clientName}</p>
                <p className="text-text-muted text-[10px] font-medium uppercase tracking-widest truncate">
                  {trip.packageName || trip.destinations || 'Package TBD'}
                </p>
                <div className="flex items-center gap-1.5 text-text-muted/60">
                  <Users size={10} />
                  <span className="text-[9px] font-bold">
                    {typeof trip.pax === 'object' 
                      ? `${trip.pax.adults || 0} Adults` 
                      : `${trip.pax || 1} guests`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pb-6">
        <SOSButton onTrigger={() => navigate('/safari/sos')} />
      </div>

      <p className="text-[9px] text-center text-text-muted uppercase tracking-[0.3em] font-medium opacity-20 pb-4">
        Secure Handheld Operations Terminal
      </p>
    </div>
  );
};

export default SafariDashboard;
