let detector = null;
let supported = null;

export async function initFaceDetector() {
  if (supported !== null) return supported;

  if (!("FaceDetector" in window)) {
    supported = false;
    return false;
  }

  try {
    detector = new window.FaceDetector({
      fastMode: true,
      maxDetectedFaces: 10
    });

    supported = true;
    return true;
  } catch {
    supported = false;
    return false;
  }
}

export async function detectFaces(video) {
  if (!video || video.readyState < 2) return [];

  const ready = await initFaceDetector();

  if (!ready || !detector) {
    return [];
  }

  try {
    const faces = await detector.detect(video);

    return faces.map((face, index) => {
      const box = face.boundingBox;

      return {
        id: `face-${index}-${Math.round(box.x)}-${Math.round(box.y)}`,
        bbox: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        },
        confidence: 0.95
      };
    });
  } catch (error) {
    console.error("Face detection error:", error);
    return [];
  }
}

export function isFaceDetectorSupported() {
  return "FaceDetector" in window;
}
