import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Map, Eye, EyeOff } from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import tw from '@/utils/tailwind';

export default function SafariRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Form, 2: Face ID Prompt
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsVerifying(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      // Verify against drivers collection
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      const driverDoc = querySnapshot.empty ? null : querySnapshot.docs[0];

      setFormData(prev => ({
        ...prev,
        driverId: driverDoc?.id || '',
        fullName: driverDoc?.data()?.name || prev.fullName,
        isNewDriver: querySnapshot.empty,
      }));

      setStep(2);
    } catch (error: any) {
      console.error('[SafariRegister] Verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Verification check failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-10`}>
          
          {/* Header */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`w-12 h-12 bg-accent-green/20 rounded-xl items-center justify-center mb-3`}>
              <Map size={24} color="#2D6A4F" />
            </View>
            <Text style={tw`text-2xl font-bold text-white mb-1 uppercase tracking-tight text-center`}>
              Safari <Text style={tw`text-accent-green`}>Expedition</Text> Portal
            </Text>
            <Text style={tw`text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold`}>Driver Registration</Text>
          </View>

          {step === 1 ? (
            <View style={tw`w-full max-w-sm self-center gap-4`}>
              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <User size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="Full Name as per ID"
                  placeholderTextColor="#8A9E8F"
                  autoCapitalize="words"
                  value={formData.fullName}
                  onChangeText={(val) => handleInputChange('fullName', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Mail size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="Personal Email"
                  placeholderTextColor="#8A9E8F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleInputChange('email', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Phone size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#8A9E8F"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(val) => handleInputChange('phone', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Lock size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="Access Password"
                  placeholderTextColor="#8A9E8F"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={formData.password}
                  onChangeText={(val) => handleInputChange('password', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color="#8A9E8F" /> : <Eye size={18} color="#8A9E8F" />}
                </TouchableOpacity>
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Lock size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="Confirm Access Password"
                  placeholderTextColor="#8A9E8F"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={formData.confirmPassword}
                  onChangeText={(val) => handleInputChange('confirmPassword', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <TouchableOpacity
                onPress={handleStep1Submit}
                disabled={isVerifying}
                style={tw`w-full bg-accent-green py-4 rounded-xl flex-row items-center justify-center gap-2 mt-4 active:scale-95`}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Continue to Face ID</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`w-full max-w-sm self-center items-center`}>
              <View style={tw`bg-card border border-accent-green/20 p-6 rounded-3xl mb-8 w-full`}>
                <View style={tw`flex-row items-center gap-3 mb-4`}>
                  <View style={tw`w-10 h-10 bg-accent-green/20 rounded-lg items-center justify-center`}>
                    <ShieldCheck size={20} color="#2D6A4F" />
                  </View>
                  <Text style={tw`font-bold text-base text-white`}>Biometric Scan Required</Text>
                </View>
                <Text style={tw`text-text-muted text-xs leading-relaxed`}>
                  Safari drivers require high-security biometric ID for park access logging and live tracking verification. Please ensure you are in a well-lit area.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/safari/face-scan',
                    params: formData as any
                  });
                }}
                style={tw`w-full bg-accent-green py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
              >
                <Text style={tw`text-white font-bold uppercase tracking-widest text-sm`}>Start Face ID Scan</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
