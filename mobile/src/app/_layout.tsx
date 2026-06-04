import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { DriverProvider } from '@/context/DriverContext';
import { LocationProvider } from '@/context/LocationContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
              <Stack.Screen name="(tabs)" />
            </Stack>
          </LocationProvider>
        </DriverProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
