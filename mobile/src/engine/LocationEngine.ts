import * as Location from 'expo-location';

class LocationEngine {
  private subscription: Location.LocationSubscription | null = null;
  public isTracking = false;

  async start(driverId: string, bookingId: string, onUpdate: (update: any) => void) {
    if (this.isTracking) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[LocationEngine] Permission to access location was denied');
        return;
      }

      this.isTracking = true;
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const { latitude, longitude, heading, speed, accuracy } = location.coords;
          const update = {
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed || 0,
            accuracy: accuracy || 0,
            bookingId,
            isOnline: true,
            batteryLevel: 100, // Static placeholder (can integrate expo-battery later if desired)
            lastUpdated: new Date()
          };
          onUpdate(update);
        }
      );
    } catch (error) {
      console.error('[LocationEngine] Error starting location tracker:', error);
      this.isTracking = false;
    }
  }

  stop() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isTracking = false;
  }

  isInsidePark(lat: number, lng: number, parkPolygon: [number, number][]) {
    let inside = false;
    for (let i = 0, j = parkPolygon.length - 1; i < parkPolygon.length; j = i++) {
      const xi = parkPolygon[i][0], yi = parkPolygon[i][1];
      const xj = parkPolygon[j][0], yj = parkPolygon[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export default new LocationEngine();
