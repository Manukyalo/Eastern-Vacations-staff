import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Map as MapIcon, ShieldCheck } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-gold/5 rounded-full blur-[150px]" />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-accent-gold rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(201,168,76,0.2)] mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldCheck size={40} className="text-primary-dark" />
          </div>
          <h1 className="text-4xl font-heading font-black tracking-tight mb-2 text-white">
            Eastern <span className="text-accent-gold">Vacations</span>
          </h1>
          <p className="text-text-muted font-medium tracking-[0.2em] uppercase text-xs">
            Field Operations Portal
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid gap-6 w-full">
          {/* City Driver Card */}
          <div 
            onClick={() => navigate('/driver/login')}
            className="group relative bg-surface border border-border p-6 rounded-[24px] hover:border-accent-gold/50 transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-accent-gold">
                <Car size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">City & Tour Driver</h3>
                <p className="text-text-muted text-sm">Transfers, airport pickups, day tours</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/driver/login'); }}
                className="flex-1 bg-accent-gold text-primary-dark font-bold py-3 rounded-xl text-sm"
              >
                Login
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/driver/register'); }}
                className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl text-sm border border-white/10"
              >
                Register
              </button>
            </div>
          </div>

          {/* Safari Driver Card */}
          <div 
            onClick={() => navigate('/safari/login')}
            className="group relative bg-card border border-accent-green/20 p-6 rounded-[24px] hover:border-accent-green/50 transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <MapIcon size={120} />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center text-accent-green">
                <MapIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Safari Driver</h3>
                <p className="text-text-muted text-sm">Expeditions, national parks, tracking</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/safari/login'); }}
                className="flex-1 bg-accent-green text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_15px_rgba(45,106,79,0.3)]"
              >
                Login
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/safari/register'); }}
                className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl text-sm border border-white/10"
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center opacity-40">
          <p className="text-[10px] uppercase tracking-widest font-bold">
            © 2025 Eastern Vacations — Secure Field Portal v1.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
