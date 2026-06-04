import { create } from 'twrnc';

// Custom Tailwind utility matching the PWA's colors
const tw = create({
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0A0F0D',
        'surface': '#111A15',
        'card': '#1A2E20',
        'accent-gold': '#C9A84C',
        'accent-green': '#2D6A4F',
        'danger-red': '#DC2626',
        'warning-orange': '#E76F51',
        'success': '#16A34A',
        'text-primary': '#F0EDE8',
        'text-muted': '#8A9E8F',
        'border': 'rgba(201, 168, 76, 0.12)',
      },
    },
  },
});

export default tw;
