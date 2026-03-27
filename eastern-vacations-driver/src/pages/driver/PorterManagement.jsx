import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, UserPlus, CheckCircle2, XCircle, TrendingUp, History, User } from 'lucide-react';
import toast from 'react-hot-toast';

const PorterManagement = () => {
  const [porters, setPorters] = useState([]);
  const [stats, setStats] = useState({ active: 0, totalTrips: 0 });

  useEffect(() => {
    // Listen to porters assigned to this driver (assuming porter.assignedTo matches current user)
    // Actually, following the project logic, porters might be open and drivers pick them or are assigned.
    // We'll fetch all porters for now to simulate.
    const unsub = onSnapshot(collection(db, 'porters'), (snap) => {
      const pList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPorters(pList);
      setStats({
        active: pList.filter(p => p.status === 'Active').length,
        totalTrips: pList.reduce((acc, curr) => acc + (curr.totalTrips || 0), 0)
      });
    });
    return unsub;
  }, []);

  const togglePorterStatus = async (porterId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDoc(doc(db, 'porters', porterId), { 
        status: nextStatus,
        lastStatusChange: serverTimestamp()
      });
      toast.success(`Porter marked as ${nextStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const incrementTrips = async (porterId) => {
    try {
      await updateDoc(doc(db, 'porters', porterId), { 
        totalTrips: increment(1),
        lastTripAt: serverTimestamp()
      });
      toast.success("Trip credited to porter");
    } catch (err) {
      toast.error("Failed to credit trip");
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
            PORTER <span className="text-accent-gold">UNIT</span>
          </h1>
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Ground Team Management</p>
        </div>
        <button className="w-12 h-12 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl flex items-center justify-center text-accent-gold">
          <UserPlus size={24} />
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden">
            <TrendingUp size={48} className="absolute -right-2 -bottom-2 opacity-5 text-accent-gold" />
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Active Personnel</p>
            <p className="text-3xl font-mono font-black text-white">{stats.active}</p>
         </div>
         <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden">
            <History size={48} className="absolute -right-2 -bottom-2 opacity-5 text-accent-gold" />
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Total Deployments</p>
            <p className="text-3xl font-mono font-black text-white">{stats.totalTrips}</p>
         </div>
      </div>

      {/* Porter List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted px-1 flex items-center gap-2">
          <Users size={14} className="text-accent-gold" />
          Field Personnel
        </h3>

        {porters.length > 0 ? (
          porters.map((porter) => (
            <div key={porter.id} className="bg-surface border border-border p-5 rounded-[2rem] space-y-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center text-accent-gold border border-border/10">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg uppercase tracking-tight">{porter.name}</h4>
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">ID: PRT-{porter.id?.slice(-4).toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePorterStatus(porter.id, porter.status)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${porter.status === 'Active' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger-red/10 text-danger-red border border-danger-red/20'}`}
                >
                  {porter.status || 'Inactive'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-primary-dark rounded-2xl p-4 flex flex-col items-center justify-center">
                   <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Total Trips</p>
                   <p className="text-xl font-mono font-black text-accent-gold">{porter.totalTrips || 0}</p>
                </div>
                <button 
                  onClick={() => incrementTrips(porter.id)}
                  disabled={porter.status !== 'Active'}
                  className="bg-accent-gold text-primary-dark rounded-2xl p-4 flex flex-col items-center justify-center font-black uppercase text-[10px] gap-1 active:scale-95 transition-all disabled:opacity-30"
                >
                  <TrendingUp size={20} />
                  Credit Trip
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-text-muted opacity-30 italic">
            No porters deployed.
          </div>
        )}
      </div>
    </div>
  );
};

export default PorterManagement;
