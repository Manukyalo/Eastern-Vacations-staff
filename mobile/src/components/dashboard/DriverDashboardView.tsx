import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, MapPin, Calendar, Clock, ChevronRight, User, Compass } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useDriver } from '@/context/DriverContext';
import { useLocation } from '@/context/LocationContext';
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge';
import { db } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { format, isValid } from 'date-fns';
import tw from '@/utils/tailwind';

export default function DriverDashboardView() {
  const router = useRouter();
  const { driverProfile, role, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const [showPorterModal, setShowPorterModal] = useState(false);
  const [availablePorters, setAvailablePorters] = useState<any[]>([]);
  const [loadingPorters, setLoadingPorters] = useState(false);

  const today = new Date();
  const todaysTrip = activeBookings.find(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    if (!isValid(bookingDate)) return false;
    return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  const fetchPorters = async () => {
    setLoadingPorters(true);
    try {
      const q = query(collection(db, 'porters'), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      setAvailablePorters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load operations team');
    } finally {
      setLoadingPorters(false);
    }
  };

  const handleCommenceTrip = async (porter: any) => {
    if (!todaysTrip || !currentUser) return;
    
    try {
      // 1. Update Booking Status
      await updateDoc(doc(db, 'bookings', todaysTrip.id), {
        status: 'Client Picked Up',
        porterId: porter.id,
        porterName: porter.name,
        commencedAt: serverTimestamp()
      });

      // 2. Update Porter's Live Stats
      await updateDoc(doc(db, 'porters', porter.id), {
        totalTrips: increment(1),
        currentDriver: driverProfile?.name || 'Assigned Driver',
        currentTripType: todaysTrip.type || 'Transfer',
        lastTripAt: serverTimestamp(),
        assignedDriverId: currentUser.uid,
        assignedDriverName: driverProfile?.name || 'Assigned Driver',
        driverPhoto: driverProfile?.faceImageUrl || '',
        transferType: todaysTrip.type || 'Transfer',
        deploymentTime: serverTimestamp()
      });

      setShowPorterModal(false);
      router.push(`/driver/trip/${todaysTrip.id}` as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Sync Error', 'Failed to initialize deployment');
    }
  };

  return (
    <ScrollView style={tw`flex-1 bg-primary-dark`} contentContainerStyle={tw`p-6 pt-12 pb-24 gap-6`}>
      
      {/* Header */}
      <div style={tw`flex-row justify-between items-center px-1`}>
        <View>
          <Text style={tw`text-2xl font-bold text-white uppercase`}>
            {role === 'tour_guide' ? 'CITY' : 'FIELD'} <Text style={tw`text-accent-gold`}>UNIT</Text>
          </Text>
          <Text style={tw`text-accent-gold font-bold text-[9px] uppercase tracking-widest mt-1`}>
            {role === 'tour_guide' ? 'Professional Tour Guide' : 'Fleet Operations Captain'}
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-3`}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={tw`w-10 h-8`}
            contentFit="contain"
          />
          <TouchableOpacity style={tw`w-10 h-10 bg-card border border-border rounded-xl justify-center items-center`}>
            <Bell size={20} color={isTracking ? '#C9A84C' : '#8A9E8F'} />
          </TouchableOpacity>
        </View>
      </div>

      {/* Telemetry Card */}
      <View style={tw`bg-card border border-border p-5 rounded-[2rem] overflow-hidden`}>
        {currentLocation?.heading !== undefined && (
          <View style={[tw`absolute top-0 right-0 p-4 opacity-5`, { transform: [{ rotate: `${currentLocation.heading}deg` }] }]}>
            <Compass size={110} color="#C9A84C" />
          </View>
        )}
        <View>
          <Text style={tw`text-xl font-bold text-white`}>Jambo, {driverProfile?.name?.split(' ')[0] || 'Officer'}</Text>
          <View style={tw`flex-row items-center gap-2 mt-2`}>
            <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: isTracking ? '#16A34A' : '#DC2626' }]} />
            <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-wider`}>
              {isTracking ? 'Live Telemetry Active' : 'Signal Lost - Reconnecting'}
            </Text>
          </View>
          {currentUser?.uid && (
            <View style={tw`mt-3 flex-row`}>
              <NetworkStatusBadge driverId={currentUser.uid} />
            </View>
          )}
        </View>
      </View>

      {/* Today's Assignment */}
      <View style={tw`gap-3`}>
        <View style={tw`flex-row items-center gap-2 px-1`}>
          <Clock size={14} color="#C9A84C" />
          <Text style={tw`text-[10px] font-bold uppercase tracking-wider text-text-muted`}>Today's Assignment</Text>
        </View>

        {todaysTrip ? (
          <View style={tw`bg-surface border-l-4 border-l-accent-gold border border-border p-5 rounded-2xl gap-4`}>
            <View style={tw`flex-row justify-between items-start`}>
              <View>
                <Text style={tw`text-accent-gold font-bold text-lg`}>{todaysTrip.timeOfPickup || '08:00 AM'}</Text>
                <Text style={tw`text-white font-bold text-lg mt-0.5`}>{todaysTrip.clientName}</Text>
              </View>
              {/* Status Badge */}
              <View style={tw`px-2.5 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full`}>
                <Text style={tw`text-accent-gold text-[9px] font-bold uppercase`}>{todaysTrip.status || 'Assigned'}</Text>
              </View>
            </View>

            <View style={tw`gap-2`}>
              <View style={tw`flex-row items-center gap-3`}>
                <MapPin size={16} color="#C9A84C" />
                <Text style={tw`text-text-muted text-sm flex-1`} numberOfLines={1}>{todaysTrip.destinations}</Text>
              </View>
              <View style={tw`flex-row items-center gap-3`}>
                <Calendar size={16} color="#C9A84C" />
                <Text style={tw`text-text-muted text-sm flex-1`} numberOfLines={1}>{todaysTrip.packageName}</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => {
                if (todaysTrip.status === 'Assigned') {
                  fetchPorters();
                  setShowPorterModal(true);
                } else {
                  router.push(`/driver/trip/${todaysTrip.id}` as any);
                }
              }}
              style={tw`w-full bg-accent-gold py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:scale-98`}
            >
              <Text style={tw`text-primary-dark font-bold uppercase tracking-wider text-xs`}>
                {todaysTrip.status === 'Assigned' ? 'SELECT PORTER & START' : 'RESUME OPERATIONS'}
              </Text>
              <ChevronRight size={18} color="#0A0F0D" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={tw`bg-surface border border-dashed border-border p-10 rounded-[2.5rem] items-center justify-center`}>
            <View style={tw`w-14 h-14 bg-card rounded-2xl items-center justify-center mb-3 opacity-50`}>
              <Calendar size={28} color="#8A9E8F" />
            </View>
            <Text style={tw`text-text-muted font-bold text-xs uppercase tracking-wider`}>No active deployments</Text>
            <Text style={tw`text-text-muted/60 text-[10px] uppercase mt-1`}>Stand by for upcoming assignments</Text>
          </View>
        )}
      </View>

      {/* Upcoming Queue */}
      <View style={tw`gap-3`}>
        <View style={tw`flex-row items-center gap-2 px-1`}>
          <ChevronRight size={14} color="#C9A84C" />
          <Text style={tw`text-[10px] font-bold uppercase tracking-wider text-text-muted`}>Upcoming Queue</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-4`}>
          {activeBookings.filter(b => b.status === 'Confirmed').slice(0, 3).map((trip, idx) => (
            <View key={idx} style={tw`w-64 bg-card border border-border p-5 rounded-2xl`}>
              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={tw`text-accent-gold font-bold text-xs uppercase`}>
                  {trip.date ? format(new Date(trip.date), 'MMM dd') : 'TBD'}
                </Text>
                <Text style={tw`text-text-muted text-[10px] font-bold uppercase`}>{trip.timeOfPickup}</Text>
              </View>
              <Text style={tw`text-white font-bold text-base uppercase tracking-tight`} numberOfLines={1}>{trip.clientName}</Text>
              <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-wider mt-1`} numberOfLines={1}>{trip.destinations}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Porter Selection Modal */}
      <Modal visible={showPorterModal} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/80`}>
          <View style={tw`bg-card border-t border-border rounded-t-[2.5rem] p-8 gap-5 max-h-[70%]`}>
            <View style={tw`flex-row justify-between items-center`}>
              <View>
                <Text style={tw`text-lg font-bold text-white uppercase`}>Assign <Text style={tw`text-accent-gold`}>Personnel</Text></Text>
                <Text style={tw`text-text-muted text-[9px] uppercase font-bold tracking-widest mt-1`}>Ground Logistics Team</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPorterModal(false)} style={tw`w-8 h-8 rounded-lg bg-white/5 justify-center items-center`}>
                <Text style={tw`text-text-muted font-bold`}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`gap-3`}>
              {loadingPorters ? (
                <View style={tw`py-10 items-center`}>
                  <ActivityIndicator size="small" color="#C9A84C" />
                  <Text style={tw`text-text-muted text-xs font-bold uppercase tracking-wider mt-3`}>Scanning Grid...</Text>
                </View>
              ) : availablePorters.length > 0 ? (
                availablePorters.map((porter) => (
                  <TouchableOpacity 
                    key={porter.id}
                    onPress={() => handleCommenceTrip(porter)}
                    style={tw`w-full bg-surface border border-border p-4 rounded-xl flex-row items-center justify-between active:scale-98`}
                  >
                    <View style={tw`flex-row items-center gap-4`}>
                      <View style={tw`w-10 h-10 bg-accent-gold/10 rounded-xl justify-center items-center`}>
                        <User size={18} color="#C9A84C" />
                      </View>
                      <View>
                        <Text style={tw`text-white font-bold text-sm uppercase`}>{porter.name}</Text>
                        <Text style={tw`text-text-muted text-[8px] font-bold uppercase tracking-widest mt-0.5`}>Verified • {porter.totalTrips || 0} Missions</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#C9A84C" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={tw`py-10 items-center`}>
                  <Text style={tw`text-text-muted text-xs italic text-center`}>No approved porters currently on duty.</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              onPress={() => setShowPorterModal(false)}
              style={tw`w-full py-4 items-center`}
            >
              <Text style={tw`text-text-muted font-bold text-xs uppercase tracking-widest`}>Cancel Deployment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
