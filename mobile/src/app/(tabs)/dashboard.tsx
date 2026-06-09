import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import DriverDashboardView from '@/components/dashboard/DriverDashboardView';
import PorterDashboardView from '@/components/dashboard/PorterDashboardView';
import SafariDashboardView from '@/components/dashboard/SafariDashboardView';
import tw from '@/utils/tailwind';

export default function DashboardScreen() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-primary-dark`}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (role === 'porter') {
    return <PorterDashboardView />;
  }

  if (role === 'safari_driver') {
    return <SafariDashboardView />;
  }

  return <DriverDashboardView />;
}
