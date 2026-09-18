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
  const cameraRef = useRef(null);

  const lipReaderRef = useRef(
    new LipReader()
  );

  const predictionBusyRef =
    useRef(false);

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

  useEffect(() => {
    lipReaderRef.current.start();

    async function loadLandmarker() {
      const ready =
        await initMouthLandmarker();

      setModelState(
        ready ? "ready" : "error"
      );
    }

    loadLandmarker();

    return () => {
      lipReaderRef.current.stop();
    };
  }, []);

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
      if (!running || busy) {
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
        width: video.videoWidth,
        height: video.videoHeight
      });

      busy = true;

      try {
        const result =
          await detectMouth(video);

        if (!running) {
          return;
        }

        if (!result) {
          setMouthDetected(false);
          setMouthBox(null);

          setStatus("collecting");

          return;
        }

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

        const readerStatus =
          lipReaderRef.current.getStatus();

        setStatus(readerStatus);

        /*
         * Once enough mouth frames have been
         * collected, ask the LipReader for a
         * prediction.
         *
         * The current LipReader will honestly
         * return "model-not-connected" until
         * the actual VSR model is attached.
         */
        if (
          frameAdded &&
          lipReaderRef.current.hasEnoughFrames() &&
          !predictionBusyRef.current
        ) {
          predictionBusyRef.current =
            true;

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
                prediction.confidence || 0
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
              "Lip prediction error:",
              error
            );
          } finally {
            predictionBusyRef.current =
              false;
          }
        }
      } catch (error) {
        console.error(
          "Lip analysis error:",
          error
        );
      } finally {
        busy = false;
      }
    }

    /*
     * MediaPipe is allowed to run more often
     * than the LipReader's 25 FPS input limit.
     *
     * LipReader itself controls which frames
     * are actually stored.
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

    if (state === "error") {
      setStatus("idle");
    }
  }

  let displayStatus = status;

  if (modelState === "loading") {
    displayStatus =
      "loading-model";
  }

  if (modelState === "error") {
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
   * Convert the actual camera coordinates
   * into percentages.
   *
   * This replaces the old hard-coded
   * 1280 × 720 calculation.
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
          onReady={handleReady}
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
