import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Car, Eye, EyeOff } from 'lucide-react';
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
    confirmPassword: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      
      if (querySnapshot.empty) {
        setIsVerifying(false);
        return toast.error("Driver details not found for: " + cleanEmail + ". Contact office.");
      }

      const driverDoc = querySnapshot.docs[0];
      const driverData = driverDoc.data();
      
      // Merge with system data to ensure consistency
      setFormData(prev => ({ 
        ...prev, 
        driverId: driverDoc.id,
        fullName: driverData.name || prev.fullName 
      }));
      
      // Proceed to Face Scan
      setStep(2);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed: " + (error.code || error.message));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 bg-primary-dark">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-accent-gold/20 rounded-xl flex items-center justify-center text-accent-gold mx-auto mb-4">
            <Car size={24} />
          </div>
          <h2 className="text-2xl font-heading font-black text-white mb-2 uppercase tracking-tight">
            City <span className="text-accent-gold">Operations</span> Portal
          </h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Driver Registration</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name as per ID"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Registered Email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Secure Password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-12 text-white focus:border-accent-gold outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-gold transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-12 text-white focus:border-accent-gold outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-gold transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-6"
            >
              {isVerifying ? 'Verifying Credentials...' : 'Verification Complete'}
              <ArrowRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
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
