const TARGET_WIDTH = 88;
const TARGET_HEIGHT = 88;

const TARGET_FPS = 25;
const MAX_SECONDS = 6;

const MAX_FRAMES =
  TARGET_FPS * MAX_SECONDS;

const MIN_FRAMES = 25;

// Change this later when we deploy the backend.
const LIP_READING_SERVER =
  "http://localhost:8000";

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

    if (this.lastResult) {
      return this.lastResult;
    }

    try {
      const response =
        await fetch(
          `${LIP_READING_SERVER}/predict`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              frames:
                this.getMouthSequence(),

              sequence:
                this.getSequenceInfo()
            })
          }
        );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const result =
        await response.json();

      this.lastResult = {
        text:
          result.text || "",

        confidence:
          Number(
            result.confidence || 0
          ),

        status:
          result.status ||
          "unknown",

        frameCount:
          result.frameCount ??
          this.frames.length
      };

      return this.lastResult;
    } catch (error) {
      console.error(
        "Lip reading server error:",
        error
      );

      return {
        text: "",
        confidence: 0,
        status: "server-offline"
      };
    }
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
