import React from 'react';
import { Check, Circle } from 'lucide-react';

const TripStatusBar = ({ currentStatus }) => {
  const steps = [
    'Assigned',
    'Acknowledged',
    'En Route',
    'Client Picked Up',
    'In Transit',
    'Trip Complete'
  ];

  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative px-2">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-card -translate-y-1/2 z-0 mx-8" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-accent-gold -translate-y-1/2 z-0 transition-all duration-700 ease-in-out mx-8"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 group">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                  ${isCompleted ? 'bg-accent-gold text-primary-dark' : isCurrent ? 'bg-primary-dark border-2 border-accent-gold text-accent-gold' : 'bg-card border-2 border-border text-text-muted'}
                  ${isCurrent ? 'ring-4 ring-accent-gold/20 scale-125' : ''}
                `}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : <Circle size={12} className={isCurrent ? 'fill-current' : ''} />}
              </div>
              <span className={`
                absolute top-10 whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-opacity duration-300
                ${isCurrent ? 'text-accent-gold opacity-100' : 'text-text-muted opacity-40'}
              `}>
                {step.split(' ').join('\n')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripStatusBar;
