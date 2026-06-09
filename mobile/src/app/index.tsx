import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Car, Map as MapIcon, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import tw from '@/utils/tailwind';

export default function LandingScreen() {
  const router = useRouter();
  const { currentUser, role, isApproved, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentUser && role) {
      if (isApproved) {
        router.replace('/dashboard');
      } else {
        if (role === 'safari_driver') {
          router.replace('/safari/pending');
        } else {
          router.replace('/driver/pending');
        }
      }
    }
  }, [currentUser, role, isApproved, isLoading]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark`}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <View style={tw`flex-1 px-6 justify-center items-center`}>
        
        {/* Glow Effects (Simulated with absolute views) */}
        <View style={tw`absolute top-0 left-0 w-48 h-48 bg-accent-gold/5 rounded-full -m-10 blur-3xl`} />
        <View style={tw`absolute bottom-0 right-0 w-48 h-48 bg-accent-green/5 rounded-full -m-10 blur-3xl`} />

        {/* Brand Logo */}
        <View style={tw`p-4 bg-card border border-border rounded-3xl mb-6 shadow-lg`}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={tw`w-24 h-12`}
            contentFit="contain"
          />
        </View>

        {/* Hero Title */}
        <View style={tw`items-center mb-10`}>
          <Text style={tw`text-3xl font-bold text-white tracking-tighter text-center uppercase`}>
            OPERATIONAL <Text style={tw`text-accent-gold`}>PORTAL</Text>
          </Text>
          <Text style={tw`text-text-muted text-xs tracking-wider text-center uppercase mt-2 max-w-[280px]`}>
            Official logistics & dispatch system for staff personnel
          </Text>
        </View>

        {/* Grid Buttons */}
        <View style={tw`w-full max-w-sm gap-4`}>
          
          <TouchableOpacity
            onPress={() => router.push('/driver/login')}
            style={tw`relative bg-card border border-border p-6 rounded-3xl flex-row items-center gap-4 active:scale-95 shadow-md`}
          >
            <View style={tw`p-3 bg-accent-gold/10 rounded-2xl text-accent-gold`}>
              <Car size={28} color="#C9A84C" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-white uppercase tracking-tight`}>City Operations</Text>
              <Text style={tw`text-[9px] text-text-muted font-bold tracking-widest uppercase mt-0.5`}>Airport & City Logistics</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/safari/login' as any)}
            style={tw`relative bg-card border border-border p-6 rounded-3xl flex-row items-center gap-4 active:scale-95 shadow-md`}
          >
            <View style={tw`p-3 bg-accent-green/10 rounded-2xl text-accent-green`}>
              <MapIcon size={28} color="#2D6A4F" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-white uppercase tracking-tight`}>Safari Expedition</Text>
              <Text style={tw`text-[9px] text-text-muted font-bold tracking-widest uppercase mt-0.5`}>Parks & Wilderness Tours</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Footer Secured Badge */}
        <View style={tw`flex-row items-center gap-2 mt-12 opacity-60`}>
          <ShieldCheck size={14} color="#16A34A" />
          <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-text-muted`}>
            Secured Access
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
