import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, History, User, Zap, MapPin, Clock, Briefcase, ShieldCheck, ChevronRight } from 'lucide-react-native';
import tw from '@/utils/tailwind';

export default function PorterDashboardView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let driverData: any = null;
    let porterData: any = null;

    const handleMerge = (dData: any, pData: any) => {
      if (!dData && !pData) return;
      setProfile({
        ...dData,
        ...pData
      });
      setLoading(false);
    };

    const unsubDriver = onSnapshot(doc(db, 'drivers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        driverData = docSnap.data();
      }
      handleMerge(driverData, porterData);
    }, (err) => {
      console.error('[PorterDashboardView] Driver doc error:', err);
      setLoading(false);
    });

    const unsubPorter = onSnapshot(doc(db, 'porters', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        porterData = docSnap.data();
      }
      handleMerge(driverData, porterData);
    }, (err) => {
      console.error('[PorterDashboardView] Porter doc error:', err);
      setLoading(false);
    });

    return () => {
      unsubDriver();
      unsubPorter();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark gap-4`}>
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text style={tw`text-[10px] text-text-muted font-bold uppercase tracking-widest`}>Syncing Operations...</Text>
      </View>
    );
  }

  const getDeploymentTimeText = () => {
    if (!profile?.deploymentTime) return '--:--';
    try {
      const date = profile.deploymentTime.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <ScrollView style={tw`flex-1 bg-primary-dark`} contentContainerStyle={tw`p-6 pt-12 pb-24 gap-6`}>
      
      {/* Header */}
      <View style={tw`flex-row justify-between items-center px-1`}>
        <View style={tw`gap-1`}>
          <Text style={tw`text-2xl font-bold text-white uppercase`}>
            PORTER <Text style={tw`text-accent-gold`}>UNIT</Text>
          </Text>
          <View style={tw`flex-row items-center gap-1.5`}>
            <Zap size={10} color="#C9A84C" />
            <Text style={tw`text-text-muted text-[9px] font-bold uppercase tracking-widest`}>
              Live Deployment Status
            </Text>
          </View>
        </View>
        <View style={tw`w-12 h-12 rounded-2xl bg-card border border-border justify-center items-center`}>
          <User size={24} color="#C9A84C" />
        </View>
      </View>

      {/* Balance Card */}
      <View style={tw`relative`}>
        <View style={tw`absolute inset-0 bg-accent-gold/5 rounded-[3rem] blur-3xl`} />
        <View style={tw`bg-card border border-border p-8 rounded-[2.5rem] overflow-hidden`}>
          
          <TrendingUp size={110} color="#C9A84C" style={tw`absolute -right-6 -bottom-6 opacity-5`} />
          
          <View style={tw`gap-1`}>
            <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-accent-gold`}>Live Trip Balance</Text>
            <View style={tw`flex-row items-baseline gap-2 mt-1`}>
              <Text style={tw`text-6xl font-mono font-black text-white`}>
                {(profile?.totalTrips || 0).toString().padStart(2, '0')}
              </Text>
              <Text style={tw`text-xs font-bold text-text-muted uppercase`}>Credits</Text>
            </View>
          </View>
          
          <View style={tw`mt-8 pt-6 border-t border-border/50 flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: profile?.status === 'Active' ? '#16A34A' : '#DC2626' }]} />
              <Text style={tw`text-[10px] font-bold uppercase tracking-wider text-text-muted`}>
                Status: <Text style={{ color: profile?.status === 'Active' ? '#16A34A' : '#DC2626' }}>{profile?.status || 'Inactive'}</Text>
              </Text>
            </View>
            <Text style={tw`text-[8px] font-bold text-text-muted uppercase tracking-wider italic`}>Read-only metadata</Text>
          </View>

        </View>
      </View>

      {/* Assignment Card */}
      <View style={tw`gap-3`}>
        <Text style={tw`text-[10px] font-bold text-text-muted uppercase tracking-widest px-1`}>Active Assignment</Text>
        
        {profile?.assignedDriverId ? (
          <View style={tw`bg-surface border border-border p-6 rounded-[2rem] gap-5 relative`}>
            
            <View style={tw`absolute top-4 right-4`}>
              <View style={tw`bg-accent-gold/10 border border-accent-gold/20 px-2.5 py-0.5 rounded-full`}>
                <Text style={tw`text-accent-gold text-[8px] font-bold uppercase tracking-widest`}>Deployed</Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-card border border-border justify-center items-center overflow-hidden`}>
                {profile?.driverPhoto ? (
                  <Image source={{ uri: profile.driverPhoto }} style={tw`w-full h-full`} contentFit="cover" />
                ) : (
                  <User size={28} color="#8A9E8F" style={tw`opacity-20`} />
                )}
              </View>
              <View>
                <Text style={tw`text-white font-bold text-lg leading-none mb-1`}>{profile?.assignedDriverName || 'Fleet Driver'}</Text>
                <View style={tw`flex-row items-center gap-1`}>
                  <ShieldCheck size={10} color="#C9A84C" />
                  <Text style={tw`text-text-muted text-[10px] font-bold uppercase tracking-wider`}>Authorized Personnel</Text>
                </View>
              </View>
            </View>

            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1 bg-primary-dark/40 border border-border/10 p-4 rounded-xl gap-1`}>
                <Text style={tw`text-[8px] font-bold text-text-muted uppercase tracking-widest`}>Operation Type</Text>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Briefcase size={12} color="#C9A84C" />
                  <Text style={tw`text-xs font-bold text-white uppercase`}>{profile?.transferType || 'Logistics'}</Text>
                </View>
              </View>
              <View style={tw`flex-1 bg-primary-dark/40 border border-border/10 p-4 rounded-xl gap-1`}>
                <Text style={tw`text-[8px] font-bold text-text-muted uppercase tracking-widest`}>Start Time</Text>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Clock size={12} color="#C9A84C" />
                  <Text style={tw`text-xs font-bold text-white uppercase`}>{getDeploymentTimeText()}</Text>
                </View>
              </View>
            </View>

          </View>
        ) : (
          <View style={tw`bg-card border border-dashed border-border p-10 rounded-[2rem] items-center justify-center gap-3`}>
            <View style={tw`w-14 h-14 rounded-full bg-border/20 justify-center items-center opacity-30`}>
              <MapPin size={28} color="#8A9E8F" />
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-white font-bold uppercase tracking-wider text-xs`}>Waiting for Dispatch</Text>
              <Text style={tw`text-[8px] text-text-muted font-bold uppercase tracking-widest mt-1`}>Deployment Queue: Standing By</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Banner */}
      <TouchableOpacity 
        onPress={() => router.push('/driver/trips' as any)}
        style={tw`bg-accent-gold/5 border border-accent-gold/10 p-5 rounded-[2rem] flex-row items-center justify-between active:scale-98`}
      >
        <View style={tw`flex-row items-center gap-4`}>
          <View style={tw`w-10 h-10 rounded-xl bg-accent-gold/20 justify-center items-center`}>
            <History size={18} color="#C9A84C" />
          </View>
          <View>
            <Text style={tw`text-white font-bold text-xs uppercase`}>Trip History</Text>
            <Text style={tw`text-[8px] text-text-muted font-bold uppercase tracking-widest mt-0.5`}>View past deployments</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#C9A84C" />
      </TouchableOpacity>

      <Text style={tw`text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] opacity-35 text-center mt-6`}>
        Eastern Vacations © 2026 Logistic Hub
      </Text>

    </ScrollView>
  );
}
