import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocation } from '../../context/LocationContext';
import { Navigation, Map as MapIcon, Layers, Target, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KENYA_PARKS } from '../../utils/parkBoundaries';
import { KENYA_LODGES } from '../../utils/lodgesData';
import { KENYA_GATES } from '../../utils/gatesData';

const LiveMap = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const parkMarkers = useRef({});
  const lodgeMarkers = useRef({});
  const gateMarkers = useRef({});
  
  const { currentLocation } = useLocation();
  const [zoom] = useState(12.5);
  
  // Layer Toggles
  const [showParks, setShowParks] = useState(true);
  const [showLodges, setShowLodges] = useState(true);
  const [showGates, setShowGates] = useState(true);

  // Sync Visibility
  useEffect(() => {
    if (!map.current) return;
    Object.values(parkMarkers.current).forEach(m => showParks ? m.addTo(map.current) : m.remove());
    Object.values(lodgeMarkers.current).forEach(m => showLodges ? m.addTo(map.current) : m.remove());
    Object.values(gateMarkers.current).forEach(m => showGates ? m.addTo(map.current) : m.remove());
  }, [showParks, showLodges, showGates]);

  useEffect(() => {
    if (map.current) return;

    const COORD_MOMBASA = [39.6646, -4.0435];
    const isCityPersonnel = ['porter', 'tour_guide', 'driver'].includes(useLocation().role);
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: isCityPersonnel ? COORD_MOMBASA : [36.8219, -1.2921], // Center on coast if city-based
      zoom: isCityPersonnel ? 11 : zoom,
      pitch: 45,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

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

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([36.8219, -1.2921])
      .addTo(map.current);

    // Render Static Layers
    map.current.on('load', () => {
      // 1. Parks (Enhanced with Labels)
      KENYA_PARKS.forEach(park => {
        const pEl = document.createElement('div');
        pEl.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer;';
        pEl.innerHTML = `
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${park.color}; border: 1.5px solid white;"></div>
          <div style="background: rgba(17, 27, 21, 0.8); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 6px; border: 1px solid ${park.color}30; white-space: nowrap;">
            <span style="color: white; font-size: 9px; font-weight: 800; text-transform: uppercase;">${park.name}</span>
          </div>
        `;

        const m = new maplibregl.Marker({ element: pEl })
          .setLngLat(park.center)
          .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(`
            <div class="p-3 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-xl text-white font-dm-sans min-w-[140px]">
              <div class="text-[10px] uppercase font-black text-text-muted mb-0.5">National Park</div>
              <div class="text-xs font-black" style="color: ${park.color}">${park.name}</div>
            </div>
          `));
        parkMarkers.current[park.id] = m;
        if (showParks) m.addTo(map.current);
      });

      // 2. Lodges (Enhanced with Labels)
      KENYA_LODGES.forEach(lodge => {
        const lEl = document.createElement('div');
        const icon = lodge.type === 'tented_camp' ? '⛺' : '🏨';
        lEl.style.cssText = 'display: flex; align-items: center; gap: 4px; cursor: pointer;';
        lEl.innerHTML = `
          <span style="font-size: 14px;">${icon}</span>
          <div style="background: rgba(10, 10, 20, 0.8); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 6px; border: 1px solid #C9A84C30; white-space: nowrap;">
            <span style="color: #C9A84C; font-size: 9px; font-weight: 800; text-transform: uppercase;">${lodge.name}</span>
          </div>
        `;

        const m = new maplibregl.Marker({ element: lEl })
          .setLngLat(lodge.center)
          .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(`
            <div class="p-3 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-xl text-white font-dm-sans min-w-[160px]">
              <div class="text-[9px] uppercase font-black text-accent-gold mb-0.5">${lodge.type.replace('_',' ')}</div>
              <div class="text-xs font-black text-white">${lodge.name}</div>
              <div class="text-[10px] text-text-muted mt-1">📍 ${lodge.parkName}</div>
            </div>
          `));
        lodgeMarkers.current[lodge.id] = m;
        if (showLodges) m.addTo(map.current);
      });

      // 3. Gates (Enhanced with Labels)
      KENYA_GATES.forEach(gate => {
        const gEl = document.createElement('div');
        gEl.style.cssText = 'display: flex; align-items: center; gap: 4px; cursor: pointer;';
        gEl.innerHTML = `
          <span style="font-size: 14px;">🚧</span>
          <div style="background: rgba(10, 20, 15, 0.8); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 6px; border: 1px solid #4ade8030; white-space: nowrap;">
            <span style="color: #4ade80; font-size: 9px; font-weight: 800; text-transform: uppercase;">${gate.name}</span>
          </div>
        `;

        const m = new maplibregl.Marker({ element: gEl })
          .setLngLat(gate.center)
          .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(`
            <div class="p-3 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-xl text-white font-dm-sans min-w-[140px]">
              <div class="text-[9px] uppercase font-black text-success mb-0.5">Entry Gate</div>
              <div class="text-xs font-black text-white">${gate.name}</div>
            </div>
          `));
        gateMarkers.current[gate.id] = m;
        if (showGates) m.addTo(map.current);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentLocation && map.current && marker.current) {
      const { latitude, longitude, heading } = currentLocation;
      marker.current.setLngLat([longitude, latitude]);
      
      const markerIcon = marker.current.getElement().querySelector('svg');
      if (markerIcon) markerIcon.style.transform = `rotate(${heading || 0}deg)`;

      map.current.flyTo({
        center: [longitude, latitude],
        speed: 0.8,
        curve: 1,
        essential: true
      });
    }
  }, [currentLocation]);

  return (
    <div className="relative h-screen bg-primary-dark overflow-hidden font-dm-sans">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* TOP OVERLAY */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
         <button onClick={() => navigate(-1)} className="p-4 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl text-accent-green active:scale-95 transition-all">
           <ChevronLeft size={24} />
         </button>

         {/* LAYER TOGGLE PILL */}
         <div className="flex bg-surface/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-[1.5rem] shadow-2xl gap-1">
            <button onClick={() => setShowParks(!showParks)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${showParks ? 'bg-accent-green text-primary-dark' : 'text-text-muted'}`}>Parks</button>
            <button onClick={() => setShowLodges(!showLodges)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${showLodges ? 'bg-accent-gold text-primary-dark' : 'text-text-muted'}`}>Lodges</button>
            <button 
              onClick={() => {
                if (map.current) map.current.flyTo({ center: [39.6646, -4.0435], zoom: 11, essential: true });
              }}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight bg-white/5 text-accent-gold border border-accent-gold/20"
            >
              Coast Unit
            </button>
         </div>
      </div>

      {/* BOTTOM TRACKING BAR */}
      <div className="absolute bottom-12 left-6 right-6 z-10 grid grid-cols-[1fr_auto] gap-4">
        <div className="bg-surface/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green">
                 <Navigation size={20} />
              </div>
              <div className="min-w-0">
                 <h3 className="text-white font-black uppercase tracking-tight text-xs truncate">Expedition Gear</h3>
                 <p className="text-text-muted text-[8px] font-black uppercase tracking-widest truncate">Ops Signal Active</p>
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <p className="text-[8px] font-black uppercase text-success tracking-widest animate-pulse flex items-center gap-1">
                <span className="w-1 h-1 bg-success rounded-full" /> Live
              </p>
              <p className="text-[10px] font-mono font-bold text-white mt-0.5">
                {currentLocation?.latitude?.toFixed(3)},{currentLocation?.longitude?.toFixed(3)}
              </p>
           </div>
        </div>

        <button 
          onClick={() => {
            if (currentLocation && map.current) {
              map.current.flyTo({ center: [currentLocation.longitude, currentLocation.latitude], zoom: 14, essential: true });
            }
          }}
          className="bg-accent-green text-primary-dark w-16 h-16 rounded-[2rem] shadow-lg flex items-center justify-center active:scale-95 transition-all shadow-accent-green/20"
        >
           <Target size={28} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-top-right { display: none !important; }
        .marker { cursor: pointer; transition: transform 0.2s; }
        .maplibregl-popup-content { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
        .maplibregl-popup-tip { border-top-color: rgba(26, 46, 32, 0.9) !important; }
      `}} />
    </div>
  );
};

export default LiveMap;
