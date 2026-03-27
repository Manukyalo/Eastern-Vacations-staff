import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
      // Query Firestore drivers collection to verify existence
      const driversRef = collection(db, 'drivers');
      const q = query(
        driversRef, 
        where('email', '==', formData.email),
        // where('phone', '==', formData.phone) // Simplified for first pass, usually both
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setIsVerifying(false);
        return toast.error("Your details were not found in our system. Contact admin first.");
      }

      const driverDoc = querySnapshot.docs[0];
      setFormData(prev => ({ ...prev, driverId: driverDoc.id }));
      
      // Proceed to Face Scan
      setStep(2);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-2 uppercase tracking-tight">
            Driver <span className="text-accent-gold">Registration</span>
          </h2>
          <div className="flex justify-center gap-2 mb-4">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-accent-gold' : 'bg-card'}`} />
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-accent-gold' : 'bg-card'}`} />
            <div className={`h-1.5 w-12 rounded-full ${step >= 3 ? 'bg-accent-gold' : 'bg-card'}`} />
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-text-muted text-sm mb-6 text-center italic">
              "Credential verification. Details must match office records."
            </p>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name (as per system)"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold transition-colors"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Personal Email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold transition-colors"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Registered Phone Number"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Create Password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 group active:scale-95 transition-all mt-8"
            >
              {isVerifying ? 'Verifying Records...' : 'Verify & Continue'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-card border border-accent-gold/20 p-6 rounded-3xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center text-accent-gold">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Biometric Registration</h3>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                We'll scan your face to secure your account. This prevents unauthorized access to field logs. Ensure good lighting and remove glasses.
              </p>
            </div>

            <button
              onClick={() => navigate('/driver/face-scan', { state: { formData } })}
              className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 group active:scale-95 transition-all"
            >
              Initialize Face Scan
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRegister;
