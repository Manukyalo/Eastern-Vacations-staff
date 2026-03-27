// import * as faceapi from 'face-api.js';

class FaceEngine {
  async init() { return Promise.resolve(); }
  async registerFace() { return { descriptor: [], imageBlob: new Blob() }; }
  async verifyFace() { return { match: true, confidence: 1 }; }
  async checkLiveness() { return true; }
}

export default new FaceEngine();
