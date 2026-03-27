import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, ClipboardCheck, MessageSquare, User, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { role } = useAuth();
  const isSafari = role === 'safari_driver';

  const navItems = [
    { icon: Home, label: 'Home', path: isSafari ? '/safari/dashboard' : '/driver/dashboard' },
    { icon: isSafari ? Map : Briefcase, label: isSafari ? 'Safaris' : 'Trips', path: isSafari ? '/safari/trips' : '/driver/trips' },
    { icon: isSafari ? Map : Map, label: 'Map', path: isSafari ? '/safari/map' : '/driver/map' },
    { icon: MessageSquare, label: 'Chat', path: isSafari ? '/safari/messages' : '/driver/messages' },
    { icon: User, label: 'Profile', path: isSafari ? '/safari/profile' : '/driver/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-2 py-1 safe-area-pb flex justify-around items-center z-50">
      {navItems.map((item, idx) => (
        <NavLink
          key={idx}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center justify-center py-2 px-1 min-w-[64px] transition-colors
            ${isActive ? 'text-accent-gold' : 'text-text-muted'}
          `}
        >
          <item.icon size={24} className="mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
