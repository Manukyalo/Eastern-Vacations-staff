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
        console.log('FaceEngine: Loading models from /models...');
        
        // Load from root /models path as per new organization
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        this.modelsLoaded = true;
        console.log('FaceEngine: Models loaded successfully');
      } catch (error) {
        console.error('FaceEngine: Failed to load models', error);
        throw error;
        this.loadingPromise = null; // Reset on failure
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Registration now happens directly in FaceScanner.jsx for robustness.
   * This method remains for backward compatibility or future use,
   * now updated to follow the 224 input standard.
   */
  async registerFace(videoElement) {
    await this.init();
    
    // Passing videoElement directly as per CRITICAL RULES
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 224,
        scoreThreshold: 0.3 
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) throw new Error('NO_FACE_DETECTED');

    // Simple capture for the Base64 image
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    return {
      descriptor: Array.from(detection.descriptor),
      imageBlob: canvas.toDataURL('image/jpeg', 0.8)
    };
  }

  /**
   * Verifies a live face against a stored descriptor.
   * Updated to use inputSize: 224 to match the new registration standard.
   */
  async verifyFace(videoElement, storedDescriptorArray) {
    await this.init();

    try {
      const storedDescriptor = new Float32Array(storedDescriptorArray);
      
      // Pass videoElement DIRECTLY to fix tensor shape errors
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 224,
          scoreThreshold: 0.3 
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return { match: false, error: 'NO_FACE_DETECTED' };
      }

      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      console.log(`FaceEngine: Verification distance: ${distance}`);

      // Threshold: < 0.6 is generally a good match for face-api
      if (distance < 0.6) {
        return { match: true, confidence: 1 - distance };
      } else {
        return { match: false, distance };
      }
    } catch (error) {
      console.error('FaceEngine: Verification failed', error);
      throw error;
    }
  }
}

export default new FaceEngine();

