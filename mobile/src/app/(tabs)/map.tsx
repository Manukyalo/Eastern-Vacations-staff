import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Navigation, Target, Map as MapIcon } from 'lucide-react-native';
import { useLocation } from '@/context/LocationContext';
import { KENYA_PARKS } from '@/utils/parkBoundaries';
import { KENYA_LODGES } from '@/utils/lodgesData';
import { KENYA_GATES } from '@/utils/gatesData';
import tw from '@/utils/tailwind';

// Default center: Mombasa
const MOMBASA = { latitude: -4.0435, longitude: 39.6646 };
const NAIROBI = { latitude: -1.2921, longitude: 36.8219 };

export default function MapTab() {
  const mapRef = useRef<MapView>(null);
  const { currentLocation, role } = useLocation();

  const isCityPersonnel = role && ['porter', 'tour_guide', 'driver'].includes(role);
  const defaultCenter = isCityPersonnel ? MOMBASA : NAIROBI;

  const [region, setRegion] = useState<Region>({
    latitude: defaultCenter.latitude,
    longitude: defaultCenter.longitude,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [showParks, setShowParks] = useState(true);
  const [showLodges, setShowLodges] = useState(true);

  // Follow driver position
  useEffect(() => {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }, 800);
  }, [currentLocation]);

  const recenterToDriver = () => {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 600);
  };

  return (
    <View style={tw`flex-1 bg-primary-dark`}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? 'google' : PROVIDER_DEFAULT}
        initialRegion={region}
        mapType="satellite"
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* Driver Position Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={tw`items-center justify-center`}>
              <View style={tw`w-4 h-4 bg-success rounded-full border-2 border-white shadow-lg`} />
              <View style={tw`absolute w-8 h-8 bg-success/20 rounded-full`} />
            </View>
          </Marker>
        )}

        {/* Kenya Parks */}
        {showParks && KENYA_PARKS.map((park: any) => (
          <Marker
            key={`park-${park.id}`}
            coordinate={{ latitude: park.center[1], longitude: park.center[0] }}
            title={park.name}
            description="National Park"
            pinColor={park.color || '#2D6A4F'}
          />
        ))}

        {/* Lodges */}
        {showLodges && KENYA_LODGES.map((lodge: any) => (
          <Marker
            key={`lodge-${lodge.id}`}
            coordinate={{ latitude: lodge.center[1], longitude: lodge.center[0] }}
            title={lodge.name}
            description={lodge.parkName}
            pinColor="#C9A84C"
          />
        ))}

        {/* Gates */}
        {KENYA_GATES.map((gate: any) => (
          <Marker
            key={`gate-${gate.id}`}
            coordinate={{ latitude: gate.center[1], longitude: gate.center[0] }}
            title={gate.name}
            description="Entry Gate"
            pinColor="#22C55E"
          />
        ))}
      </MapView>

      {/* Top Overlay */}
      <SafeAreaView style={tw`absolute top-0 left-0 right-0`}>
        <View style={tw`flex-row justify-end px-4 pt-4 gap-2`}>
          <View style={tw`flex-row bg-black/60 rounded-2xl p-1 gap-1`}>
            <TouchableOpacity
              onPress={() => setShowParks(!showParks)}
              style={tw`px-3 py-2 rounded-xl ${showParks ? 'bg-accent-green' : 'bg-transparent'}`}
            >
              <Text style={tw`text-[10px] font-bold uppercase ${showParks ? 'text-primary-dark' : 'text-text-muted'}`}>Parks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLodges(!showLodges)}
              style={tw`px-3 py-2 rounded-xl ${showLodges ? 'bg-accent-gold' : 'bg-transparent'}`}
            >
              <Text style={tw`text-[10px] font-bold uppercase ${showLodges ? 'text-primary-dark' : 'text-text-muted'}`}>Lodges</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => mapRef.current?.animateToRegion({
                latitude: MOMBASA.latitude,
                longitude: MOMBASA.longitude,
                latitudeDelta: 0.3,
                longitudeDelta: 0.3,
              }, 600)}
              style={tw`px-3 py-2 rounded-xl bg-white/5 border border-accent-gold/20`}
            >
              <Text style={tw`text-[10px] font-bold uppercase text-accent-gold`}>Coast</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Tracking Bar */}
      <View style={tw`absolute bottom-24 left-4 right-4 flex-row gap-3`}>
        <View style={tw`flex-1 bg-black/80 border border-white/10 p-4 rounded-[2rem] flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View style={tw`w-10 h-10 bg-success/10 rounded-2xl items-center justify-center`}>
              <Navigation size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={tw`text-white font-bold text-xs uppercase`}>Expedition Gear</Text>
              <Text style={tw`text-text-muted text-[8px] font-bold uppercase tracking-widest`}>Ops Signal Active</Text>
            </View>
          </View>
          <View style={tw`items-end`}>
            <View style={tw`flex-row items-center gap-1`}>
              <View style={tw`w-1.5 h-1.5 bg-success rounded-full`} />
              <Text style={tw`text-success text-[8px] font-bold uppercase`}>Live</Text>
            </View>
            <Text style={tw`text-white font-mono text-[10px] mt-0.5`}>
              {currentLocation
                ? `${currentLocation.latitude.toFixed(3)}, ${currentLocation.longitude.toFixed(3)}`
                : 'Acquiring...'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={recenterToDriver}
          style={tw`w-14 h-14 bg-success rounded-[1.5rem] items-center justify-center shadow-lg active:scale-95`}
        >
          <Target size={22} color="#0A0F0D" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
