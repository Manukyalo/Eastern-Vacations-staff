import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import tw from '@/utils/tailwind';

export default function DriverPendingApprovalScreen() {
  const { driverProfile, driverAuth, logout } = useAuth();
  const router = useRouter();

  const handleContactAdmin = () => {
    const phone = process.env.EXPO_PUBLIC_ADMIN_WHATSAPP || '254733748586';
    Linking.openURL(`https://wa.me/${phone}`);
  };

  const handleCheckStatus = () => {
    // Reload can be simulated or we check if auth record updated, which the AuthContext onSnapshot handles automatically.
    // If approved, AuthContext triggers redirect in index or layouts.
    // We can also double check by redirecting to root to trigger the auth redirect check.
    router.replace('/');
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'porter': return 'Logistics Support';
      case 'tour_guide': return 'City Tour Guide';
      default: return 'Fleet Driver';
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <View style={tw`flex-1 justify-center px-6 items-center`}>
        
        {/* Animated Hourglass / Clock Simulation */}
        <View style={tw`relative w-24 h-24 mb-8 justify-center items-center`}>
          <View style={tw`absolute inset-0 bg-accent-gold/10 rounded-full blur-xl`} />
          <View style={tw`w-full h-full bg-surface border border-accent-gold/20 rounded-[2rem] justify-center items-center`}>
            <Clock size={40} color="#C9A84C" />
          </View>
        </View>

        <Text style={tw`text-3xl font-bold text-white mb-4 uppercase tracking-tight text-center`}>
          Pending <Text style={tw`text-accent-gold`}>Approval</Text>
        </Text>

        <View style={tw`w-full max-w-sm bg-card border border-border p-6 rounded-[2rem] mb-8`}>
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <Text style={tw`text-text-muted text-xs font-bold uppercase tracking-widest`}>Account Status</Text>
            {/* Status Badge */}
            <View style={tw`px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full`}>
              <Text style={tw`text-amber-500 text-[10px] font-bold uppercase tracking-wider`}>Awaiting Verification</Text>
            </View>
          </View>

          <View style={tw`gap-4`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border justify-center items-center`}>
                {driverAuth?.faceImageUrl ? (
                  <Image source={{ uri: driverAuth.faceImageUrl }} style={tw`w-full h-full`} contentFit="cover" />
                ) : (
                  <ShieldCheck size={20} color="#8A9E8F" style={tw`opacity-30`} />
                )}
              </View>
              <View>
                <Text style={tw`text-white font-bold text-base`}>{driverProfile?.name || 'Driver Name'}</Text>
                <Text style={tw`text-text-muted text-xs uppercase tracking-wider mt-0.5`}>
                  {driverAuth?.role ? getRoleText(driverAuth.role) : 'Personnel'}
                </Text>
              </View>
            </View>

            <Text style={tw`text-text-muted text-sm leading-relaxed mt-2`}>
              Your {driverAuth?.role || 'personnel'} application is currently being reviewed by our dispatch team. You will be notified once your face ID is verified for duty.
            </Text>
          </View>
        </View>

        <View style={tw`w-full max-w-sm gap-4`}>
          <TouchableOpacity
            onPress={handleContactAdmin}
            style={tw`w-full bg-white/5 border border-white/10 py-4 rounded-xl flex-row items-center justify-center gap-3 active:scale-95`}
          >
            <MessageSquare size={18} color="#25D366" />
            <Text style={tw`text-white font-bold uppercase tracking-wider text-sm`}>Contact Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCheckStatus}
            style={tw`w-full items-center py-2.5`}
          >
            <Text style={tw`text-accent-gold text-xs font-bold tracking-widest uppercase`}>
              Check Status Manually
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={logout}
            style={tw`w-full items-center py-1`}
          >
            <Text style={tw`text-red-500 text-xs font-bold tracking-widest uppercase`}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={tw`mt-12 text-[9px] text-text-muted uppercase tracking-[0.25em] font-bold opacity-30 text-center`}>
          Secure Biometric Verification • EV Systems
        </Text>

      </View>
    </SafeAreaView>
  );
}
