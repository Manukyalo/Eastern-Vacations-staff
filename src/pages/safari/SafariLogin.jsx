import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, UserPlus, Map } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const SafariLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const authRef = doc(db, 'driverAuth', user.uid);
      const authSnap = await getDoc(authRef);

      if (!authSnap.exists()) {
        toast.error("Safari ID not found.");
        return;
      }

      const data = authSnap.data();
      if (!data.approved) {
        navigate('/safari/pending');
        return;
      }

      navigate('/safari/dashboard');
    } catch (error) {
      toast.error("Invalid credentials or access denied");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 pt-16 flex flex-col items-center justify-center min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-primary-dark">
      {/* Brand Logo */}
      <div className="w-20 h-20 mb-4 select-none">
        <img src="/logo.png" alt="Eastern Vacations" className="w-full h-full object-contain filter contrast-125 brightness-110 drop-shadow-xl" />
      </div>

      <div className="text-center space-y-2">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent-green/10 border border-accent-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Map size={32} className="text-accent-green" />
          </div>
          <h2 className="text-3xl font-heading font-black text-white mb-2 tracking-tight">SAFARI LOGIN</h2>
          <p className="text-text-muted text-[10px] uppercase tracking-[0.4em] font-bold">Expedition Field Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green/50" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Driver Email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green/50" size={20} />
            <input
              type="password"
              name="password"
              placeholder="Field Password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-green text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 group active:scale-95 transition-all mt-4"
          >
            {isLoading ? 'Verifying...' : 'Access Safe'}
            {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-border/10 flex flex-col gap-4">
          <button 
            onClick={() => navigate('/safari/register')}
            className="w-full py-4 text-text-muted flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            <UserPlus size={18} />
            <span>Join expedition crew</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafariLogin;
