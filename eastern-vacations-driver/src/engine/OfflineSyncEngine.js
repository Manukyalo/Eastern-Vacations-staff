import { openDB } from 'idb';

class OfflineSyncEngine {
  constructor() {
    this.dbPromise = null;
    this.isOnline = navigator.onLine;
  }

  async init() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = openDB('EV_Driver_Offline', 1, {
      upgrade(db) {
        db.createObjectStore('locationQueue', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('tripStatusQueue', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('expenseQueue', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('cachedTrips', { keyPath: 'id' });
        db.createObjectStore('cachedItinerary', { keyPath: 'bookingId' });
      }
    });

    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    return this.dbPromise;
  }

  async handleNetworkChange(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      console.log('OfflineSyncEngine: Device is online. Processing queues...');
      await this.processQueues();
    } else {
      console.log('OfflineSyncEngine: Device is offline. Changes will be queued.');
    }
  }

  async queueAction(storeName, data) {
    const db = await this.init();
    await db.add(storeName, { ...data, timestamp: Date.now() });
  }

  async processQueues() {
    const db = await this.init();
    // Logic to push queued items to Firestore
    // This will be called when network is restored
  }

  async cacheData(storeName, data) {
    const db = await this.init();
    if (Array.isArray(data)) {
      const tx = db.transaction(storeName, 'readwrite');
      for (const item of data) {
        await tx.store.put(item);
      }
      await tx.done;
    } else {
      await db.put(storeName, data);
    }
  }
}

export default new OfflineSyncEngine();
