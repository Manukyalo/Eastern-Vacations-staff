import React from 'react';

const SOSButton = ({ onTrigger }) => {
  return (
    <button
      onClick={onTrigger}
      className="fixed bottom-24 right-6 w-16 h-16 bg-danger-red rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-90 transition-transform z-40 border-4 border-white/20"
    >
      <span className="text-white font-black text-xl tracking-tighter">SOS</span>
      
      {/* Pulsing Ring Animation */}
      <div className="absolute inset-0 rounded-full bg-danger-red animate-ping opacity-20 pointer-events-none" />
    </button>
  );
};

export default SOSButton;
