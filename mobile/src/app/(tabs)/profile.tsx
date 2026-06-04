import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import tw from '@/utils/tailwind';

export default function ProfileTab() {
  const router = useRouter();
  const { driverProfile, driverAuth, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', 'Logout failed');
    }
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
      <View style={tw`flex-1 justify-center items-center px-6 gap-6`}>
        
        <View style={tw`items-center`}>
          <View style={tw`w-20 h-20 bg-accent-gold/10 rounded-full justify-center items-center mb-4 border border-accent-gold/20`}>
            <User size={40} color="#C9A84C" />
          </View>
          <Text style={tw`text-2xl font-bold text-white uppercase`}>
            {driverProfile?.name || 'Personnel Profile'}
          </Text>
          <Text style={tw`text-accent-gold text-xs uppercase tracking-widest mt-1 font-bold`}>
            {driverAuth?.role ? getRoleText(driverAuth.role) : 'Verified Staff'}
          </Text>
        </View>

        <View style={tw`w-full max-w-sm bg-card border border-border p-6 rounded-[2rem] gap-4`}>
          <View>
            <Text style={tw`text-text-muted text-[10px] font-bold uppercase tracking-wider`}>Personal Email</Text>
            <Text style={tw`text-white font-semibold text-sm mt-1`}>{driverProfile?.email || driverAuth?.email || 'N/A'}</Text>
          </View>
          
          <View>
            <Text style={tw`text-text-muted text-[10px] font-bold uppercase tracking-wider`}>Contact Phone</Text>
            <Text style={tw`text-white font-semibold text-sm mt-1`}>{driverProfile?.phone || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={tw`w-full max-w-sm bg-red-500/10 border border-red-500/20 py-4 rounded-xl flex-row items-center justify-center gap-3 active:scale-95`}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={tw`text-red-500 font-bold uppercase tracking-wider text-sm`}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
