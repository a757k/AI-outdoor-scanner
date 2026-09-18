```javascript
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

let landmarker = null;
let loadingPromise = null;

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function initMouthLandmarker() {
  if (landmarker) {
    return true;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const vision =
        await FilesetResolver.forVisionTasks(
          WASM_PATH
        );

      landmarker =
        await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_PATH,
              delegate: "GPU"
            },

            runningMode: "VIDEO",

            numFaces: 1,

            outputFaceBlendshapes: false,

            outputFacialTransformationMatrixes: false
          }
        );

      return true;
    } catch (error) {
      console.error(
        "Mouth landmarker initialization failed:",
        error
      );

      landmarker = null;

      return false;
    }
  })();

  return loadingPromise;
}

export async function detectMouth(video) {
  if (
    !video ||
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return null;
  }

  const ready =
    await initMouthLandmarker();

  if (!ready || !landmarker) {
    return null;
  }

  try {
    const timestamp =
      performance.now();

    const result =
      landmarker.detectForVideo(
        video,
        timestamp
      );

    if (
      !result.faceLandmarks ||
      result.faceLandmarks.length === 0
    ) {
      return null;
    }

    const landmarks =
      result.faceLandmarks[0];

    /*
     * MediaPipe's facial mesh contains
     * dedicated landmark points around
     * the lips.
     *
     * We keep the complete face landmark
     * array because the future lip-reading
     * model can use the mouth region from it.
     */

    const mouthLandmarks =
      landmarks.map(
        (point, index) => ({
          index,
          x: point.x,
          y: point.y,
          z: point.z
        })
      );

    const mouthPoints =
      getMouthBoundingBox(
        mouthLandmarks,
        video.videoWidth,
        video.videoHeight
      );

    return {
      landmarks: mouthLandmarks,
      mouth: mouthPoints,
      timestamp
    };
  } catch (error) {
    console.error(
      "Mouth landmark detection error:",
      error
    );

    return null;
  }
}

function getMouthBoundingBox(
  landmarks,
  videoWidth,
  videoHeight
) {
  /*
   * MediaPipe Face Landmarker uses
   * normalized coordinates.
   *
   * These indices cover the central
   * mouth/lip region of the face mesh.
   */

  const mouthIndices = [
    61,
    146,
    91,
    181,
    84,
    17,
    314,
    405,
    321,
    375,
    291,
    78,
    95,
    88,
    178,
    87,
    14,
    317,
    402,
    318,
    324,
    308
  ];

  const points =
    mouthIndices
      .map(
        (index) =>
          landmarks[index]
      )
      .filter(Boolean);

  if (points.length === 0) {
    return null;
  }

  const xs =
    points.map(
      (point) =>
        point.x * videoWidth
    );

  const ys =
    points.map(
      (point) =>
        point.y * videoHeight
    );

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const width =
    maxX - minX;

  const height =
    maxY - minY;

  const paddingX =
    width * 0.35;

  const paddingY =
    height * 0.6;

  return {
    x: Math.max(
      0,
      minX - paddingX
    ),

    y: Math.max(
      0,
      minY - paddingY
    ),

    width: Math.min(
      videoWidth -
        Math.max(
          0,
          minX - paddingX
        ),
      width +
        paddingX * 2
    ),

    height: Math.min(
      videoHeight -
        Math.max(
          0,
          minY - paddingY
        ),
      height +
        paddingY * 2
    )
  };
}

export function isMouthLandmarkerReady() {
  return Boolean(landmarker);
}
```
