import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const DriverPendingApproval = () => {
  const { driverProfile, driverAuth } = useAuth();

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Animated Hourglass Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-accent-gold/10 rounded-full animate-pulse blur-xl" />
          <div className="relative w-full h-full bg-surface border border-accent-gold/20 rounded-[2rem] flex items-center justify-center">
            <Clock size={40} className="text-accent-gold animate-[spin_4s_linear_infinite]" />
          </div>
        </div>

        <h2 className="text-3xl font-heading font-black text-white mb-4 uppercase tracking-tight">
          Pending <span className="text-accent-gold">Approval</span>
        </h2>
        
        <div className="bg-card border border-border p-6 rounded-[2rem] mb-8 text-left">
          <div className="flex items-center justify-between mb-6">
            <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Account Status</span>
            <StatusBadge status="Awaiting Verification" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border">
                {driverAuth?.faceImageUrl ? (
                  <img src={driverAuth.faceImageUrl} alt="Registered ID" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShieldCheck size={20} className="text-text-muted opacity-20" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold">{driverProfile?.name || 'Driver Name'}</p>
                <p className="text-text-muted text-xs uppercase tracking-wider">{driverAuth?.role?.replace('_', ' ') || 'Driver'}</p>
              </div>
            </div>

            <p className="text-text-muted text-sm leading-relaxed pt-2">
              Your registration has been submitted and is currently being reviewed by the administration team. You will be notified once your face ID is verified.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="https://wa.me/254700000000" // Replace with VITE_ADMIN_WHATSAPP
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <MessageCircle size={20} className="text-[#25D366]" />
            Contact Admin
          </a>
          
          <button 
            onClick={() => window.location.reload()}
            className="text-accent-gold text-xs font-bold tracking-widest uppercase hover:opacity-70 transition-opacity"
          >
            Check Status Manually
          </button>
        </div>

        <p className="mt-12 text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold opacity-30">
          Secure Biometric Verification • EV Systems
        </p>
      </div>
    </div>
  );
};

export default DriverPendingApproval;
