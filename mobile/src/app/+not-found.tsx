import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import tw from '@/utils/tailwind';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
        <View style={tw`flex-1 justify-center px-6 items-center`}>
          <View style={tw`w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[2rem] justify-center items-center mb-6`}>
            <AlertCircle size={40} color="#EF4444" />
          </View>

          <Text style={tw`text-3xl font-bold text-white mb-2 uppercase tracking-tight text-center`}>
            Route <Text style={tw`text-red-500`}>Not Found</Text>
          </Text>
          
          <Text style={tw`text-text-muted text-xs uppercase tracking-widest text-center mb-8 max-w-[280px]`}>
            The screen you are trying to access does not exist or has been relocated.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={tw`bg-accent-gold px-8 py-4 rounded-xl flex-row items-center gap-2 active:scale-95`}
          >
            <ArrowLeft size={16} color="#0A0F0D" />
            <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-sm`}>
              Return to Safety
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}
