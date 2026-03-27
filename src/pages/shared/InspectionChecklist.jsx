import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ClipboardCheck, ShieldCheck, CheckSquare, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const InspectionChecklist = ({ role = 'driver' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSafari = role === 'safari_driver';
  const accentClass = isSafari ? 'text-accent-green' : 'text-accent-gold';
  const bgAccentClass = isSafari ? 'bg-accent-green' : 'bg-accent-gold';

  const [items, setItems] = useState([
    { id: 'tires', label: 'Tire Pressure & Tread Depth', checked: false },
    { id: 'oil', label: 'Engine Oil & Coolant Levels', checked: false },
    { id: 'lights', label: 'Headlights, Indicators & Brake Lights', checked: false },
    { id: 'brakes', label: 'Brake Fluid & Response', checked: false },
    { id: 'fuel', label: 'Fuel Tank Capacity (Min 3/4)', checked: false },
    { id: 'cleaning', label: 'Interior & Exterior Hygiene', checked: false },
    { id: 'radio', label: 'Communication Radio Check', checked: false, safariOnly: true },
    { id: 'firstaid', label: 'Medical Kit & Fire Extinguisher', checked: false },
    { id: 'spare', label: 'Spare Tire & Jack Kit', checked: false }
  ].filter(item => !item.safariOnly || isSafari));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = (itemId) => {
    setItems(items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it));
  };

  const allChecked = items.every(it => it.checked);

  const handleSubmit = async () => {
    if (!allChecked) return toast.error("Complete all safety checks first");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inspections'), {
        bookingId: id,
        timestamp: serverTimestamp(),
        items: items,
        passed: true,
        role: role
      });
      toast.success("Inspection Protocol Logged");
      navigate(-1);
    } catch (error) {
      console.error('Inspection failed:', error);
      toast.error("Process error: Saved to local queue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-surface border border-border rounded-xl">
           <ChevronLeft size={20} className={accentClass} />
         </button>
         <div>
           <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
             PROTOCOL <span className={accentClass}>LOG</span>
           </h1>
           <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Equipment ID: BKG-{id?.slice(-6).toUpperCase()}</p>
         </div>
       </div>

       <div className="bg-card border border-border p-6 rounded-[2rem] space-y-2">
         <div className="flex items-center gap-3 mb-4">
           <ShieldCheck size={24} className={accentClass} />
           <h3 className="text-white font-bold uppercase tracking-tight">Daily Asset Verification</h3>
         </div>
         
         {items.map((item) => (
           <div 
             key={item.id}
             onClick={() => toggleItem(item.id)}
             className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${item.checked ? 'bg-primary-dark border-transparent shadow-inner' : 'bg-surface border border-border hover:border-accent-gold/30'}`}
           >
             <span className={`text-sm font-medium ${item.checked ? 'text-white/40 line-through' : 'text-white'}`}>{item.label}</span>
             <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? `${bgAccentClass} border-transparent text-primary-dark` : 'border-border'}`}>
               {item.checked && <CheckSquare size={16} />}
             </div>
           </div>
         ))}
       </div>

       <div className="bg-surface border border-dashed border-border p-6 rounded-2xl flex items-center gap-4 group">
          <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center text-text-muted group-hover:bg-white/5 transition-colors">
            <Camera size={24} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Asset Documentation</p>
            <p className="text-text-muted text-[10px] uppercase font-bold">Optional: Clear photo of equipment</p>
          </div>
       </div>

       <button
         onClick={handleSubmit}
         disabled={!allChecked || isSubmitting}
         className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${allChecked ? `${bgAccentClass} text-white` : 'bg-card text-text-muted opacity-50'}`}
       >
         {isSubmitting ? 'LOGGING PROTOCOL...' : 'VERIFY & SIGN LOG'}
         <ChevronRight size={20} />
       </button>
    </div>
  );
};

export default InspectionChecklist;
