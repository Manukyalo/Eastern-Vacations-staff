import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '../../context/LocationContext';
import { Navigation, Map as MapIcon, Layers, Target, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Note: Replace with actual token or use a placeholder
mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWt5YWxvIiwiYSI6ImNsemRhZ3ZoeTBiaXkyYnB5ZzB6ZHZ6ZHgifQ.placeholder';

const LiveMap = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const { currentLocation } = useLocation();
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [36.8219, -1.2921], // Nairobi default
      zoom: zoom,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Custom Marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.innerHTML = `
      <div class="relative w-12 h-12 flex items-center justify-center">
        <div class="absolute inset-0 bg-accent-green/20 rounded-full animate-ping"></div>
        <div class="w-8 h-8 bg-accent-green rounded-full border-4 border-primary-dark shadow-2xl flex items-center justify-center text-primary-dark">
           <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
        </div>
      </div>
    `;

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([36.8219, -1.2921])
      .addTo(map.current);

    return () => map.current.remove();
  }, []);

  useEffect(() => {
    if (currentLocation && map.current && marker.current) {
      const { latitude, longitude, heading } = currentLocation;
      marker.current.setLngLat([longitude, latitude]);
      
      // Rotate marker based on heading
      const markerIcon = marker.current.getElement().querySelector('svg');
      if (markerIcon) markerIcon.style.transform = `rotate(${heading || 0}deg)`;

      map.current.flyTo({
        center: [longitude, latitude],
        speed: 0.8,
        curve: 1
      });
    }
  }, [currentLocation]);

  return (
    <div className="relative h-screen bg-primary-dark">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
         <button 
           onClick={() => navigate(-1)}
           className="p-4 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl text-accent-green active:scale-95 transition-all"
         >
           <ChevronLeft size={24} />
         </button>

         <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-4 rounded-[1.5rem] shadow-2xl space-y-3 min-w-[140px]">
            <div className="flex items-center justify-between gap-4">
               <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Status</p>
                  <p className="text-xs font-black text-success uppercase">Live Signal</p>
               </div>
               <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            </div>
            <div className="border-t border-white/5 pt-2">
               <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Coords</p>
               <p className="text-[10px] font-mono font-bold text-white">
                 {currentLocation?.latitude?.toFixed(4) || '0.000'}, {currentLocation?.longitude?.toFixed(4) || '0.000'}
               </p>
            </div>
         </div>
      </div>

      {/* Tracking Bar */}
      <div className="absolute bottom-12 left-6 right-6 z-10 bg-surface/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green">
               <Navigation size={24} />
            </div>
            <div>
               <h3 className="text-white font-black uppercase tracking-tight text-sm">EXPEDITION TRACKING</h3>
               <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Digital Compass Active</p>
            </div>
         </div>
         <button className="bg-accent-green text-primary-dark p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            <Target size={24} />
         </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { display: none !important; }
        .marker { cursor: pointer; transition: transform 0.2s; }
      `}} />
    </div>
  );
};

export default LiveMap;
