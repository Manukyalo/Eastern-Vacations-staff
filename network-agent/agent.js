const admin = require('firebase-admin');
const wifiName = require('wifi-name');
const si = require('systeminformation');
const schedule = require('node-schedule');
const os = require('os');
const fs = require('fs');

// Load service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eastern-vacations-system.firebaseio.com'
});

const db = admin.firestore();

// Get device identifier (use hostname or stored UID)
function getDeviceId() {
  const configPath = './device-config.json';
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    return config.driverId;
  }
  return os.hostname();
}

async function getNetworkInfo() {
  try {
    // Get connection type and speed
    const networkInterfaces = await si.networkInterfaces();
    const networkStats = await si.networkStats();
    
    // Try to get WiFi name
    let wifiSSID = null;
    let connectionType = 'unknown';
    
    try {
      wifiSSID = await wifiName();
      connectionType = 'wifi';
    } catch (e) {
      // Not on WiFi — check for mobile data
      const interfaces = networkInterfaces.filter(i => 
        i.operstate === 'up' && !i.internal
      );
      
      if (interfaces.some(i => i.type === 'wireless')) {
        connectionType = 'wifi';
      } else if (interfaces.some(i => i.type === 'wwan')) {
        connectionType = 'mobile_data';
      } else if (interfaces.some(i => i.operstate === 'up')) {
        connectionType = 'ethernet';
      }
    }

    // Get signal strength if WiFi
    let signalStrength = null;
    try {
      if (connectionType === 'wifi') {
        const wifiNetworks = await si.wifiNetworks();
        // Fallback to active network if SSID match fails
        const currentNetwork = wifiNetworks.find(n => n.ssid === wifiSSID) || wifiNetworks.find(n => n.security);
        if (currentNetwork) {
          signalStrength = currentNetwork.signalLevel || currentNetwork.quality;
        }
      }
    } catch (e) {}

    // Get network speed
    const stats = networkStats[0] || {};
    const rxSpeed = Math.round((stats.rx_sec || 0) / 1024); // KB/s
    const txSpeed = Math.round((stats.tx_sec || 0) / 1024); // KB/s

    return {
      connectionType,
      wifiSSID: wifiSSID || null,
      signalStrength: signalStrength || null,
      downloadSpeed: rxSpeed,
      uploadSpeed: txSpeed,
      isOnline: networkInterfaces.some(i => i.operstate === 'up' && !i.internal),
      hostname: os.hostname(),
      platform: os.platform(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Network info error:', error);
    return {
      connectionType: 'unknown',
      wifiSSID: null,
      signalStrength: null,
      isOnline: false,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  }
}

async function pushNetworkInfo() {
  const driverId = getDeviceId();
  const networkInfo = await getNetworkInfo();
  
  console.log(`[${new Date().toLocaleTimeString()}] Pushing network info for ${driverId}:`, {
    ...networkInfo,
    lastUpdated: 'server timestamp'
  });
  
  try {
    await db.collection('driverNetwork').doc(driverId).set(networkInfo, { merge: true });
    console.log('✅ Network info updated');
  } catch (error) {
    console.error('❌ Failed to push:', error);
  }
}

// Run immediately on start
pushNetworkInfo();

// Then run every 30 seconds
schedule.scheduleJob('*/30 * * * * *', pushNetworkInfo);

console.log('🌐 Eastern Vacations Network Agent running...');
console.log(`📱 Device ID: ${getDeviceId()}`);
