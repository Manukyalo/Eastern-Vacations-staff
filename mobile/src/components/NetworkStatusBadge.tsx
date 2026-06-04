import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import tw from '@/utils/tailwind';

interface NetworkData {
  connectionType: string;
  isOnline: boolean;
  wifiSSID?: string;
  signalStrength?: number;
  downloadSpeed?: number;
  lastUpdated?: any;
}

export function NetworkStatusBadge({ driverId }: { driverId: string }) {
  const [network, setNetwork] = useState<NetworkData | null>(null);

  useEffect(() => {
    if (!driverId) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'driverNetwork', driverId),
      (snap) => {
        if (snap.exists()) {
          setNetwork(snap.data() as NetworkData);
        }
      },
      (err) => {
        console.log('[NetworkStatusBadge] Subscribe error:', err);
      }
    );
    
    return () => unsubscribe();
  }, [driverId]);

  if (!network) return null;

  const getIcon = () => {
    switch (network.connectionType) {
      case 'wifi': return '📶';
      case 'mobile_data': return '📱';
      case 'ethernet': return '🔌';
      default: return '❓';
    }
  };

  const getColor = () => {
    if (!network.isOnline) return '#EF4444'; // red
    switch (network.connectionType) {
      case 'wifi': return '#22C55E';      // green
      case 'mobile_data': return '#F59E0B'; // amber
      case 'ethernet': return '#3B82F6';   // blue
      default: return '#8A9E8F';           // gray
    }
  };

  const getLabel = () => {
    if (!network.isOnline) return 'Offline';
    if (network.connectionType === 'wifi' && network.wifiSSID) {
      return `WiFi: ${network.wifiSSID}`;
    }
    if (network.connectionType === 'mobile_data') {
      return 'Mobile Data';
    }
    return network.connectionType;
  };

  const getSignalBars = (strength?: number) => {
    if (!strength) return '';
    if (strength >= -50) return '▂▄▆█';
    if (strength >= -60) return '▂▄▆░';
    if (strength >= -70) return '▂▄░░';
    return '▂░░░';
  };

  const timeSince = () => {
    if (!network.lastUpdated) return '';
    try {
      const date = network.lastUpdated.toDate();
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 60) return `${seconds}s`;
      return `${Math.floor(seconds / 60)}m`;
    } catch {
      return '';
    }
  };

  const color = getColor();

  return (
    <View style={[
      tw`flex-row items-center gap-1.5 rounded-full px-3 py-1 border`,
      {
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
      }
    ]}>
      <Text style={{ color }}>{getIcon()}</Text>
      <Text style={[tw`text-[10px] font-bold`, { color }]}>{getLabel()}</Text>
      {network.signalStrength && (
        <Text style={[tw`text-[10px] opacity-85 font-semibold`, { color, letterSpacing: -1 }]}>
          {getSignalBars(network.signalStrength)}
        </Text>
      )}
      {network.downloadSpeed && network.downloadSpeed > 0 ? (
        <Text style={[tw`text-[9px] opacity-70 font-normal`, { color }]}>
          ↓{network.downloadSpeed}KB/s
        </Text>
      ) : null}
      {timeSince() ? (
        <Text style={[tw`text-[8px] opacity-50 font-normal ml-0.5`, { color }]}>
          {timeSince()}
        </Text>
      ) : null}
    </View>
  );
}
