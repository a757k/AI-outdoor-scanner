import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";

let model = null;
let loadingPromise = null;

export async function initFaceDetector() {
  if (model) {
    return true;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      await tf.ready();

      await tf.setBackend("webgl");

      model = await blazeface.load({
        maxFaces: 10,
        inputWidth: 128,
        inputHeight: 128,
        iouThreshold: 0.3,
        scoreThreshold: 0.75
      });

      return true;
    } catch (error) {
      console.error("Face detector initialization failed:", error);
      model = null;
      return false;
    }
  })();

  return loadingPromise;
}

export async function detectFaces(video) {
  if (!video || video.readyState < 2) {
    return [];
  }

  const ready = await initFaceDetector();

  if (!ready || !model) {
    return [];
  }

  try {
    const predictions = await model.estimateFaces(video, false);

    return predictions.map((face, index) => {
      const topLeft = face.topLeft;
      const bottomRight = face.bottomRight;

      const x = Number(topLeft[0]);
      const y = Number(topLeft[1]);

      const width =
        Number(bottomRight[0]) - x;

      const height =
        Number(bottomRight[1]) - y;

      return {
        id: `face-${index}-${Math.round(x)}-${Math.round(y)}`,

        bbox: {
          x,
          y,
          width,
          height
        },

        confidence:
          face.probability?.[0] ??
          0.95
      };
    });
  } catch (error) {
    console.error("Face detection error:", error);
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
