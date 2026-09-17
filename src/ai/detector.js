import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

let model = null;
let loadingPromise = null;

const MIN_NORMAL_SCORE = 0.25;
const MIN_FAR_SCORE = 0.18;

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
      // Use another available backend.
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

function createCanvas(width, height) {
  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

function intersectionOverUnion(a, b) {
  const ax1 = a[0];
  const ay1 = a[1];
  const ax2 = a[0] + a[2];
  const ay2 = a[1] + a[3];

  const bx1 = b[0];
  const by1 = b[1];
  const bx2 = b[0] + b[2];
  const by2 = b[1] + b[3];

  const ix =
    Math.max(
      0,
      Math.min(ax2, bx2) -
        Math.max(ax1, bx1)
    );

  const iy =
    Math.max(
      0,
      Math.min(ay2, by2) -
        Math.max(ay1, by1)
    );

  const intersection =
    ix * iy;

  const union =
    a[2] * a[3] +
    b[2] * b[3] -
    intersection;

  if (union <= 0) {
    return 0;
  }

  return intersection / union;
}

function removeDuplicates(items) {
  const result = [];

  for (const item of items) {
    let duplicate = false;

    for (const existing of result) {
      if (
        existing.className ===
          item.className &&
        intersectionOverUnion(
          existing.bbox,
          item.bbox
        ) > 0.35
      ) {
        duplicate = true;

        if (
          item.score >
          existing.score
        ) {
          existing.bbox =
            item.bbox;

          existing.score =
            item.score;
        }

        break;
      }
    }

    if (!duplicate) {
      result.push(item);
    }
  }

  return result;
}

async function detectFullFrame(
  detector,
  video
) {
  const predictions =
    await detector.detect(
      video,
      20,
      MIN_NORMAL_SCORE
    );

  return predictions.map(
    (prediction, index) => ({
      id: `full-${index}-${Date.now()}`,
      className:
        prediction.class,
      score:
        prediction.score,
      bbox:
        prediction.bbox,
      videoWidth:
        video.videoWidth,
      videoHeight:
        video.videoHeight
    })
  );
}

async function detectFarPeople(
  detector,
  video
) {
  const videoWidth =
    video.videoWidth;

  const videoHeight =
    video.videoHeight;

  /*
    Divide the camera into overlapping
    sections.

    Each section is enlarged before
    the AI looks at it.
  */

  const tiles = [
    {
      x: 0,
      y: 0,
      width: 0.58,
      height: 0.62
    },

    {
      x: 0.42,
      y: 0,
      width: 0.58,
      height: 0.62
    },

    {
      x: 0,
      y: 0.38,
      width: 0.58,
      height: 0.62
    },

    {
      x: 0.42,
      y: 0.38,
      width: 0.58,
      height: 0.62
    }
  ];

  const results = [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];

    const sx =
      Math.floor(
        tile.x * videoWidth
      );

    const sy =
      Math.floor(
        tile.y * videoHeight
      );

    const sw =
      Math.floor(
        tile.width * videoWidth
      );

    const sh =
      Math.floor(
        tile.height * videoHeight
      );

    const canvas =
      createCanvas(
        640,
        640
      );

    const context =
      canvas.getContext("2d");

    /*
      Enlarging the section makes
      distant people occupy more
      pixels for the AI.
    */

    context.drawImage(
      video,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      640,
      640
    );

    const predictions =
      await detector.detect(
        canvas,
        15,
        MIN_FAR_SCORE
      );

    for (
      let j = 0;
      j < predictions.length;
      j++
    ) {
      const prediction =
        predictions[j];

      if (
        prediction.class !==
        "person"
      ) {
        continue;
      }

      const [
        px,
        py,
        pw,
        ph
      ] = prediction.bbox;

      /*
        Convert the enlarged
        tile coordinates back to
        the real camera coordinates.
      */

      const realX =
        sx +
        (px / 640) * sw;

      const realY =
        sy +
        (py / 640) * sh;

      const realWidth =
        (pw / 640) * sw;

      const realHeight =
        (ph / 640) * sh;

      results.push({
        id: `far-${i}-${j}-${Date.now()}`,

        className: "person",

        score:
          prediction.score,

        bbox: [
          realX,
          realY,
          realWidth,
          realHeight
        ],

        videoWidth,

        videoHeight
      });
    }
  }

  return removeDuplicates(
    results
  );
}

export async function detectObjects(
  videoElement,
  mode = "BIG"
) {
  const detector =
    await loadDetector();

  if (
    !videoElement ||
    videoElement.readyState < 2 ||
    videoElement.videoWidth === 0 ||
    videoElement.videoHeight === 0
  ) {
    return [];
  }

  if (mode === "SMALL") {
    const normal =
      await detectFullFrame(
        detector,
        videoElement
      );

    const far =
      await detectFarPeople(
        detector,
        videoElement
      );

    const all = [
      ...normal.filter(
        (item) =>
          item.className ===
          "person"
      ),
      ...far
    ];

    return removeDuplicates(
      all
    );
  }

  return detectFullFrame(
    detector,
    videoElement
  );
}
