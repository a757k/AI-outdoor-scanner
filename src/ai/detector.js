import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

let model = null;
let loadingPromise = null;

export async function loadDetector() {
  if (model) {
    return model;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    await tf.ready();

    try {
      await tf.setBackend("webgl");
      await tf.ready();
    } catch {
      // Browser may not support WebGL.
      // TensorFlow will keep the available backend.
    }

    model = await cocoSsd.load({
      base: "lite_mobilenet_v2"
    });

    return model;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function detectObjects(videoElement) {
  const detector = await loadDetector();

  if (
    !videoElement ||
    videoElement.readyState < 2 ||
    videoElement.videoWidth === 0 ||
    videoElement.videoHeight === 0
  ) {
    return [];
  }

  const predictions = await detector.detect(
    videoElement,
    20,
    0.25
  );

  return predictions.map((prediction, index) => ({
    id: `${prediction.class}-${index}-${Date.now()}`,

    className: prediction.class,

    score: prediction.score,

    bbox: prediction.bbox
  }));
}
