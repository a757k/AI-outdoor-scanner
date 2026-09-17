import * as faceDetection from "@tensorflow-models/face-detection";
import "@tensorflow/tfjs-backend-webgl";

let detector = null;
let loadingPromise = null;

export async function initFaceDetector() {
  if (detector) {
    return true;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const model =
        faceDetection.SupportedModels
          .MediaPipeFaceDetector;

      const detectorConfig = {
        runtime: "tfjs",
        maxFaces: 10,
        modelType: "short"
      };

      detector =
        await faceDetection.createDetector(
          model,
          detectorConfig
        );

      return true;
    } catch (error) {
      console.error(
        "Face detector initialization failed:",
        error
      );

      detector = null;

      return false;
    }
  })();

  return loadingPromise;
}

export async function detectFaces(video) {
  if (
    !video ||
    video.readyState < 2
  ) {
    return [];
  }

  const ready =
    await initFaceDetector();

  if (!ready || !detector) {
    return [];
  }

  try {
    const predictions =
      await detector.estimateFaces(video);

    return predictions.map(
      (face, index) => {
        const box = face.box;

        return {
          id: `face-${index}-${Math.round(
            box.xMin
          )}-${Math.round(box.yMin)}`,

          bbox: {
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height
          },

          confidence:
            face.score ?? 0.95
        };
      }
    );
  } catch (error) {
    console.error(
      "Face detection error:",
      error
    );

    return [];
  }
}

export function isFaceDetectorSupported() {
  return Boolean(
    window.isSecureContext &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
  );
}
