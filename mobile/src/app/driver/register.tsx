import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Car, Eye, EyeOff, Zap } from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import tw from '@/utils/tailwind';

export default function DriverRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Role, 2: Credentials, 3: Biometrics setup redirect
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'driver', // default
    porterName: '',
    porterTrips: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2); // Proceed to credentials
  };

  const handleStep2Submit = async () => {
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
      const colRef = formData.role === 'porter' ? collection(db, 'porters') : collection(db, 'drivers');
      const q = query(colRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      const driverDoc = querySnapshot.empty ? null : querySnapshot.docs[0];

      setFormData(prev => ({
        ...prev,
        driverId: driverDoc?.id || null,
        fullName: driverDoc?.data()?.name || prev.fullName,
        isNewDriver: querySnapshot.empty
      }));

      setStep(3);
    } catch (error: any) {
      console.error('[DriverRegister] Verification error:', error);
      Alert.alert('Verification Failed', error.message || 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const roles = [
    { id: 'driver', title: 'Driver', icon: <Car size={22} color="#C9A84C" />, desc: 'Standard City & Fleet Operations' },
    { id: 'porter', title: 'Porter', icon: <User size={22} color="#C9A84C" />, desc: 'Baggage & Logistics Support' },
    { id: 'tour_guide', title: 'Tour Guide', icon: <ArrowRight size={22} color="#C9A84C" />, desc: 'Urban & City Excursions' }
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}>
          
          {/* Header */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`w-12 h-12 bg-accent-gold/20 rounded-xl items-center justify-center mb-3`}>
              <ShieldCheck size={24} color="#C9A84C" />
            </View>
            <Text style={tw`text-2xl font-bold text-white mb-1 uppercase tracking-tight`}>
              City <Text style={tw`text-accent-gold`}>Operations</Text> Portal
            </Text>
            <Text style={tw`text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold`}>Personnel Registration</Text>
          </View>

          {step === 1 && (
            <View style={tw`w-full max-w-sm self-center gap-4`}>
              <Text style={tw`text-white font-bold text-sm uppercase tracking-wider text-center mb-2`}>
                Select Your Professional Role
              </Text>
              
              {roles.map(r => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => handleRoleSelect(r.id)}
                  style={tw`relative p-5 rounded-3xl border ${formData.role === r.id ? 'bg-accent-gold border-accent-gold shadow-md' : 'bg-surface border-border'} flex-row items-center gap-4 active:scale-98`}
                >
                  <View style={tw`w-12 h-12 rounded-2xl items-center justify-center ${formData.role === r.id ? 'bg-primary-dark' : 'bg-card'}`}>
                    {r.icon}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold uppercase tracking-tight ${formData.role === r.id ? 'text-primary-dark' : 'text-white'}`}>{r.title}</Text>
                    <Text style={tw`text-[9px] font-bold uppercase tracking-widest ${formData.role === r.id ? 'text-primary-dark/60' : 'text-text-muted'} mt-0.5`}>{r.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setStep(2)}
                style={tw`w-full bg-accent-gold py-4 rounded-xl flex-row items-center justify-center gap-2 mt-4 active:scale-95`}
              >
                <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-sm`}>Confirm Role</Text>
                <ArrowRight size={16} color="#0A0F0D" />
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={tw`w-full max-w-sm self-center gap-4`}>
              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <User size={18} color="#C9A84C" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="FULL NAME"
                  placeholderTextColor="#8A9E8F"
                  autoCapitalize="words"
                  value={formData.fullName}
                  onChangeText={(val) => handleInputChange('fullName', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Mail size={18} color="#C9A84C" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="EMAIL ADDRESS"
                  placeholderTextColor="#8A9E8F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleInputChange('email', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Phone size={18} color="#C9A84C" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="PHONE NUMBER"
                  placeholderTextColor="#8A9E8F"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(val) => handleInputChange('phone', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                <Lock size={18} color="#C9A84C" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="CREATE PASSWORD"
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
                <Lock size={18} color="#C9A84C" style={tw`mr-3 opacity-70`} />
                <TextInput
                  placeholder="CONFIRM PASSWORD"
                  placeholderTextColor="#8A9E8F"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={formData.confirmPassword}
                  onChangeText={(val) => handleInputChange('confirmPassword', val)}
                  style={tw`flex-1 text-white text-xs font-bold uppercase tracking-widest`}
                />
              </View>

              {formData.role === 'driver' && (
                <View style={tw`mt-2 gap-3`}>
                  <View style={tw`h-px bg-border opacity-50 my-2`} />
                  <Text style={tw`text-[9px] text-accent-gold font-bold uppercase tracking-[0.2em]`}>Ground Ops Pairing (Optional)</Text>
                  
                  <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                    <User size={16} color="#C9A84C" style={tw`mr-3 opacity-40`} />
                    <TextInput
                      placeholder="RECURRING PORTER NAME"
                      placeholderTextColor="#8A9E8F"
                      autoCapitalize="words"
                      value={formData.porterName}
                      onChangeText={(val) => handleInputChange('porterName', val)}
                      style={tw`flex-1 text-white text-[10px] font-bold uppercase tracking-widest`}
                    />
                  </View>

                  <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                    <Zap size={16} color="#C9A84C" style={tw`mr-3 opacity-40`} />
                    <TextInput
                      placeholder="ESTIMATED TOTAL TRIPS TOGETHER"
                      placeholderTextColor="#8A9E8F"
                      keyboardType="numeric"
                      value={formData.porterTrips}
                      onChangeText={(val) => handleInputChange('porterTrips', val)}
                      style={tw`flex-1 text-white text-[10px] font-bold uppercase tracking-widest`}
                    />
                  </View>
                </View>
              )}

              <View style={tw`flex-row gap-3 mt-4`}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={tw`w-1/3 border border-border py-4 rounded-xl items-center justify-center active:scale-95`}
                >
                  <Text style={tw`text-white font-bold uppercase tracking-widest text-xs`}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStep2Submit}
                  disabled={isVerifying}
                  style={tw`flex-1 bg-accent-gold py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#0A0F0D" />
                  ) : (
                    <>
                      <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-xs`}>Continue</Text>
                      <ArrowRight size={16} color="#0A0F0D" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={tw`w-full max-w-sm self-center items-center`}>
              <View style={tw`bg-card border border-accent-gold/20 p-6 rounded-3xl mb-8 w-full`}>
                <View style={tw`flex-row items-center gap-3 mb-4`}>
                  <View style={tw`w-10 h-10 bg-accent-gold/20 rounded-lg items-center justify-center`}>
                    <ShieldCheck size={20} color="#C9A84C" />
                  </View>
                  <Text style={tw`font-bold text-base text-white`}>Identity Check</Text>
                </View>
                <Text style={tw`text-text-muted text-xs leading-relaxed`}>
                  We use secure biometrics to verify authorized drivers. Please ensure you are in a well-lit area for the face scan.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Camera Setup', 'Directing to Face ID Biometrics Camera Setup.');
                  // In a complete implementation, navigate to face-scan screen
                  // router.push({ pathname: '/driver/face-scan', params: { ...formData } });
                }}
                style={tw`w-full bg-accent-gold py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95`}
              >
                <Text style={tw`text-primary-dark font-bold uppercase tracking-widest text-sm`}>Start Face ID Setup</Text>
                <ArrowRight size={16} color="#0A0F0D" />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
