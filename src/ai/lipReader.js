/**
 * Silent Lip Reading Engine
 *
 * This module prepares mouth-movement data for a lip-reading model.
 * It does NOT use the microphone.
 *
 * The actual speech-to-text model will be connected here once
 * the required browser-compatible model is added.
 */

const MAX_FRAMES = 32;

class LipReader {
  constructor() {
    this.frames = [];
    this.isTracking = false;
    this.lastResult = null;
  }

  start() {
    this.frames = [];
    this.isTracking = true;
    this.lastResult = null;
  }

  stop() {
    this.isTracking = false;
    this.frames = [];
  }

  reset() {
    this.frames = [];
    this.lastResult = null;
  }

  addFrame(frame) {
    if (!this.isTracking || !frame) {
      return;
    }

    this.frames.push({
      ...frame,
      timestamp: performance.now()
    });

    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }
  }

  getFrameCount() {
    return this.frames.length;
  }

  hasEnoughFrames() {
    return this.frames.length >= 12;
  }

  getMouthSequence() {
    return [...this.frames];
  }

  /*
   * This is the model entry point.
   *
   * Later, the actual lip-reading neural-network model
   * will receive the mouth-frame sequence here and return
   * predicted words.
   */
  async predict() {
    if (!this.hasEnoughFrames()) {
      return {
        text: "",
        confidence: 0,
        status: "collecting"
      };
    }

    /*
     * No real prediction is made yet.
     * This prevents the app from displaying fake words.
     */
    return {
      text: "",
      confidence: 0,
      status: "model-not-connected"
    };
  }

  getStatus() {
    if (!this.isTracking) {
      return "idle";
    }

    if (!this.hasEnoughFrames()) {
      return "collecting";
    }

    return "ready";
  }
}

export default LipReader;
