```jsx
import React, {
  useEffect,
  useRef,
  useState
} from "react";

import Camera from "../camera/Camera";
import LipReadingOverlay from "./LipReadingOverlay";
import LipReader from "../ai/lipReader";

import {
  detectMouth,
  initMouthLandmarker
} from "../ai/mouthLandmarker";

function LipReadingScanner() {
  const cameraRef =
    useRef(null);

  const lipReaderRef =
    useRef(new LipReader());

  const predictionBusyRef =
    useRef(false);

  const lastPredictionRef =
    useRef(0);

  const [cameraState, setCameraState] =
    useState("starting");

  const [status, setStatus] =
    useState("idle");

  const [text, setText] =
    useState("");

  const [confidence, setConfidence] =
    useState(0);

  const [mouthDetected, setMouthDetected] =
    useState(false);

  const [mouthBox, setMouthBox] =
    useState(null);

  const [videoSize, setVideoSize] =
    useState({
      width: 1,
      height: 1
    });

  const [modelState, setModelState] =
    useState("loading");

  /*
   * Start the visual speech analyzer and
   * load MediaPipe's face landmark model.
   */
  useEffect(() => {
    lipReaderRef.current.start();

    async function loadLandmarker() {
      const ready =
        await initMouthLandmarker();

      setModelState(
        ready
          ? "ready"
          : "error"
      );
    }

    loadLandmarker();

    return () => {
      lipReaderRef.current.stop();
    };
  }, []);

  /*
   * Continuously analyze the mouth.
   */
  useEffect(() => {
    if (
      cameraState !== "ready" ||
      modelState !== "ready"
    ) {
      return;
    }

    let running = true;
    let busy = false;

    async function analyzeFrame() {
      if (
        !running ||
        busy
      ) {
        return;
      }

      const video =
        cameraRef.current?.getVideoElement();

      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      setVideoSize({
        width:
          video.videoWidth,

        height:
          video.videoHeight
      });

      busy = true;

      try {
        const result =
          await detectMouth(video);

        if (!running) {
          return;
        }

        /*
         * No face / mouth found.
         */
        if (!result) {
          setMouthDetected(false);
          setMouthBox(null);

          setStatus("find-face");

          return;
        }

        /*
         * Face and mouth found.
         */
        setMouthDetected(true);
        setMouthBox(result.mouth);

        const frameAdded =
          lipReaderRef.current.addFrame({
            landmarks:
              result.landmarks,

            mouth:
              result.mouth,

            timestamp:
              result.timestamp
          });

        if (!frameAdded) {
          return;
        }

        /*
         * Keep the UI status synchronized
         * with the amount of collected data.
         */
        setStatus(
          lipReaderRef.current.getStatus()
        );

        /*
         * Do not run interpretation on every
         * MediaPipe frame.
         *
         * Once every ~500 ms is enough for the
         * visual analysis and prevents the UI
         * from constantly changing.
         */
        const now =
          performance.now();

        const enoughTimePassed =
          now -
            lastPredictionRef.current >
          500;

        if (
          !lipReaderRef.current.hasEnoughFrames() ||
          predictionBusyRef.current ||
          !enoughTimePassed
        ) {
          return;
        }

        predictionBusyRef.current =
          true;

        lastPredictionRef.current =
          now;

        try {
          const prediction =
            await lipReaderRef.current.predict();

          if (!running) {
            return;
          }

          if (
            prediction?.text
          ) {
            setText(
              prediction.text
            );

            setConfidence(
              Number(
                prediction.confidence ||
                0
              )
            );
          }

          if (
            prediction?.status
          ) {
            setStatus(
              prediction.status
            );
          }
        } catch (error) {
          console.error(
            "Visual speech prediction error:",
            error
          );
        } finally {
          predictionBusyRef.current =
            false;
        }
      } catch (error) {
        console.error(
          "Mouth analysis error:",
          error
        );
      } finally {
        busy = false;
      }
    }

    /*
     * MediaPipe analysis loop.
     *
     * The LipReader itself limits stored
     * frames to its target FPS.
     */
    const interval =
      setInterval(
        analyzeFrame,
        40
      );

    return () => {
      running = false;

      clearInterval(interval);

      predictionBusyRef.current =
        false;
    };
  }, [
    cameraState,
    modelState
  ]);

  function handleReady() {
    setCameraState("ready");
  }

  function handleCameraStateChange(
    state
  ) {
    setCameraState(state);

    if (
      state === "error"
    ) {
      setStatus("idle");
    }
  }

  /*
   * Determine what the overlay should show.
   */
  let displayStatus =
    status;

  if (
    modelState === "loading"
  ) {
    displayStatus =
      "loading-model";
  }

  if (
    modelState === "error"
  ) {
    displayStatus =
      "model-error";
  }

  if (
    modelState === "ready" &&
    cameraState === "ready" &&
    !mouthDetected
  ) {
    displayStatus =
      "find-face";
  }

  /*
   * Convert camera coordinates to
   * percentages so the mouth box stays
   * correctly positioned at different
   * camera resolutions.
   */
  const mouthStyle =
    mouthBox
      ? {
          left: `${
            (mouthBox.x /
              videoSize.width) *
            100
          }%`,

          top: `${
            (mouthBox.y /
              videoSize.height) *
            100
          }%`,

          width: `${
            (mouthBox.width /
              videoSize.width) *
            100
          }%`,

          height: `${
            (mouthBox.height /
              videoSize.height) *
            100
          }%`
        }
      : undefined;

  return (
    <div className="lip-reading-screen">
      <div className="lip-reading-camera">
        <Camera
          ref={cameraRef}
          onStateChange={
            handleCameraStateChange
          }
          onReady={
            handleReady
          }
        />

        {mouthBox && (
          <div
            className="mouth-tracking-box"
            style={mouthStyle}
          >
            <span>
              MOUTH
            </span>
          </div>
        )}

        <div className="lip-reading-frame">
          <div className="lip-corner top-left" />

          <div className="lip-corner top-right" />

          <div className="lip-corner bottom-left" />

          <div className="lip-corner bottom-right" />
        </div>

        <div className="lip-reading-camera-label">
          SILENT SPEECH SCANNER
        </div>
      </div>

      <LipReadingOverlay
        text={text}
        confidence={confidence}
        status={displayStatus}
      />
    </div>
  );
}

export default LipReadingScanner;
```
