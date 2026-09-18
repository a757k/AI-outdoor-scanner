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
  const cameraRef = useRef(null);

  const lipReaderRef = useRef(
    new LipReader()
  );

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

        /*
         * Store the facial landmark sequence.
         *
         * This is the data that will eventually
         * be fed into the real lip-reading model.
         */
        lipReaderRef.current.addFrame({
          landmarks: result.landmarks,
          mouth: result.mouth,
          timestamp: result.timestamp
        });

        const readerStatus =
          lipReaderRef.current.getStatus();

        setStatus(readerStatus);
      } catch (error) {
        console.error(
          "Lip analysis error:",
          error
        );
      } finally {
        busy = false;
      }
    }

    const interval =
      setInterval(
        analyzeFrame,
        80
      );

    return () => {
      running = false;
      clearInterval(interval);
    };
  }, [
    cameraState,
    modelState
  ]);

  async function handleReady() {
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
            style={{
              left: `${
                (mouthBox.x /
                  1280) *
                100
              }%`,

              top: `${
                (mouthBox.y /
                  720) *
                100
              }%`,

              width: `${
                (mouthBox.width /
                  1280) *
                100
              }%`,

              height: `${
                (mouthBox.height /
                  720) *
                100
              }%`
            }}
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
