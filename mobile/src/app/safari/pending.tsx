import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import tw from '@/utils/tailwind';

export default function SafariPendingApprovalScreen() {
  const { driverProfile, driverAuth, logout } = useAuth();
  const router = useRouter();

  const handleContactAdmin = () => {
    const phone = process.env.EXPO_PUBLIC_ADMIN_WHATSAPP || '254733748586';
    Linking.openURL(`https://wa.me/${phone}`);
  };

  const handleCheckStatus = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <View style={tw`flex-1 justify-center px-6 items-center`}>
        
        {/* Hourglass Icon */}
        <View style={tw`relative w-24 h-24 mb-8 justify-center items-center`}>
          <View style={tw`absolute inset-0 bg-accent-green/10 rounded-full blur-xl`} />
          <View style={tw`w-full h-full bg-surface border border-accent-green/20 rounded-[2rem] justify-center items-center`}>
            <Clock size={40} color="#2D6A4F" />
          </View>
        </View>

        <Text style={tw`text-3xl font-bold text-white mb-4 uppercase tracking-tight text-center`}>
          Pending <Text style={tw`text-accent-green`}>Approval</Text>
        </Text>

        <View style={tw`w-full max-w-sm bg-card border border-border p-6 rounded-[2rem] mb-8`}>
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <Text style={tw`text-text-muted text-xs font-bold uppercase tracking-widest`}>Account Status</Text>
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
                  Safari Expedition Driver
                </Text>
              </View>
            </View>

            <Text style={tw`text-text-muted text-sm leading-relaxed mt-2`}>
              Your Safari Expedition application is being reviewed. The operations team will verify your biometric profile for park access logging.
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
            <Text style={tw`text-accent-green text-xs font-bold tracking-widest uppercase`}>
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
