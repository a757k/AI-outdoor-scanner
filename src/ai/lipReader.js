/**
 * Silent Lip Reading Engine
 *
 * Collects and preprocesses mouth-region frames for
 * a visual speech recognition model.
 *
 * No microphone is used.
 *
 * The actual VSR neural network is intentionally not
 * fabricated here. This class prepares the video data
 * in the format needed by the inference layer.
 */

const TARGET_WIDTH = 88;
const TARGET_HEIGHT = 88;

const TARGET_FPS = 25;
const MAX_SECONDS = 6;

const MAX_FRAMES =
  TARGET_FPS * MAX_SECONDS;

const MIN_FRAMES = 25;

class LipReader {
  constructor() {
    this.frames = [];
    this.isTracking = false;
    this.lastResult = null;

    this.lastFrameTime = 0;
    this.frameInterval =
      1000 / TARGET_FPS;
  }

  start() {
    this.frames = [];
    this.isTracking = true;
    this.lastResult = null;
    this.lastFrameTime = 0;
  }

  stop() {
    this.isTracking = false;
    this.frames = [];
    this.lastFrameTime = 0;
  }

  reset() {
    this.frames = [];
    this.lastResult = null;
    this.lastFrameTime = 0;
  }

  addFrame(frame) {
    if (
      !this.isTracking ||
      !frame
    ) {
      return false;
    }

    const now =
      performance.now();

    /*
     * Keep the sequence close to
     * the model's expected frame rate.
     */
    if (
      this.lastFrameTime &&
      now - this.lastFrameTime <
        this.frameInterval
    ) {
      return false;
    }

    this.lastFrameTime = now;

    const processedFrame =
      this.prepareFrame(frame);

    if (!processedFrame) {
      return false;
    }

    this.frames.push({
      ...processedFrame,
      timestamp: now
    });

    if (
      this.frames.length >
      MAX_FRAMES
    ) {
      this.frames.shift();
    }

    return true;
  }

  prepareFrame(frame) {
    if (!frame.mouth) {
      return null;
    }

    return {
      landmarks:
        frame.landmarks || [],

      mouth: {
        x: frame.mouth.x,
        y: frame.mouth.y,
        width: frame.mouth.width,
        height: frame.mouth.height
      },

      /*
       * These dimensions describe the
       * normalized input expected by
       * the visual speech pipeline.
       */
      targetWidth:
        TARGET_WIDTH,

      targetHeight:
        TARGET_HEIGHT
    };
  }

  getFrameCount() {
    return this.frames.length;
  }

  hasEnoughFrames() {
    return (
      this.frames.length >=
      MIN_FRAMES
    );
  }

  isSequenceFull() {
    return (
      this.frames.length >=
      MAX_FRAMES
    );
  }

  getMouthSequence() {
    return [...this.frames];
  }

  getSequenceInfo() {
    return {
      frameCount:
        this.frames.length,

      targetWidth:
        TARGET_WIDTH,

      targetHeight:
        TARGET_HEIGHT,

      targetFps:
        TARGET_FPS,

      duration:
        this.frames.length /
        TARGET_FPS,

      ready:
        this.hasEnoughFrames()
    };
  }

  /*
   * This is the inference entry point.
   *
   * The browser currently has no embedded VSR
   * neural-network model. Therefore this function
   * NEVER invents speech.
   */
  async predict() {
    if (
      !this.hasEnoughFrames()
    ) {
      return {
        text: "",
        confidence: 0,
        status: "collecting"
      };
    }

    /*
     * The actual model must receive:
     *
     *   this.getMouthSequence()
     *
     * and return something like:
     *
     * {
     *   text: "HELLO",
     *   confidence: 0.82
     * }
     *
     * before this method can produce
     * a transcription.
     */
    return {
      text: "",
      confidence: 0,
      status:
        "model-not-connected",
      frameCount:
        this.frames.length
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
