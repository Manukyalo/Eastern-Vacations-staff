import * as faceapi from '@vladmandic/face-api'

class FaceEngine {
  constructor() {
    this.isLoaded = false
    this.isLoading = false
    this.detectionInterval = null
  }

  async loadModels(onProgress) {
    if (this.isLoaded) return true
    if (this.isLoading) return false
    
    this.isLoading = true
    const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
    
    try {
      onProgress?.('Loading face detector...')
      await faceapi.nets.tinyFaceDetector
        .loadFromUri(CDN)
      
      onProgress?.('Loading landmark model...')
      await faceapi.nets.faceLandmark68Net
        .loadFromUri(CDN)
      
      onProgress?.('Loading recognition model...')
      await faceapi.nets.faceRecognitionNet
        .loadFromUri(CDN)
      
      this.isLoaded = true
      this.isLoading = false
      onProgress?.('Ready')
      return true
    } catch (err) {
      this.isLoading = false
      throw new Error('Model load failed: ' + err.message)
    }
  }

  async detectFace(videoElement) {
    if (!this.isLoaded) throw new Error('Models not loaded')
    if (!videoElement) throw new Error('No video element')
    
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.3
    })
    
    const result = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor()
    
    return result || null
  }

  startContinuousDetection(videoElement, callbacks) {
    const { 
      onFaceDetected,    // face visible in frame
      onNoFace,          // no face visible
      onCapture,         // enough samples collected
      onError
    } = callbacks
    
    const samples = []
    const REQUIRED_SAMPLES = 5
    let consecutiveDetections = 0
    
    const detect = async () => {
      try {
        const result = await this.detectFace(videoElement)
        
        if (result) {
          consecutiveDetections++
          onFaceDetected?.(consecutiveDetections)
          
          // Only collect after 2 consecutive detections
          // (filters out false positives)
          if (consecutiveDetections >= 2) {
            samples.push(result.descriptor)
            
            if (samples.length >= REQUIRED_SAMPLES) {
              // Got enough samples — compute average
              this.stopDetection()
              const avgDescriptor = this
                .averageDescriptors(samples)
              onCapture?.(avgDescriptor)
              return
            }
          }
        } else {
          consecutiveDetections = 0
          onNoFace?.()
        }
      } catch (err) {
        onError?.(err.message)
      }
    }
    
    // Run detection every 400ms — fast but not 
    // overwhelming for mobile processors
    this.detectionInterval = setInterval(detect, 400)
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
      this.detectionInterval = null
    }
  }

  averageDescriptors(descriptors) {
    const length = descriptors[0].length
    const avg = new Float32Array(length)
    descriptors.forEach(desc => {
      desc.forEach((val, i) => { avg[i] += val })
    })
    avg.forEach((_, i) => { 
      avg[i] = avg[i] / descriptors.length 
    })
    return avg
  }

  async verifyFace(videoElement, storedDescriptor) {
    if (!this.isLoaded) throw new Error('Models not loaded')
    
    // Try up to 5 frames for verification
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await this.detectFace(videoElement)
      
      if (result) {
        const stored = new Float32Array(storedDescriptor)
        const distance = faceapi.euclideanDistance(
          result.descriptor, 
          stored
        )
        
        const confidence = Math.max(0, 
          Math.round((1 - distance) * 100))
        
        if (distance < 0.6) {
          return { match: true, confidence, distance }
        } else if (distance < 0.7) {
          // Uncertain — try again
          await new Promise(r => setTimeout(r, 500))
          continue
        } else {
          return { match: false, confidence, distance }
        }
      }
      
      await new Promise(r => setTimeout(r, 500))
    }
    
    return { match: false, confidence: 0 }
  }
}

export default new FaceEngine()
