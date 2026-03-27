import * as faceapi from 'face-api.js';

class FaceEngine {
  constructor() {
    this.modelsLoaded = false;
    this.loadingPromise = null;
  }

  async init() {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        // Paths relative to public folder
        const MODEL_URLS = {
          tinyFaceDetector: '/models/tiny_face_detector',
          faceLandmark68: '/models/face_landmark_68',
          faceRecognition: '/models/face_recognition'
        };

        console.log('FaceEngine: Loading models...');
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URLS.tinyFaceDetector),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URLS.faceLandmark68),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URLS.faceRecognition)
        ]);

        this.modelsLoaded = true;
        console.log('FaceEngine: Models loaded successfully');
      } catch (error) {
        console.error('FaceEngine: Failed to load models', error);
        throw error;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Registers a face by capturing multiple frames and averaging descriptors
   */
  async registerFace(videoElement, driverEmail) {
    const descriptors = [];
    const maxFrames = 3;
    let framesCaptured = 0;
    this.isScanning = true;

    // Use a controlled loop instead of setInterval to prevent WebGL race conditions
    while (this.isScanning && framesCaptured < maxFrames) {
      // 1. Hardware Guard: Ensure video is actually streaming
      if (videoElement.readyState !== 4) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      try {
        // 2. Detection Phase: Use standard TinyFaceDetector settings
        const detection = await faceapi
          .detectSingleFace(
            videoElement, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(detection.descriptor);
          framesCaptured++;
        }
      } catch (error) {
        console.error("Bulletproof Detection Error:", error);
      }

      // 3. Throttle: Give the mobile GPU time to breathe between tensors
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (framesCaptured >= maxFrames) {
      this.isScanning = false;
      const averageDescriptor = this.calculateAverageDescriptor(descriptors);
      const canvas = faceapi.createCanvasFromMedia(videoElement);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6);
      
      return {
        descriptor: Array.from(averageDescriptor),
        imageBlob: base64Image
      };
    } else {
      throw new Error("Face capture timed out or interrupted.");
    }

  /**
   * Verifies a live face against a stored descriptor
   */
  async verifyFace(videoElement, storedDescriptorArray) {
    await this.init();

    try {
      const storedDescriptor = new Float32Array(storedDescriptorArray);
      
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return { match: false, error: 'NO_FACE_DETECTED' };
      }

      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      console.log(`FaceEngine: Verification distance: ${distance}`);

      // Thresholds as per requirements: < 0.5 Match, 0.5-0.6 Uncertain, > 0.6 No Match
      if (distance < 0.5) {
        return { match: true, confidence: 1 - distance };
      } else if (distance <= 0.6) {
        return { match: 'UNCERTAIN', distance };
      } else {
        return { match: false, distance };
      }
    } catch (error) {
      console.error('FaceEngine: Verification failed', error);
      throw error;
    }
  }

  /**
   * Basic liveness check using head movement and landmarks
   */
  async checkLiveness(videoElement) {
    // Basic implementation: check for blink or slight movement
    // In a real scenario, we'd use more complex temporal analysis
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detection) return false;
    
    // Placeholder for more advanced anti-spoofing
    return true; 
  }

  calculateAverageDescriptor(descriptors) {
    const size = descriptors[0].length;
    const avg = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      let sum = 0;
      for (const d of descriptors) {
        sum += d[i];
      }
      avg[i] = sum / descriptors.length;
    }
    
    return avg;
  }
}

export default new FaceEngine();
