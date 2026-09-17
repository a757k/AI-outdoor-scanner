function centerOf(box) {
  const [x, y, width, height] = box;

  return {
    x: x + width / 2,
    y: y + height / 2
  };
}

function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );
}

function iou(a, b) {
  const ax1 = a[0];
  const ay1 = a[1];
  const ax2 = a[0] + a[2];
  const ay2 = a[1] + a[3];

  const bx1 = b[0];
  const by1 = b[1];
  const bx2 = b[0] + b[2];
  const by2 = b[1] + b[3];

  const intersectionWidth =
    Math.max(
      0,
      Math.min(ax2, bx2) -
        Math.max(ax1, bx1)
    );

  const intersectionHeight =
    Math.max(
      0,
      Math.min(ay2, by2) -
        Math.max(ay1, by1)
    );

  const intersection =
    intersectionWidth * intersectionHeight;

  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];

  const union =
    areaA +
    areaB -
    intersection;

  if (union <= 0) {
    return 0;
  }

  return intersection / union;
}

export class ObjectTracker {
  constructor() {
    this.tracks = new Map();
    this.nextId = 1;
  }

  update(detections) {
    const unmatchedTracks = new Set(
      this.tracks.keys()
    );

    const results = [];

    for (const detection of detections) {
      let bestTrack = null;
      let bestScore = 0;

      const detectionCenter =
        centerOf(detection.bbox);

      for (const trackId of unmatchedTracks) {
        const track = this.tracks.get(trackId);

        if (
          track.className !==
          detection.className
        ) {
          continue;
        }

        const overlap = iou(
          track.bbox,
          detection.bbox
        );

        const centerDistance =
          distance(
            track.center,
            detectionCenter
          );

        const proximityScore =
          Math.max(
            0,
            1 -
              centerDistance /
                Math.max(
                  track.bbox[2],
                  track.bbox[3],
                  50
                )
          );

        const score =
          overlap * 0.7 +
          proximityScore * 0.3;

        if (score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
      }

      if (bestTrack && bestScore > 0.18) {
        const updated = {
          ...bestTrack,

          bbox: detection.bbox,

          center: detectionCenter,

          score: detection.score,

          lastSeen: performance.now(),

          age: bestTrack.age + 1
        };

        this.tracks.set(
          bestTrack.id,
          updated
        );

        unmatchedTracks.delete(
          bestTrack.id
        );

        results.push(updated);
      } else {
        const track = {
          id: this.nextId++,

          className:
            detection.className,

          bbox: detection.bbox,

          center: detectionCenter,

          score: detection.score,

          lastSeen: performance.now(),

          age: 1
        };

        this.tracks.set(
          track.id,
          track
        );

        results.push(track);
      }
    }

    const now = performance.now();

    for (const [id, track] of this.tracks) {
      if (
        now - track.lastSeen >
        1200
      ) {
        this.tracks.delete(id);
      }
    }

    return results;
  }

  clear() {
    this.tracks.clear();
  }
}
