import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const DriverLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Credentials, 2: Face (handled by FaceVerifier later)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Fetch driverAuth
      const authRef = doc(db, 'driverAuth', user.uid);
      const authSnap = await getDoc(authRef);

      if (!authSnap.exists()) {
        toast.error("Auth record not found. Please register first.");
        return;
      }

      const data = authSnap.data();
      
      if (!data.approved) {
        navigate('/driver/pending');
        return;
      }

      // Proceed to Face Verification (Step 2)
      // For now, redirecting to dashboard for demo if approved
      // In full implementation, this opens FaceVerifier
      navigate('/driver/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 pt-16 flex flex-col items-center justify-center min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-primary-dark">
      {/* Brand Logo */}
      <div className="w-20 h-20 mb-4 select-none">
        <img src="/logo.png" alt="Eastern Vacations" className="w-full h-full object-contain filter drop-shadow-xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-accent-gold" />
          </div>
          <h2 className="text-3xl font-heading font-black text-white mb-2">FIELD LOGIN</h2>
          <p className="text-text-muted text-sm uppercase tracking-widest font-bold">City & Tour Operations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/50" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/50" size={20} />
            <input
              type="password"
              name="password"
              placeholder="System Password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-gold outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-gold text-primary-dark font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 group active:scale-95 transition-all mt-4"
          >
            {isLoading ? 'Processing...' : 'Secure Login'}
            {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-border flex flex-col gap-4">
          <button 
            onClick={() => navigate('/driver/register')}
            className="w-full py-4 text-text-muted flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            <UserPlus size={18} />
            <span>Not registered? Create account</span>
          </button>
          
          <div className="flex items-center gap-2 justify-center text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-40">
            <ShieldCheck size={12} />
            Protected by Biometric Security
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
