import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Fuel, Camera, Receipt, ChevronLeft, Send, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseLog = ({ role = 'driver' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSafari = role === 'safari_driver';
  const accentClass = isSafari ? 'text-accent-green' : 'text-accent-gold';
  const bgAccentClass = isSafari ? 'bg-accent-green' : 'bg-accent-gold';

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Fuel',
    note: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !image) {
      return toast.error("Amount and Receipt image are mandatory");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Uploading financial data...");

    try {
      // 1. Upload Receipt to Storage
      const receiptRef = ref(storage, `receipts/${id}/${Date.now()}_${image.name}`);
      await uploadBytes(receiptRef, image);
      const imageUrl = await getDownloadURL(receiptRef);

      // 2. Log to Firestore
      await addDoc(collection(db, 'expenses'), {
        bookingId: id,
        amount: parseFloat(formData.amount),
        category: formData.category,
        note: formData.note,
        receiptUrl: imageUrl,
        timestamp: serverTimestamp(),
        role: role,
        verified: false
      });

      toast.success("Expense Logged Successfully", { id: toastId });
      navigate(-1);
    } catch (err) {
      toast.error("Failed to log expense", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pt-12 space-y-8 animate-in fade-in duration-700 pb-24">
       <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-surface border border-border rounded-xl">
           <ChevronLeft size={20} className={accentClass} />
         </button>
         <div>
           <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
             FINANCIAL <span className={accentClass}>LOG</span>
           </h1>
           <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">EXPENSE TRACKING UNIT</p>
         </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="bg-card border border-border p-6 rounded-[2rem] space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Amount (KES)</label>
              <div className="relative">
                <Landmark className={`absolute left-4 top-1/2 -translate-y-1/2 ${accentClass}`} size={20} />
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-surface border border-border rounded-2xl py-5 pl-12 pr-4 text-2xl font-mono text-white focus:border-accent-gold outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {['Fuel', 'Park Fees', 'Maintenance', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${formData.category === cat ? `${bgAccentClass} text-primary-dark border-transparent` : 'bg-surface text-text-muted border-border'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-text-muted px-1">Reference / Note</label>
              <textarea
                placeholder="Station name, fuel liters, etc."
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                className="w-full bg-surface border border-border rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none h-24 resize-none"
              />
            </div>
         </div>

         {/* Receipt Upload */}
         <div className="bg-surface border border-dashed border-border p-6 rounded-[2rem] flex flex-col items-center justify-center text-center group cursor-pointer relative overflow-hidden">
            {preview ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden relative">
                <img src={preview} alt="Receipt" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-white font-bold text-xs uppercase tracking-widest">Change Receipt</p>
                </div>
              </div>
            ) : (
              <>
                <div className={`w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${accentClass}`}>
                  <Camera size={32} />
                </div>
                <p className="text-white font-bold text-sm">Capture Receipt</p>
                <p className="text-text-muted text-[10px] uppercase font-bold mt-1">Proof of transaction is mandatory</p>
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
           className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${bgAccentClass} text-white disabled:opacity-50`}
         >
           {isSubmitting ? 'UPLOADING DATA...' : 'SUBMIT EXPENSE LOG'}
           <Send size={20} />
         </button>
       </form>
    </div>
  );
};

export default ExpenseLog;
