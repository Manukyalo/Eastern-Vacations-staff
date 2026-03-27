import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { MapPin, Phone, MessageSquare, Fuel, Clipboard, Camera, User, BadgeAlert } from 'lucide-react';
import TripStatusBar from '../../components/trips/TripStatusBar';
import toast from 'react-hot-toast';

const DriverTripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'bookings', id), (docSnap) => {
      if (docSnap.exists()) {
        setTrip({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return unsub;
  }, [id]);

  const advanceStatus = async () => {
    const steps = ['Assigned', 'Acknowledged', 'En Route', 'Client Picked Up', 'In Transit', 'Trip Complete'];
    const currentIdx = steps.indexOf(trip.status || 'Assigned');
    
    if (currentIdx === steps.length - 1) return;

    const nextStatus = steps[currentIdx + 1];
    
    setIsUpdating(true);
    try {
      // 1. Update Booking Status
      await updateDoc(doc(db, 'bookings', trip.id), { status: nextStatus });

      // 2. Log to tripUpdates
      await addDoc(collection(db, `tripUpdates/${trip.id}/updates`), {
        status: nextStatus,
        timestamp: serverTimestamp(),
        driverId: trip.driverId,
        note: `Status advanced to ${nextStatus}`
      });

      // 3. Notify Admin (This would usually be a cloud function, but writing to notifications collection here as requested)
      await addDoc(collection(db, 'notifications'), {
        title: `Trip Status: ${nextStatus}`,
        message: `${trip.driverName || 'Driver'} advanced status for ${trip.clientName}`,
        type: 'INFO',
        targetRole: 'both',
        date: serverTimestamp()
      });

      toast.success(`Status: ${nextStatus}`);
    } catch (err) {
      toast.error("Status update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!trip) return <div className="p-12 text-center text-text-muted">Loading mission data...</div>;

  return (
    <div className="p-6 pt-12 space-y-8 animate-in slide-in-from-right-8 duration-500 pb-32">
       {/* Header */}
       <div className="flex justify-between items-center">
         <button onClick={() => navigate(-1)} className="text-accent-gold font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <MapPin size={14} /> Back to Field
         </button>
         <p className="text-text-muted font-mono text-xs uppercase">BKG-{trip.id?.slice(-6).toUpperCase()}</p>
       </div>

       {/* Status Stepper */}
       <div className="bg-surface rounded-3xl p-4 border border-border">
         <TripStatusBar currentStatus={trip.status || 'Assigned'} />
       </div>

       {/* Trip Content */}
       <div className="bg-card border border-border p-6 rounded-[2rem] space-y-6">
          <div>
            <h2 className="text-3xl font-heading font-black text-white px-1">{trip.clientName}</h2>
            <div className="flex gap-2 mt-2">
               <div className="bg-accent-gold/10 text-accent-gold py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest">
                 {trip.type || 'Transfer'}
               </div>
               <div className="bg-white/5 text-text-muted py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest">
                 {trip.pax} Pax
               </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="flex gap-4">
               <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent-gold shrink-0">
                 <Clock size={20} />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-text-muted">Deployment Time</p>
                 <p className="text-white font-bold">{trip.timeOfPickup}</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent-gold shrink-0">
                 <MapPin size={20} />
               </div>
               <div className="overflow-hidden">
                 <p className="text-[10px] uppercase font-bold text-text-muted">Operational Grid</p>
                 <p className="text-white font-bold truncate">{trip.destinations}</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent-gold shrink-0">
                 <BadgeAlert size={20} />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-text-muted">Equipment Assignment</p>
                 <p className="text-white font-bold">Vehicle: {trip.vehicleId || 'UNASSIGNED'}</p>
               </div>
             </div>
          </div>
       </div>

       {/* Action Grid */}
       <div className="grid grid-cols-2 gap-4">
          <button className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-accent-gold/10 transition-colors">
            <Phone size={24} className="text-accent-gold" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Contact Dispatch</span>
          </button>
          <button className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-accent-gold/10 transition-colors">
            <MessageSquare size={24} className="text-accent-gold" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Field Chat</span>
          </button>
          <button onClick={() => navigate(`/driver/inspection/${trip.id}`)} className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-accent-gold/10 transition-colors">
            <Clipboard size={24} className="text-accent-gold" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Equipment Log</span>
          </button>
          <button className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-accent-gold/10 transition-colors">
            <Fuel size={24} className="text-accent-gold" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Log Expense</span>
          </button>
       </div>

       {/* Deployment Controls */}
       <button 
         onClick={advanceStatus}
         disabled={isUpdating}
         className="fixed bottom-24 left-6 right-6 bg-accent-gold text-primary-dark font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(201,168,76,0.3)] active:scale-95 transition-all z-40 disabled:opacity-50"
       >
         {isUpdating ? 'SYNCHRONIZING...' : `EXECUTE: ${
           trip.status === 'Assigned' ? 'ACKNOWLEDGE' : 
           trip.status === 'Acknowledged' ? 'EN ROUTE' :
           trip.status === 'En Route' ? 'PICKUP CLIENT' :
           trip.status === 'Client Picked Up' ? 'COMMENCE TRANSIT' :
           trip.status === 'In Transit' ? 'COMPLETION' : 'TRIP ARCHIVED'
         }`}
       </button>
    </div>
  );
};

export default DriverTripDetail;
