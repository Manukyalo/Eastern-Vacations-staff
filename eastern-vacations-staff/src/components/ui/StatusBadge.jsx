import React from 'react';
import { AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'available':
      case 'trip complete':
        return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle };
      case 'pending':
      case 'awaiting verification':
      case 'assigned':
      case 'acknowledged':
        return { bg: 'bg-accent-gold/10', text: 'text-accent-gold', icon: Clock };
      case 'warning':
      case 'en route':
      case 'client picked up':
      case 'in transit':
        return { bg: 'bg-warning-orange/10', text: 'text-warning-orange', icon: Info };
      case 'error':
      case 'critical':
      case 'sos active':
      case 'rejected':
      case 'off duty':
        return { bg: 'bg-danger-red/10', text: 'text-danger-red', icon: AlertTriangle };
      default:
        return { bg: 'bg-white/10', text: 'text-text-muted', icon: Info };
    }
  };

  const { bg, text, icon: Icon } = getStyles();

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${bg} ${text} text-[10px] font-bold uppercase tracking-wider border border-current/20 w-fit`}>
      <Icon size={12} />
      {status}
    </div>
  );
};

export default StatusBadge;
