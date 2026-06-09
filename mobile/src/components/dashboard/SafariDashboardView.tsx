import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MapPin, Compass, Anchor, ChevronRight, Users, Calendar, Clock, Tent, Car, ShieldCheck, AlertTriangle, Package, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useDriver } from '@/context/DriverContext';
import { useLocation } from '@/context/LocationContext';
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge';
import { db } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format, isValid } from 'date-fns';
import tw from '@/utils/tailwind';

export default function SafariDashboardView() {
  const router = useRouter();
  const { driverProfile, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);

  const today = new Date();
  
  // Find today's active safari booking
  const todaysSafari = activeBookings.find(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    if (!isValid(bookingDate)) return false;
    return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  // Upcoming confirmed bookings (excluding today)
  const upcomingBookings = activeBookings
    .filter(b => b.status === 'Confirmed' && b.id !== todaysSafari?.id)
    .slice(0, 4);

  const getPaymentColor = (status: string) => {
    if (status === 'Fully Paid') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'Partially Paid') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const handleTriggerSOS = async () => {
    if (!currentUser) return;
    
    Alert.alert(
      'EMERGENCY SOS',
      'This will broadcast your location and alert HQ operations. Are you in immediate danger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE SOS',
          style: 'destructive',
          onPress: async () => {
            setIsSendingSOS(true);
            try {
              // 1. Send SOS notification to Firestore
              await addDoc(collection(db, 'notifications'), {
                title: 'CRITICAL EMERGENCY — SOS TRIGGERED',
                message: `Safari driver ${driverProfile?.name || 'Ranger'} has triggered a distress signal at Lat: ${currentLocation?.latitude || 'N/A'}, Lng: ${currentLocation?.longitude || 'N/A'}`,
                type: 'ERROR',
                targetRole: 'admin',
                date: serverTimestamp(),
                read: false
              });

              // 2. Mark driver status as distressed in location telemetry
              await updateDoc(doc(db, 'driverLocations', currentUser.uid), {
                isDistressed: true,
                distressTriggeredAt: serverTimestamp()
              });

              Alert.alert('SOS Active', 'Distress signal successfully broadcasted to HQ. Maintain position if safe.');
            } catch (err: any) {
              console.error('[SafariSOS] Trigger error:', err);
              Alert.alert('Broadcast Failed', 'Unable to reach satellite dispatch. Use local cellular channels immediately.');
            } finally {
              setIsSendingSOS(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={tw`flex-1 bg-primary-dark`} contentContainerStyle={tw`p-5 pt-12 pb-24 gap-6`}>
      
      {/* Header */}
      <View style={tw`flex-row justify-between items-center px-1`}>
        <View>
          <Text style={tw`text-2xl font-bold text-white uppercase`}>
            FIELD <Text style={tw`text-accent-green`}>EXPEDITION</Text>
          </Text>
          <Text style={tw`text-accent-green font-bold text-[9px] uppercase tracking-widest mt-1`}>
            {format(today, 'EEEE, MMM do yyyy')}
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-3`}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={tw`w-10 h-8`}
            contentFit="contain"
          />
          <View style={tw`w-10 h-10 bg-card border border-border rounded-xl justify-center items-center`}>
            <MapPin size={20} color={isTracking ? '#2D6A4F' : '#8A9E8F'} />
          </View>
        </View>
      </View>

      {/* GPS Telemetry Card */}
      <View style={tw`bg-card border border-accent-green/20 p-5 rounded-[2rem] overflow-hidden`}>
        {currentLocation?.heading !== undefined && (
          <View style={[tw`absolute top-0 right-0 p-4 opacity-5`, { transform: [{ rotate: `${currentLocation.heading}deg` }] }]}>
            <Compass size={110} color="#2D6A4F" />
          </View>
        )}
        <View style={tw`z-10`}>
          <View style={tw`flex-row items-center gap-2 mb-3`}>
            <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: isTracking ? '#16A34A' : '#DC2626' }]} />
            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-text-muted`}>GPS TELEMETRY</Text>
          </View>
          
          <View style={tw`flex-row justify-between mb-4`}>
            <View>
              <Text style={tw`text-text-muted text-[9px] font-bold uppercase mb-1`}>LATITUDE</Text>
              <Text style={tw`font-mono text-base text-white font-bold`}>
                {currentLocation?.latitude?.toFixed(4) || '-1.2921'}
              </Text>
            </View>
            <View style={tw`pr-10`}>
              <Text style={tw`text-text-muted text-[9px] font-bold uppercase mb-1`}>LONGITUDE</Text>
              <Text style={tw`font-mono text-base text-white font-bold`}>
                {currentLocation?.longitude?.toFixed(4) || '36.8219'}
              </Text>
            </View>
          </View>

          <View style={tw`flex-row flex-wrap items-center gap-2`}>
            <View style={tw`px-3 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg`}>
              <Text style={tw`text-accent-green text-[9px] font-bold uppercase`}>Field Unit Active</Text>
            </View>
            <View style={tw`px-3 py-1 bg-white/5 rounded-lg`}>
              <Text style={tw`text-text-muted text-[9px] font-bold uppercase`}>
                Battery: {currentLocation?.batteryLevel ? Math.round(currentLocation.batteryLevel * 100) : 100}%
              </Text>
            </View>
            {currentUser?.uid && (
              <NetworkStatusBadge driverId={currentUser.uid} />
            )}
          </View>
        </View>
      </View>

      {/* Today's Mission Brief */}
      <View style={tw`gap-3`}>
        <View style={tw`flex-row items-center gap-2 px-1`}>
          <Anchor size={14} color="#2D6A4F" />
          <Text style={tw`text-[10px] font-bold uppercase tracking-wider text-text-muted`}>Active Expedition</Text>
        </View>

        {todaysSafari ? (
          <View style={tw`bg-surface border border-accent-green/15 rounded-3xl overflow-hidden`}>
            
            {/* Booking Header */}
            <View style={tw`p-5 border-b border-white/5 flex-row justify-between items-start`}>
              <View>
                <Text style={tw`text-white font-bold text-2xl tracking-tight leading-tight`}>{todaysSafari.clientName}</Text>
                <View style={tw`flex-row items-center gap-1.5 mt-1`}>
                  <Package size={11} color="#2D6A4F" />
                  <Text style={tw`text-accent-green text-[10px] font-bold uppercase tracking-widest`}>
                    {todaysSafari.packageName || 'Custom Safari'}
                  </Text>
                </View>
              </View>
              <View style={tw`px-2.5 py-1 bg-accent-green/10 border border-accent-green/20 rounded-full`}>
                <Text style={tw`text-accent-green text-[9px] font-bold uppercase`}>{todaysSafari.status || 'Active'}</Text>
              </View>
            </View>

            {/* Itinerary Grid */}
            <View style={tw`flex-row flex-wrap bg-white/5`}>
              {/* Destinations */}
              <View style={tw`w-full bg-surface p-4 border-b border-white/5`}>
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <MapPin size={10} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>Destinations</Text>
                </View>
                <Text style={tw`text-white font-bold text-sm leading-relaxed`}>
                  {todaysSafari.destinations || todaysSafari.location || 'Parks & Reserves TBD'}
                </Text>
              </View>

              {/* Duration */}
              <View style={tw`w-1/2 bg-surface p-4 border-r border-b border-white/5`}>
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <Clock size={10} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>Duration</Text>
                </View>
                <Text style={tw`text-white font-bold text-sm`}>{todaysSafari.durationText || '—'}</Text>
              </View>

              {/* Departs */}
              <View style={tw`w-1/2 bg-surface p-4 border-b border-white/5`}>
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <Calendar size={10} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>Departs</Text>
                </View>
                <Text style={tw`text-white font-bold text-sm`}>
                  {todaysSafari.date ? format(new Date(todaysSafari.date), 'MMM dd, yyyy') : '—'}
                </Text>
              </View>

              {/* Guests */}
              <View style={tw`w-1/2 bg-surface p-4 border-r border-white/5`}>
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <Users size={10} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>Guests</Text>
                </View>
                <Text style={tw`text-white font-bold text-sm`}>
                  {typeof todaysSafari.pax === 'object'
                    ? `${todaysSafari.pax.adults || 0}A ${todaysSafari.pax.children > 0 ? `· ${todaysSafari.pax.children}C` : ''}`
                    : `${todaysSafari.pax || 1} guests`
                  }
                </Text>
              </View>

              {/* Vehicle */}
              <View style={tw`w-1/2 bg-surface p-4`}>
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <Car size={10} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>Vehicle</Text>
                </View>
                <Text style={tw`text-white font-bold text-sm truncate`}>
                  {todaysSafari.vehicleId || 'Assigned by HQ'}
                </Text>
              </View>

              {/* Payment Status */}
              <View style={tw`w-full bg-surface p-4 border-t border-white/5`}>
                <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest mb-2`}>Payment Status</Text>
                <View style={tw`flex-row`}>
                  <View style={tw`px-3 py-1 border rounded-full flex-row items-center gap-1.5`}>
                    <Text style={tw`text-[10px] font-bold uppercase tracking-widest ${getPaymentColor(todaysSafari.paymentStatus).split(' ')[0]}`}>
                      {todaysSafari.paymentStatus || 'Unpaid'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Access Button */}
            <View style={tw`p-5`}>
              <TouchableOpacity 
                onPress={() => setShowDetailModal(true)}
                style={tw`w-full bg-accent-green py-4.5 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95 shadow-lg`}
              >
                <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Access Mission Data</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`bg-surface border border-dashed border-border p-12 rounded-[2rem] items-center justify-center`}>
            <Tent size={36} color="#8A9E8F" style={tw`opacity-30 mb-3`} />
            <Text style={tw`text-text-muted font-bold text-sm uppercase tracking-widest`}>No Active Expedition</Text>
            <Text style={tw`text-text-muted/50 text-[10px] mt-1 font-bold`}>Stand by for incoming mission brief</Text>
          </View>
        )}
      </View>

      {/* Upcoming Bookings Queue */}
      {upcomingBookings.length > 0 && (
        <View style={tw`gap-3`}>
          <View style={tw`flex-row items-center gap-2 px-1`}>
            <ChevronRight size={14} color="#2D6A4F" />
            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-text-muted`}>Upcoming Queue</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-4 pb-2`}>
            {upcomingBookings.map((trip, idx) => (
              <View key={idx} style={tw`w-64 bg-card border border-border p-5 rounded-2xl gap-2`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-accent-green font-mono text-xs font-bold uppercase`}>
                    {trip.date ? format(new Date(trip.date), 'MMM dd') : '—'}
                  </Text>
                  <View style={tw`px-2 py-0.5 bg-accent-green/10 border border-accent-green/20 rounded-full`}>
                    <Text style={tw`text-accent-green text-[8px] font-bold uppercase`}>{trip.status}</Text>
                  </View>
                </View>
                <Text style={tw`text-white font-bold text-base truncate uppercase tracking-tight`}>{trip.clientName}</Text>
                <Text style={tw`text-text-muted text-[10px] font-bold uppercase tracking-widest truncate`}>
                  {trip.packageName || trip.destinations || 'Package TBD'}
                </Text>
                <View style={tw`flex-row items-center gap-1.5 opacity-60`}>
                  <Users size={10} color="#F0EDE8" />
                  <Text style={tw`text-white text-[9px] font-bold`}>
                    {typeof trip.pax === 'object' 
                      ? `${trip.pax.adults || 0} Adults` 
                      : `${trip.pax || 1} guests`}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Emergency SOS Button */}
      <View style={tw`mt-4`}>
        <TouchableOpacity
          onPress={handleTriggerSOS}
          disabled={isSendingSOS}
          style={tw`w-full bg-danger-red/10 border border-danger-red/20 py-4.5 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95`}
        >
          {isSendingSOS ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <ShieldAlert size={20} color="#DC2626" />
              <Text style={tw`text-danger-red font-bold uppercase tracking-widest text-sm`}>Trigger Emergency SOS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={tw`text-[9px] text-center text-text-muted uppercase tracking-[0.3em] font-bold opacity-20 mt-4`}>
        Secure Handheld Operations Terminal
      </Text>

      {/* Mission Detail Modal */}
      {todaysSafari && (
        <Modal visible={showDetailModal} transparent animationType="slide">
          <View style={tw`flex-1 justify-end bg-black/80`}>
            <View style={tw`bg-card border-t border-accent-green/20 rounded-t-[2.5rem] p-8 gap-5 max-h-[85%]`}>
              
              {/* Modal Header */}
              <View style={tw`flex-row justify-between items-start`}>
                <View>
                  <Text style={tw`text-lg font-bold text-white uppercase`}>
                    Expedition <Text style={tw`text-accent-green`}>Manifest</Text>
                  </Text>
                  <Text style={tw`text-text-muted text-[9px] uppercase font-bold tracking-widest mt-1`}>
                    ID: {todaysSafari.id.substring(0, 8).toUpperCase()} • Active Duty
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowDetailModal(false)} 
                  style={tw`w-8 h-8 rounded-lg bg-white/5 justify-center items-center`}
                >
                  <Text style={tw`text-text-muted font-bold text-sm`}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable details */}
              <ScrollView contentContainerStyle={tw`gap-5 pb-6`}>
                
                <View style={tw`bg-surface border border-border p-4 rounded-xl gap-2`}>
                  <Text style={tw`text-accent-green text-[9px] font-bold uppercase tracking-widest`}>Client Profile</Text>
                  <Text style={tw`text-white font-bold text-lg`}>{todaysSafari.clientName}</Text>
                  <Text style={tw`text-text-muted text-xs`}>Email: {todaysSafari.clientEmail || 'N/A'}</Text>
                  <Text style={tw`text-text-muted text-xs`}>Phone: {todaysSafari.clientPhone || 'N/A'}</Text>
                </View>

                <View style={tw`bg-surface border border-border p-4 rounded-xl gap-2`}>
                  <Text style={tw`text-accent-green text-[9px] font-bold uppercase tracking-widest`}>Expedition Details</Text>
                  <View style={tw`gap-1`}>
                    <Text style={tw`text-white text-xs font-bold uppercase`}>Package: {todaysSafari.packageName || 'Custom Route'}</Text>
                    <Text style={tw`text-text-muted text-xs`}>Destinations: {todaysSafari.destinations || 'TBD'}</Text>
                    <Text style={tw`text-text-muted text-xs`}>Lodges: {todaysSafari.lodges?.join(', ') || 'N/A'}</Text>
                    <Text style={tw`text-text-muted text-xs`}>Vehicles assigned: {todaysSafari.vehicleId || 'N/A'}</Text>
                  </View>
                </View>

                <View style={tw`bg-surface border border-border p-4 rounded-xl gap-2`}>
                  <Text style={tw`text-accent-green text-[9px] font-bold uppercase tracking-widest`}>Itinerary Notes</Text>
                  <Text style={tw`text-white text-xs leading-relaxed`}>
                    {todaysSafari.notes || 'No custom instruction logs for this manifest.'}
                  </Text>
                </View>

                <View style={tw`bg-surface border border-border p-4 rounded-xl gap-2`}>
                  <Text style={tw`text-accent-green text-[9px] font-bold uppercase tracking-widest`}>Safety & Compliance Checklist</Text>
                  <Text style={tw`text-text-muted text-[10px]`}>✓ Vehicle safety pre-inspection logged</Text>
                  <Text style={tw`text-text-muted text-[10px]`}>✓ Satellite communications checked</Text>
                  <Text style={tw`text-text-muted text-[10px]`}>✓ First aid kits inventory verified</Text>
                  <Text style={tw`text-text-muted text-[10px]`}>✓ Park permits loaded in dashboard storage</Text>
                </View>

              </ScrollView>

              <TouchableOpacity 
                onPress={() => setShowDetailModal(false)}
                style={tw`w-full bg-accent-green py-4 rounded-xl items-center active:scale-95`}
              >
                <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Confirm & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
}
