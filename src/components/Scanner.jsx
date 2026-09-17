import React, {
  useEffect,
  useRef,
  useState
} from "react";

import Camera from "../camera/Camera";

import {
  detectObjects
} from "../ai/detector";

import {
  ObjectTracker
} from "../ai/tracker";

import {
  MotionDetector
} from "../ai/motionDetector";

import {
  getDisplayName,
  getThreatLevel,
  isObjectAllowed
} from "../ai/objectDatabase";

import DetectionBox from "./DetectionBox";
import AlertOverlay from "./AlertOverlay";
import StatusBar from "./StatusBar";

const DETECTION_INTERVAL = 350;

function Scanner({
  mode,
  cameraState,
  setCameraState
}) {
  const cameraRef = useRef(null);

  const trackerRef =
    useRef(
      new ObjectTracker()
    );

  const motionRef =
    useRef(
      new MotionDetector()
    );

  const runningRef =
    useRef(true);

  const lastDetectionRef =
    useRef(0);

  const [detections, setDetections] =
    useState([]);

  const [motion, setMotion] =
    useState({
      detected: false,
      intensity: 0,
      regions: []
    });

  const [alert, setAlert] =
    useState(null);

  const [modelState, setModelState] =
    useState("loading");

  const [fps, setFps] =
    useState(0);

  const frameCountRef =
    useRef(0);

  const fpsTimeRef =
    useRef(performance.now());

  // Prevent the same continuously detected
  // person from repeatedly triggering alerts.
  const farPersonAlertRef =
    useRef(false);

  useEffect(() => {
    trackerRef.current.clear();

    setDetections([]);
    setAlert(null);

    // Reset FAR PEOPLE alert state
    // when changing scanner modes.
    farPersonAlertRef.current =
      false;
  }, [mode]);

  useEffect(() => {
    runningRef.current = true;

    let animationFrame;

    async function loop() {
      if (!runningRef.current) {
        return;
      }

      const video =
        cameraRef.current
          ?.getVideoElement();

      if (video) {
        const currentMotion =
          motionRef.current.analyze(
            video
          );

        setMotion(
          currentMotion
        );

        frameCountRef.current++;

        const now =
          performance.now();

        if (
          now -
            fpsTimeRef.current >=
          1000
        ) {
          setFps(
            frameCountRef.current
          );

          frameCountRef.current =
            0;

          fpsTimeRef.current =
            now;
        }

        if (
          now -
            lastDetectionRef.current >=
          DETECTION_INTERVAL
        ) {
          lastDetectionRef.current =
            now;

          try {
            setModelState(
              "scanning"
            );

            const rawDetections =
              await detectObjects(
                video,
                mode
              );

            const filtered =
              rawDetections.filter(
                (item) =>
                  isObjectAllowed(
                    item.className,
                    mode
                  )
              );

            const tracked =
              trackerRef.current.update(
                filtered
              );

            const enhanced =
              tracked.map(
                (item) => ({
                  ...item,

                  displayName:
                    getDisplayName(
                      item.className
                    ),

                  threat:
                    getThreatLevel(
                      item.className
                    ),

                  videoWidth:
                    video.videoWidth,

                  videoHeight:
                    video.videoHeight
                })
              );

            setDetections(
              enhanced
            );

            checkAlerts(
              enhanced,
              currentMotion
            );

            setModelState(
              "ready"
            );
          } catch (error) {
            console.error(
              "Detection error:",
              error
            );

            setModelState(
              "error"
            );
          }
        }
      }

      animationFrame =
        requestAnimationFrame(
          loop
        );
    }

    loop();

    return () => {
      runningRef.current =
        false;

      if (animationFrame) {
        cancelAnimationFrame(
          animationFrame
        );
      }
    };
  }, [mode]);

  function checkAlerts(
    detectedObjects,
    currentMotion
  ) {
    const person =
      detectedObjects.find(
        (object) =>
          object.className ===
            "person" &&
          object.score >=
            (mode === "SMALL"
              ? 0.32
              : 0.55)
      );

    if (person) {
      if (
        mode === "SMALL"
      ) {
        // Only create the alert once
        // for the current continuous
        // person detection.
        if (
          !farPersonAlertRef.current
        ) {
          farPersonAlertRef.current =
            true;

          setAlert({
            title:
              "DISTANT HUMAN DETECTED",

            message:
              "A person was detected in the camera view."
          });
        }
      }

      return;
    }

    // No person is currently detected.
    // This resets the alert lock so that
    // a person who leaves and later returns
    // can trigger a new alert.
    if (
      mode === "SMALL"
    ) {
      farPersonAlertRef.current =
        false;
    }

    const dangerous =
      detectedObjects.find(
        (object) =>
          object.threat ===
            "high" &&
          object.score >=
            0.55
      );

    if (dangerous) {
      setAlert({
        title:
          `${dangerous.displayName} DETECTED`,

        message:
          "A high-priority object was detected in the camera view."
      });

      return;
    }

    if (
      currentMotion.detected &&
      currentMotion.intensity >
        0.65 &&
      detectedObjects.length ===
        0
    ) {
      setAlert((current) => {
        if (current) {
          return current;
        }

        return {
          title:
            "UNIDENTIFIED MOVEMENT",

          message:
            "Movement was detected, but the scanner could not confidently identify its source."
        };
      });
    }
  }

  function retryCamera() {
    cameraRef.current?.restart();
  }

  const status =
    cameraState === "error"
      ? "Camera unavailable"
      : modelState ===
          "loading"
        ? "Loading AI model"
        : modelState ===
            "error"
          ? "AI error"
          : mode === "SMALL"
            ? "Long-distance scan"
            : "Scanning";

  return (
    <section className="scanner">
      <div className="camera-layer">
        <Camera
          ref={cameraRef}
          onStateChange={
            setCameraState
          }
        />
      </div>

      {cameraState ===
        "error" && (
        <div className="camera-message">
          <div className="camera-message-inner">
            <h1>
              Camera access required
            </h1>

            <p>
              Allow camera access
              to use the live AI
              scanner. The app
              does not record or
              upload photos or
              videos.
            </p>

            <button
              className="retry-button"
              onClick={
                retryCamera
              }
            >
              TRY CAMERA AGAIN
            </button>
          </div>
        </div>
      )}

      <div className="top-ui">
        <div className="brand-row">
          <div className="brand">
            <span className="brand-dot" />

            <span className="brand-title">
              AI SCANNER
            </span>
          </div>

          <span className="mode-label">
            {mode === "SMALL"
              ? "FAR PEOPLE"
              : `${mode} MODE`}
          </span>
        </div>

        <StatusBar
          status={status}
          fps={fps}
          detectionCount={
            detections.length
          }
          motion={motion}
        />
      </div>

      {detections.map(
        (detection) => (
          <DetectionBox
            key={detection.id}
            detection={
              detection
            }
          />
        )
      )}

      {motion.regions
        .slice(0, 12)
        .map(
          (
            region,
            index
          ) => (
            <div
              key={`motion-${index}`}
              className="detection-box movement"
              style={{
                left: `${
                  region.x * 100
                }%`,

                top: `${
                  region.y * 100
                }%`,

                width: `${
                  region.width *
                  100
                }%`,

                height: `${
                  region.height *
                  100
                }%`,

                opacity:
                  0.18 +
                  region.intensity *
                    0.35
              }}
            />
          )
        )}

      <div className="bottom-info">
        <div className="scan-info">
          <strong>
            {detections.length >
            0
              ? `${detections.length} ${
                  mode ===
                  "SMALL"
                    ? "PERSON"
                    : "OBJECT"
                }${
                  detections.length ===
                  1
                    ? ""
                    : "S"
                }`
              : "NO PEOPLE"}
          </strong>

          {mode ===
          "SMALL"
            ? "Long-distance analysis"
            : "Live analysis"}
        </div>

        <div className="scan-info">
          <strong>
            {motion.detected
              ? "MOTION"
              : "STABLE"}
          </strong>

          Scene movement
        </div>
      </div>

      <div className="warning-bar">
        AI detection is an aid —
        no detection does not mean
        the area is hazard-free.
      </div>

      {alert && (
        <AlertOverlay
          alert={alert}
          onClose={() =>
            setAlert(null)
          }
        />
      )}
    </section>
  );
}

export default Scanner;
