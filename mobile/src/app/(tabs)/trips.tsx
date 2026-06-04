import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import tw from '@/utils/tailwind';

export default function TripsTab() {
  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <View style={tw`w-16 h-16 bg-accent-gold/10 rounded-3xl justify-center items-center mb-4`}>
          <Briefcase size={32} color="#C9A84C" />
        </View>
        <Text style={tw`text-2xl font-bold text-white uppercase`}>Trips Queue</Text>
        <Text style={tw`text-text-muted text-xs uppercase tracking-widest mt-2 text-center`}>
          Detailed deployment histories and active manifests
        </Text>
      </View>
    </SafeAreaView>
  );
}
