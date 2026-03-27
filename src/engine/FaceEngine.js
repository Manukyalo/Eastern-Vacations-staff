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

  async registerFace(videoElement, driverEmail) {
    const descriptors = [];
    const maxFrames = 3;
    let framesCaptured = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          // Normalize input to 256x256 square to prevent tensor shape mismatch
          const normalizedCanvas = this.extractSquareFrame(videoElement, 256);
          
          const detection = await faceapi
            .detectSingleFace(normalizedCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 256 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            descriptors.push(detection.descriptor);
            framesCaptured++;
            console.log(`FaceEngine: Captured frame ${framesCaptured}/${maxFrames}`);

            if (framesCaptured >= maxFrames) {
              clearInterval(interval);
              
              const averageDescriptor = this.calculateAverageDescriptor(descriptors);
              // Use the normalized canvas for the final image to ensure consistency
              const base64Image = normalizedCanvas.toDataURL('image/jpeg', 0.8); 
              
              resolve({
                descriptor: Array.from(averageDescriptor),
                imageBlob: base64Image 
              });
            }
          }
        } catch (error) {
          console.error("Detection error:", error);
          // Don't reject yet, just log and retry in next interval
        }
      }, 600); // Slightly slower for stability
    });
  }

  /**
   * Verifies a live face against a stored descriptor
   */
  async verifyFace(videoElement, storedDescriptorArray) {
    await this.init();

    try {
      const storedDescriptor = new Float32Array(storedDescriptorArray);
      
      // Normalize input
      const normalizedCanvas = this.extractSquareFrame(videoElement, 256);

      const detection = await faceapi
        .detectSingleFace(normalizedCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 256 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return { match: false, error: 'NO_FACE_DETECTED' };
      }

      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      console.log(`FaceEngine: Verification distance: ${distance}`);

      // Thresholds: < 0.5 Match, 0.5-0.6 Uncertain, > 0.6 No Match
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
   * Extracts a square center crop from a video or canvas element
   */
  extractSquareFrame(source, size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const srcWidth = source.videoWidth || source.width;
    const srcHeight = source.videoHeight || source.height;

    // Calculate center crop
    let sx, sy, sWidth, sHeight;
    if (srcWidth > srcHeight) {
      sHeight = srcHeight;
      sWidth = srcHeight;
      sx = (srcWidth - srcHeight) / 2;
      sy = 0;
    } else {
      sWidth = srcWidth;
      sHeight = srcWidth;
      sx = 0;
      sy = (srcHeight - srcWidth) / 2;
    }

    ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, size, size);
    return canvas;
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
