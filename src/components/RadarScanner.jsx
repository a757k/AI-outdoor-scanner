import React, {
  useEffect,
  useRef,
  useState
} from "react";

import Camera from "../camera/Camera";

import {
  detectObjects
} from "../ai/detector";

const DETECTION_INTERVAL = 400;

function RadarScanner() {
  const cameraRef = useRef(null);
  const runningRef = useRef(true);
  const lastDetectionRef = useRef(0);

  const [cameraState, setCameraState] =
    useState("starting");

  const [detections, setDetections] =
    useState([]);

  const [modelState, setModelState] =
    useState("loading");

  const [sweepAngle, setSweepAngle] =
    useState(0);

  /*
    Radar sweep animation.
  */
  useEffect(() => {
    let frame;

    function animate() {
      setSweepAngle(
        (previous) =>
          (previous + 1.5) % 360
      );

      frame =
        requestAnimationFrame(
          animate
        );
    }

    frame =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  /*
    Real AI detection loop.
  */
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

      if (
        video &&
        performance.now() -
          lastDetectionRef.current >=
          DETECTION_INTERVAL
      ) {
        lastDetectionRef.current =
          performance.now();

        try {
          setModelState(
            "scanning"
          );

          const objects =
            await detectObjects(
              video,
              "BIG"
            );

          setDetections(
            objects
          );

          setModelState(
            "ready"
          );
        } catch (error) {
          console.error(
            "Radar detection error:",
            error
          );

          setModelState(
            "error"
          );
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
  }, []);

  /*
    Convert an object's camera
    position into radar coordinates.
  */
  function getRadarPosition(
    detection
  ) {
    const [
      x,
      y,
      width,
      height
    ] = detection.bbox;

    const videoWidth =
      detection.videoWidth ||
      1280;

    const videoHeight =
      detection.videoHeight ||
      720;

    const centerX =
      x + width / 2;

    const centerY =
      y + height / 2;

    /*
      Horizontal position:

      -1 = far left
       0 = center
       1 = far right
    */

    const horizontal =
      (centerX /
        videoWidth -
        0.5) * 2;

    /*
      Vertical position.

      We use this to estimate
      distance from apparent
      object size and position.
    */

    const vertical =
      centerY /
      videoHeight;

    /*
      Approximate distance.

      This is NOT a real range
      sensor. It is an estimate
      based primarily on the
      object's apparent size.
    */

    const objectHeightRatio =
      height /
      videoHeight;

    let distance;

    if (
      detection.className ===
      "person"
    ) {
      /*
        Approximate human height
        = 1.7m.

        This gives a rough
        monocular-camera estimate.
      */

      const estimated =
        1.7 /
        Math.max(
          objectHeightRatio,
          0.08
        );

      distance =
        Math.max(
          1.5,
          Math.min(
            estimated,
            50
          )
        );
    } else {
      /*
        Generic estimate for
        unknown object sizes.
      */

      const estimated =
        2.2 /
        Math.max(
          objectHeightRatio,
          0.08
        );

      distance =
        Math.max(
          1.5,
          Math.min(
            estimated,
            50
          )
        );
    }

    /*
      Radar coordinates.

      Center of radar is the
      camera's forward direction.
    */

    const radarX =
      50 +
      horizontal * 43;

    /*
      Objects that appear lower
      in the camera are treated
      as closer.

      This is only a visual/
      estimated representation.
    */

    const forward =
      1 -
      vertical;

    const radarY =
      88 -
      forward * 62;

    return {
      x: Math.max(
        5,
        Math.min(
          95,
          radarX
        )
      ),

      y: Math.max(
        10,
        Math.min(
          92,
          radarY
        )
      ),

      distance
    };
  }

  function getShortName(
    className
  ) {
    return className
      .replace(
        /_/g,
        " "
      )
      .toUpperCase();
  }

  return (
    <section className="radar-scanner">

      {/* CAMERA */}
      <div className="radar-camera">

        <Camera
          ref={cameraRef}
          onStateChange={
            setCameraState
          }
        />

        <div className="radar-camera-overlay">

          <div className="radar-header">
            <div>
              <span className="radar-live-dot" />
              AI RADAR
            </div>

            <span>
              {modelState ===
              "error"
                ? "AI ERROR"
                : modelState ===
                    "scanning"
                  ? "SCANNING"
                  : "LIVE"}
            </span>
          </div>

          <div className="radar-camera-count">
            {detections.length}

            <span>
              TARGET
              {detections.length ===
              1
                ? ""
                : "S"}
            </span>
          </div>

          {detections.map(
            (detection) => {
              const [
                x,
                y,
                width,
                height
              ] =
                detection.bbox;

              const videoWidth =
                detection.videoWidth ||
                1280;

              const videoHeight =
                detection.videoHeight ||
                720;

              return (
                <div
                  key={
                    detection.id
                  }
                  className="radar-camera-target"
                  style={{
                    left: `${
                      (x /
                        videoWidth) *
                      100
                    }%`,

                    top: `${
                      (y /
                        videoHeight) *
                      100
                    }%`,

                    width: `${
                      (width /
                        videoWidth) *
                      100
                    }%`,

                    height: `${
                      (height /
                        videoHeight) *
                      100
                    }%`
                  }}
                >
                  <span>
                    {getShortName(
                      detection.className
                    )}
                  </span>
                </div>
              );
            }
          )}

        </div>
      </div>


      {/* RADAR */}
      <div className="radar-panel">

        <div className="radar-title">
          <span>
            PROXIMITY RADAR
          </span>

          <span>
            {detections.length} ACTIVE
          </span>
        </div>

        <div className="radar-display">

          {/* Circular radar rings */}
          <div className="radar-ring ring-1" />
          <div className="radar-ring ring-2" />
          <div className="radar-ring ring-3" />
          <div className="radar-ring ring-4" />

          {/* Crosshair */}
          <div className="radar-cross vertical" />
          <div className="radar-cross horizontal" />

          {/* Sweep */}
          <div
            className="radar-sweep"
            style={{
              transform:
                `rotate(${sweepAngle}deg)`
            }}
          />

          {/* Center */}
          <div className="radar-center">
            <span />
          </div>

          {/* Real targets */}
          {detections.map(
            (detection) => {
              const position =
                getRadarPosition(
                  detection
                );

              return (
                <div
                  key={
                    detection.id
                  }
                  className="radar-target"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`
                  }}
                >
                  <div className="radar-blip" />

                  <div className="radar-target-label">
                    <strong>
                      {getShortName(
                        detection.className
                      )}
                    </strong>

                    <span>
                      ~
                      {position.distance.toFixed(
                        1
                      )}
                      m
                    </span>
                  </div>
                </div>
              );
            }
          )}

          {detections.length ===
            0 && (
            <div className="radar-empty">
              NO TARGETS
            </div>
          )}

        </div>

        <div className="radar-footer">

          <div>
            <strong>
              {detections.length}
            </strong>
            <span>
              OBJECTS
            </span>
          </div>

          <div>
            <strong>
              AI
            </strong>
            <span>
              TRACKING
            </span>
          </div>

          <div>
            <strong>
              ~
            </strong>
            <span>
              EST. RANGE
            </span>
          </div>

        </div>

        <div className="radar-disclaimer">
          DISTANCE IS AN ESTIMATE —
          NOT A RANGE SENSOR
        </div>

      </div>

    </section>
  );
}

export default RadarScanner;
