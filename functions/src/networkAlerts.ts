import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Helper: Get admin FCM tokens from Firestore
async function getAdminFCMTokens(): Promise<string[]> {
  try {
    const snap = await db.collection('staff')
      .where('role', 'in', ['admin', 'manager'])
      .get();
    
    const tokens: string[] = [];
    snap.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      if (data.fcmToken) tokens.push(data.fcmToken as string);
    });
    return tokens;
  } catch (e) {
    console.error('Failed to get admin tokens:', e);
    return [];
  }
}

// Helper: Get driver name from Firestore
async function getDriverName(driverId: string): Promise<string> {
  try {
    // Check drivers collection first
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (driverDoc.exists) {
      return driverDoc.data()?.name || driverDoc.data()?.displayName || 'Unknown Driver';
    }
    // Fallback to staff collection  
    const staffDoc = await db.collection('staff').doc(driverId).get();
    if (staffDoc.exists) {
      return staffDoc.data()?.name || staffDoc.data()?.displayName || 'Unknown Staff';
    }
    return 'Unknown Driver';
  } catch (e) {
    return 'Unknown Driver';
  }
}

/**
 * Network Health Monitor
 * Triggers whenever a driverNetwork document is written.
 * Sends FCM notifications to admins when a driver goes offline or comes back online.
 */
export const networkHealthMonitor = functions.firestore
  .document('driverNetwork/{driverId}')
  .onWrite(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext
  ) => {
    const driverId = context.params.driverId;
    
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    // Document deleted — driver went fully offline
    if (!after) return null;

    const wasOnline = before?.isOnline ?? null;
    const isNowOnline = after.isOnline ?? false;

    // No change in online status — ignore
    if (wasOnline === isNowOnline) return null;
    
    // First-time write (no before state) — no alert needed
    if (wasOnline === null) return null;

    const driverName = await getDriverName(driverId);
    const adminTokens = await getAdminFCMTokens();

    if (adminTokens.length === 0) {
      console.log('No admin FCM tokens found, skipping notification');
      return null;
    }

    let title: string;
    let body: string;

    if (!isNowOnline && wasOnline) {
      // Driver went OFFLINE
      title = '⚠️ Driver Connectivity Issue';
      body = `${driverName} has gone offline`;
      console.log(`Driver ${driverName} (${driverId}) went offline`);
    } else if (isNowOnline && !wasOnline) {
      // Driver came back ONLINE
      const connectionType = after.connectionType || 'unknown';
      const wifiName = after.wifiSSID ? ` (${after.wifiSSID})` : '';
      title = '✅ Driver Back Online';
      body = `${driverName} reconnected via ${connectionType}${wifiName}`;
      console.log(`Driver ${driverName} (${driverId}) came back online via ${connectionType}`);
    } else {
      return null;
    }

    // Send multicast FCM notification
    const message: admin.messaging.MulticastMessage = {
      tokens: adminTokens,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'network_alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      data: {
        type: 'network_alert',
        driverId,
        driverName,
        isOnline: String(isNowOnline),
        connectionType: after.connectionType || 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      console.log(`FCM sent: ${response.successCount} success, ${response.failureCount} failed`);
    } catch (error) {
      console.error('FCM send error:', error);
    }

    return null;
  });
