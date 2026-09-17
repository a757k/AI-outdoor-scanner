export function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

export function smooth(
  previous,
  current,
  factor = 0.25
) {
  return (
    previous +
    (current - previous) *
      factor
  );
}

export function getAdaptiveDetectionInterval(
  fps
) {
  if (fps >= 45) {
    return 180;
  }

  if (fps >= 30) {
    return 250;
  }

  if (fps >= 20) {
    return 350;
  }

  return 500;
}

export function calculateRelativeSize(
  bbox,
  videoWidth,
  videoHeight
) {
  if (
    !videoWidth ||
    !videoHeight
  ) {
    return 0;
  }

  const area =
    bbox[2] * bbox[3];

  const frameArea =
    videoWidth *
    videoHeight;

  return area / frameArea;
}
