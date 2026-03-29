import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Car, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'driver', // Default
    porterName: '',
    porterTrips: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData(prev => ({ ...prev, role: selectedRole }));
    setStep(1); // Proceed to credentials
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsVerifying(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);
      
      const driverDoc = querySnapshot.empty ? null : querySnapshot.docs[0];
      
      // Merge with system data if exists, otherwise proceed as new personnel
      setFormData(prev => ({ 
        ...prev, 
        driverId: driverDoc?.id || null,
        fullName: driverDoc?.data()?.name || prev.fullName,
        isNewDriver: querySnapshot.empty
      }));
      
      // Proceed to Face Scan
      setStep(3);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed: " + (error.code || error.message));
    } finally {
      setIsVerifying(false);
    }
  };

  const roles = [
    { id: 'driver', title: 'Driver', icon: <Car size={24} />, desc: 'Standard City & Fleet Operations' },
    { id: 'porter', title: 'Porter', icon: <User size={24} />, desc: 'Baggage & Logistics Support' },
    { id: 'tour_guide', title: 'Tour Guide', icon: <ArrowRight size={24} />, desc: 'Urban & City Excursions' }
  ];

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 bg-primary-dark">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-accent-gold/20 rounded-xl flex items-center justify-center text-accent-gold mx-auto mb-4">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-heading font-black text-white mb-2 uppercase tracking-tight">
            City <span className="text-accent-gold">Operations</span> Portal
          </h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Personnel Registration</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h3 className="text-center text-white font-bold text-sm uppercase tracking-widest mb-2">Select Your Professional Role</h3>
             <div className="grid grid-cols-1 gap-4 mb-8">
               {roles.map((r) => (
                 <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`relative p-6 rounded-3xl border text-left transition-all duration-300 group ${formData.role === r.id ? 'bg-accent-gold border-accent-gold shadow-lg shadow-accent-gold/20 scale-[1.02]' : 'bg-surface border-border hover:border-accent-gold/30'}`}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.role === r.id ? 'bg-primary-dark text-accent-gold ring-4 ring-primary-dark/10' : 'bg-card text-accent-gold group-hover:bg-accent-gold/20'}`}>
                        {r.icon}
                     </div>
                     <div>
                       <h4 className={`font-black uppercase tracking-tight ${formData.role === r.id ? 'text-primary-dark' : 'text-white'}`}>{r.title}</h4>
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${formData.role === r.id ? 'text-primary-dark/60' : 'text-text-muted'}`}>{r.desc}</p>
                     </div>
                   </div>
                   {formData.role === r.id && (
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary-dark flex items-center justify-center animate-in zoom-in duration-300">
                        <ShieldCheck size={14} className="text-accent-gold" />
                     </div>
                   )}
                 </button>
               ))}
             </div>

             <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
               <button
                onClick={() => setStep(2)}
                disabled={!formData.role}
                className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] group"
               >
                 Confirm Role & Proceed
                 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </button>
               <p className="text-center text-[8px] text-text-muted mt-4 font-bold uppercase tracking-widest opacity-50">Please verify your selection above</p>
             </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="text"
                name="fullName"
                placeholder="FULL NAME"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="email"
                name="email"
                placeholder="EMAIL ADDRESS"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="PHONE NUMBER"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="CREATE PASSWORD"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="CONFIRM PASSWORD"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
              />
            </div>

            {formData.role === 'driver' && (
              <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="h-px bg-border w-full opacity-50" />
                <p className="text-[8px] text-accent-gold font-black uppercase tracking-[0.3em] mb-2">Ground Ops Pairing (Optional)</p>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/40" size={18} />
                  <input
                    type="text"
                    name="porterName"
                    placeholder="RECURRING PORTER NAME"
                    value={formData.porterName}
                    onChange={handleInputChange}
                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[9px]"
                  />
                </div>
                <div className="relative">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/40" size={18} />
                  <input
                    type="number"
                    name="porterTrips"
                    placeholder="ESTIMATED TOTAL TRIPS TOGETHER"
                    value={formData.porterTrips}
                    onChange={handleInputChange}
                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all font-bold uppercase tracking-widest text-[9px]"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-4">
               <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 border border-border text-white font-black py-4 rounded-xl flex items-center justify-center active:scale-95 transition-all text-[10px] uppercase tracking-widest"
               >
                 Back
               </button>
               <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
                ) : (
                  <>Continue <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
             <div className="bg-card border border-accent-gold/20 p-6 rounded-3xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center text-accent-gold">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Identity Check</h3>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                We use secure biometrics to verify authorized drivers. Please ensure you are in a well-lit area for the face scan.
              </p>
            </div>

            <button
              onClick={() => navigate('/driver/face-scan', { state: { formData } })}
              className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Start Face ID Setup
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRegister;
