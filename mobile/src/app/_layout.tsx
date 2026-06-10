import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { AuthProvider } from '@/context/AuthContext';
import { DriverProvider } from '@/context/DriverContext';
import { LocationProvider } from '@/context/LocationContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function checkForUpdatesSilently() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Silent catch to prevent app crashing on update failure (e.g. offline status)
        console.warn('Silent update check failed:', error);
      }
    }
    checkForUpdatesSilently();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DriverProvider>
          <LocationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="driver/login" />
              <Stack.Screen name="driver/register" />
              <Stack.Screen name="driver/pending" />
              <Stack.Screen name="safari/login" />
              <Stack.Screen name="safari/register" />
              <Stack.Screen name="safari/face-scan" />
              <Stack.Screen name="safari/pending" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </LocationProvider>
        </DriverProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
