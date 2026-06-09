import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, UserPlus, Map } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import FaceBiometricVerifier from '@/components/face/FaceBiometricVerifier';
import tw from '@/utils/tailwind';

export default function SafariLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState(1); // 1: Credentials, 2: Biometrics Scan
  const [storedData, setStoredData] = useState<any>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Fetch driverAuth details to verify they have safari access
      const authRef = doc(db, 'driverAuth', user.uid);
      const authSnap = await getDoc(authRef);

      if (!authSnap.exists()) {
        Alert.alert('Access Denied', 'Auth record not found. Please register first.');
        setIsLoading(false);
        return;
      }

      const data = authSnap.data();

      // Ensure their role matches safari_driver
      if (data.role !== 'safari_driver') {
        Alert.alert('Access Denied', 'This terminal is for Safari Expedition crews only.');
        setIsLoading(false);
        return;
      }

      if (!data.approved) {
        setIsLoading(false);
        router.replace('/safari/pending');
        return;
      }

      setStoredData(data);
      setLoginStep(2);
    } catch (error: any) {
      console.error('[SafariLogin] Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricSuccess = () => {
    Alert.alert('Welcome', 'Welcome back, Ranger!');
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-primary-dark`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-10`}>
          
          {/* Logo */}
          <View style={tw`items-center mb-8`}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={tw`w-20 h-10`}
              contentFit="contain"
            />
          </View>

          {loginStep === 1 ? (
            <View style={tw`w-full max-w-sm self-center`}>
              <View style={tw`items-center mb-8`}>
                <View style={tw`w-14 h-14 bg-accent-green/10 border border-accent-green/20 rounded-2xl items-center justify-center mb-3`}>
                  <Map size={26} color="#2D6A4F" />
                </View>
                <Text style={tw`text-2xl font-bold text-white mb-1 uppercase tracking-tight`}>SAFARI LOGIN</Text>
                <Text style={tw`text-text-muted text-[10px] uppercase tracking-widest font-bold`}>Expedition Field Access</Text>
              </View>

              {/* Form Inputs */}
              <View style={tw`gap-4`}>
                <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                  <Mail size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                  <TextInput
                    placeholder="Personal Email"
                    placeholderTextColor="#8A9E8F"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={tw`flex-1 text-white text-sm`}
                  />
                </View>

                <View style={tw`relative flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5`}>
                  <Lock size={18} color="#2D6A4F" style={tw`mr-3 opacity-70`} />
                  <TextInput
                    placeholder="Field Password"
                    placeholderTextColor="#8A9E8F"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    style={tw`flex-1 text-white text-sm`}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={tw`bg-accent-green py-4 rounded-xl flex-row items-center justify-center gap-2 mt-4 active:scale-95`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={tw`text-white font-bold uppercase tracking-widest text-sm`}>Access Safe</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign Up Redirect */}
              <View style={tw`mt-8 pt-8 border-t border-border gap-4`}>
                <TouchableOpacity
                  onPress={() => router.push('/safari/register')}
                  style={tw`flex-row items-center justify-center gap-2 py-3`}
                >
                  <UserPlus size={16} color="#8A9E8F" />
                  <Text style={tw`text-text-muted text-sm`}>Join expedition crew</Text>
                </TouchableOpacity>

                <View style={tw`flex-row items-center gap-2 justify-center opacity-40`}>
                  <ShieldCheck size={12} color="#8A9E8F" />
                  <Text style={tw`text-[9px] text-text-muted font-bold tracking-widest uppercase`}>
                    Protected by Biometric Security
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={tw`w-full max-w-sm self-center items-center`}>
              <View style={tw`items-center mb-6`}>
                <Text style={tw`text-xl font-bold text-white mb-1 uppercase tracking-tight`}>BIOMETRIC VERIFICATION</Text>
                <Text style={tw`text-accent-green text-[10px] font-bold uppercase tracking-widest`}>Verifying Ranger Identity</Text>
              </View>

              <FaceBiometricVerifier
                storedDescriptor={storedData?.faceDescriptor}
                onSuccess={handleBiometricSuccess}
                onFail={() => {
                  Alert.alert('Biometric Failed', 'Identity not recognized. Please try again.');
                  setLoginStep(1);
                }}
              />

              <TouchableOpacity
                onPress={() => setLoginStep(1)}
                style={tw`mt-4 py-2`}
              >
                <Text style={tw`text-text-muted text-xs uppercase tracking-widest`}>Back to Credentials</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
