```js
const TARGET_FPS = 25;
const MAX_SECONDS = 8;

const MAX_FRAMES =
  TARGET_FPS * MAX_SECONDS;

const MIN_FRAMES = 25;

/*
 * Visual-only speech analyzer.
 *
 * This does NOT use:
 * - microphone
 * - audio
 * - external server
 * - downloaded VSR model
 *
 * It analyzes facial landmarks over time and estimates
 * visual speech units from mouth shape, opening, width,
 * movement and pauses.
 */

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
      !frame ||
      !frame.mouth
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

    const processed =
      this.prepareFrame(frame);

    if (!processed) {
      return false;
    }

    this.frames.push({
      ...processed,
      timestamp: now
    });

    if (
      this.frames.length >
      MAX_FRAMES
    ) {
      this.frames.shift();
    }

    /*
     * A new sequence invalidates the old
     * interpretation.
     */
    this.lastResult = null;

    return true;
  }

  prepareFrame(frame) {
    if (!frame.mouth) {
      return null;
    }

    const landmarks =
      frame.landmarks || [];

    const mouth =
      frame.mouth;

    /*
     * MediaPipe gives normalized landmark
     * coordinates.
     *
     * Extract useful mouth geometry.
     */
    const geometry =
      this.calculateMouthGeometry(
        landmarks,
        mouth
      );

    return {
      landmarks,
      mouth: {
        x: mouth.x,
        y: mouth.y,
        width: mouth.width,
        height: mouth.height
      },

      geometry
    };
  }

  calculateMouthGeometry(
    landmarks,
    mouth
  ) {
    /*
     * MediaPipe Face Mesh mouth landmarks.
     *
     * These are used to estimate:
     * - opening
     * - width
     * - corner movement
     * - lip shape
     */

    const upperLip =
      this.distance(
        landmarks[13],
        landmarks[14]
      );

    const outerWidth =
      this.distance(
        landmarks[61],
        landmarks[291]
      );

    const innerWidth =
      this.distance(
        landmarks[78],
        landmarks[308]
      );

    const mouthHeight =
      this.distance(
        landmarks[13],
        landmarks[14]
      );

    const leftCorner =
      landmarks[61];

    const rightCorner =
      landmarks[291];

    const center =
      landmarks[13];

    const safeWidth =
      Math.max(
        outerWidth,
        0.0001
      );

    return {
      opening:
        mouthHeight / safeWidth,

      width:
        outerWidth,

      innerWidth,

      lipRatio:
        mouthHeight / safeWidth,

      centerX:
        center?.x ?? 0,

      centerY:
        center?.y ?? 0,

      leftX:
        leftCorner?.x ?? 0,

      rightX:
        rightCorner?.x ?? 0,

      mouthWidth:
        mouth.width,

      mouthHeight:
        mouth.height
    };
  }

  distance(a, b) {
    if (!a || !b) {
      return 0;
    }

    const dx =
      a.x - b.x;

    const dy =
      a.y - b.y;

    const dz =
      (a.z || 0) -
      (b.z || 0);

    return Math.sqrt(
      dx * dx +
        dy * dy +
        dz * dz
    );
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
   * Convert the continuous mouth movement
   * into visual speech units.
   */
  extractSpeechUnits() {
    if (
      this.frames.length <
      MIN_FRAMES
    ) {
      return [];
    }

    const units = [];

    let previous =
      null;

    let current =
      null;

    let stillFrames = 0;

    for (
      const frame of this.frames
    ) {
      const g =
        frame.geometry;

      if (!g) {
        continue;
      }

      const opening =
        g.opening;

      const width =
        g.width;

      const movement =
        previous
          ? Math.abs(
              g.centerX -
                previous.centerX
            ) +
            Math.abs(
              g.centerY -
                previous.centerY
            )
          : 0;

      /*
       * Classify the visible mouth shape.
       *
       * These are intentionally broad visual
       * categories rather than pretending they
       * are exact phonemes.
       */
      let shape =
        "neutral";

      if (
        opening < 0.12 &&
        width < 0.09
      ) {
        shape = "closed";
      } else if (
        opening > 0.38
      ) {
        shape = "open";
      } else if (
        width > 0.17 &&
        opening < 0.25
      ) {
        shape = "wide";
      } else if (
        width < 0.10 &&
        opening > 0.18
      ) {
        shape = "rounded";
      } else if (
        opening >= 0.20 &&
        opening <= 0.38
      ) {
        shape = "medium";
      }

      /*
       * Detect pauses.
       */
      if (
        movement < 0.001 &&
        opening < 0.13
      ) {
        stillFrames++;
      } else {
        stillFrames = 0;
      }

      if (
        stillFrames >= 4
      ) {
        if (current) {
          units.push(current);
          current = null;
        }

        previous = g;
        continue;
      }

      if (!current) {
        current = {
          shape,
          frames: 1,
          movement
        };
      } else if (
        current.shape === shape
      ) {
        current.frames++;
        current.movement +=
          movement;
      } else {
        units.push(current);

        current = {
          shape,
          frames: 1,
          movement
        };
      }

      previous = g;
    }

    if (current) {
      units.push(current);
    }

    return units;
  }

  /*
   * Estimate broad visual speech patterns.
   */
  analyzeSpeechPattern() {
    const units =
      this.extractSpeechUnits();

    if (!units.length) {
      return null;
    }

    const shapes =
      units.map(
        (unit) => unit.shape
      );

    const counts = {};

    for (
      const shape of shapes
    ) {
      counts[shape] =
        (counts[shape] || 0) + 1;
    }

    const total =
      shapes.length;

    const openness =
      units.reduce(
        (sum, unit) =>
          sum +
          (
            unit.shape === "open"
              ? 1
              : unit.shape === "medium"
                ? 0.6
                : 0
          ),
        0
      ) /
      Math.max(total, 1);

    const movement =
      units.reduce(
        (sum, unit) =>
          sum +
          unit.movement,
        0
      ) /
      Math.max(total, 1);

    return {
      units,
      shapes,
      counts,
      openness,
      movement,
      unitCount: total
    };
  }

  /*
   * Generate a cautious visual interpretation.
   *
   * This intentionally refuses to invent arbitrary
   * English sentences when the visual evidence is
   * insufficient.
   */
  generateInterpretation() {
    const analysis =
      this.analyzeSpeechPattern();

    if (!analysis) {
      return {
        text: "",
        confidence: 0,
        status: "insufficient-motion"
      };
    }

    const {
      shapes,
      openness,
      movement,
      unitCount
    } = analysis;

    /*
     * Very little movement usually means the
     * person is not visibly speaking.
     */
    if (
      unitCount < 2 ||
      movement < 0.002
    ) {
      return {
        text: "",
        confidence: 0,
        status: "no-clear-speech"
      };
    }

    /*
     * Estimate whether this looks like
     * continuous speech.
     */
    const speechLike =
      unitCount >= 3 &&
      openness > 0.08 &&
      movement > 0.002;

    if (!speechLike) {
      return {
        text: "",
        confidence: 0,
        status: "uncertain"
      };
    }

    /*
     * Instead of fabricating exact words,
     * expose the visual speech sequence.
     *
     * This gives the UI something real to show
     * while remaining honest about what the
     * browser-only system actually knows.
     */
    const visualSequence =
      shapes
        .slice(-12)
        .join(" → ");

    const confidence =
      Math.min(
        0.72,
        0.25 +
          unitCount * 0.035 +
          Math.min(
            movement * 25,
            0.25
          )
      );

    return {
      text:
        `Visual speech pattern: ${visualSequence}`,

      confidence,

      status:
        "visual-analysis",

      unitCount,

      analysis
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

    /*
     * Code-only version.
     *
     * No server request.
     * No microphone.
     * No external VSR model.
     */
    const result =
      this.generateInterpretation();

    this.lastResult =
      result;

    return result;
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
```
