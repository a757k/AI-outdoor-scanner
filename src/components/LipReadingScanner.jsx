```jsx
import React, {
  useEffect,
  useRef,
  useState
} from "react";

import Camera from "../camera/Camera";
import LipReadingOverlay from "./LipReadingOverlay";
import LipReader from "../ai/lipReader";

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

  useEffect(() => {
    lipReaderRef.current.start();
    setStatus("collecting");

    return () => {
      lipReaderRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "ready") {
      return;
    }

    const interval = setInterval(() => {
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

      /*
       * For now we record timing information from
       * the live camera stream.
       *
       * The actual mouth-landmark extraction and
       * neural lip-reading model will be connected
       * after the camera pipeline is confirmed.
       */
      lipReaderRef.current.addFrame({
        width: video.videoWidth,
        height: video.videoHeight,
        currentTime: video.currentTime
      });

      const readerStatus =
        lipReaderRef.current.getStatus();

      setStatus(readerStatus);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [cameraState]);

  async function handleReady() {
    setCameraState("ready");
    setStatus("collecting");
  }

  function handleCameraStateChange(state) {
    setCameraState(state);

    if (state === "error") {
      setStatus("idle");
    }
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
        status={
          cameraState === "error"
            ? "idle"
            : status
        }
      />
    </div>
  );
}

export default LipReadingScanner;
```
