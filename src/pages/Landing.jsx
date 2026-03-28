import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Map as MapIcon, ShieldCheck } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  React.useEffect(() => {
    if (currentUser && role) {
      if (role === 'safari_driver') {
        navigate('/safari/dashboard');
      } else if (role === 'porter') {
        navigate('/porter/dashboard');
      } else {
        // Both 'driver' and 'tour_guide' currently use the main driver dashboard
        navigate('/driver/dashboard');
      }
    }
  }, [currentUser, role, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-gold/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-green/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Main Content */}
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block p-4 bg-card border border-border rounded-3xl mb-4 shadow-2xl">
            <img src="/logo.png" alt="Eastern Vacations" className="h-12 w-auto filter brightness-110" />
          </div>
          <h1 className="text-4xl font-heading font-black text-white leading-tight uppercase tracking-tighter">
            OPERATIONAL <span className="text-accent-gold">PORTAL</span>
          </h1>
          <p className="text-text-muted text-sm font-medium tracking-wide max-w-[280px] mx-auto uppercase">
            Official logistics & dispatch system for staff personnel
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <button 
            onClick={() => navigate('/driver/login')}
            className="group relative bg-card border border-border p-8 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-accent-gold transition-all duration-500 overflow-hidden active:scale-95 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/0 to-accent-gold/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 bg-accent-gold/10 rounded-2xl text-accent-gold group-hover:scale-110 group-hover:bg-accent-gold group-hover:text-primary-dark transition-all duration-500">
              <Car size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">City Operations</h3>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">Airport & City Logistics</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/safari/login')}
            className="group relative bg-card border border-border p-8 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-accent-green transition-all duration-500 overflow-hidden active:scale-95 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/0 to-accent-green/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 bg-accent-green/10 rounded-2xl text-accent-green group-hover:scale-110 group-hover:bg-accent-green group-hover:text-primary-dark transition-all duration-500">
              <MapIcon size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Safari Expedition</h3>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">Parks & Wilderness Tours</p>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 pt-8 animate-in fade-in duration-1000 delay-700">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
            <ShieldCheck size={14} className="text-success" />
            Secured Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
