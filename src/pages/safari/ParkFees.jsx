import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Landmark, Map, Camera, Send, ChevronLeft, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const ParkFees = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parkName: 'Maasai Mara',
    amount: '',
    ticketNumber: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parks = ['Maasai Mara', 'Amboseli', 'Tsavo East', 'Tsavo West', 'Nairobi National Park', 'Lake Nakuru', 'Samburu'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !image || !formData.ticketNumber) {
      return toast.error("All fields and Ticket photo are required");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Logging park entry data...");

    try {
      const ticketRef = ref(storage, `parkTickets/${id}/${Date.now()}_${image.name}`);
      await uploadBytes(ticketRef, image);
      const imageUrl = await getDownloadURL(ticketRef);

      await addDoc(collection(db, 'park_fees'), {
        bookingId: id,
        parkName: formData.parkName,
        amount: parseFloat(formData.amount),
        ticketNumber: formData.ticketNumber,
        ticketImageUrl: imageUrl,
        timestamp: serverTimestamp(),
        verified: false
      });

      toast.success("Park Entry Logged", { id: toastId });
      navigate(-1);
    } catch (err) {
      toast.error("Failed to log park fee", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24">
       <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-surface border border-border rounded-xl">
           <ChevronLeft size={20} className="text-accent-green" />
         </button>
         <div>
           <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
             PARK <span className="text-accent-green">ENTRY</span>
           </h1>
           <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">DIGITIZED FEE LOGGING</p>
         </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="bg-card border border-border p-6 rounded-[2rem] space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">National Park / Reserve</label>
              <select
                value={formData.parkName}
                onChange={(e) => setFormData({...formData, parkName: e.target.value})}
                className="w-full bg-surface border border-border rounded-2xl py-4 px-4 text-white focus:border-accent-green outline-none appearance-none"
              >
                {parks.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Ticket Number</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
                <input
                  type="text"
                  placeholder="KWS-XXXXXXX"
                  required
                  value={formData.ticketNumber}
                  onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})}
                  className="w-full bg-surface border border-border rounded-2xl py-5 pl-12 pr-4 text-sm font-mono text-white focus:border-accent-green outline-none uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Entry Fee (USD/KES)</label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-surface border border-border rounded-2xl py-5 pl-12 pr-4 text-2xl font-mono text-white focus:border-accent-green outline-none"
                />
              </div>
            </div>
         </div>

         {/* Ticket Photo */}
         <div className="bg-surface border border-dashed border-border p-6 rounded-[2rem] flex flex-col items-center justify-center text-center group cursor-pointer relative overflow-hidden">
            {preview ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden relative">
                <img src={preview} alt="Ticket" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-white font-bold text-xs uppercase tracking-widest">Change Photo</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 text-accent-green">
                  <Camera size={32} />
                </div>
                <p className="text-white font-bold text-sm">Capture Ticket Photo</p>
                <p className="text-text-muted text-[10px] uppercase font-bold mt-1">Physical ticket proof is required</p>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
         </div>

         <button
           type="submit"
           disabled={isSubmitting}
           className="w-full bg-accent-green text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50"
         >
           {isSubmitting ? 'SYNCING WITH OFFICE...' : 'LOG PARK ENTRY'}
           <Send size={20} />
         </button>
       </form>
    </div>
  );
};

export default ParkFees;
