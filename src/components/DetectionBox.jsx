import React from "react";

function DetectionBox({
  detection
}) {
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

  const left =
    (x / videoWidth) * 100;

  const top =
    (y / videoHeight) * 100;

  const boxWidth =
    (width / videoWidth) * 100;

  const boxHeight =
    (height / videoHeight) * 100;

  const confidence =
    Math.round(
      detection.score * 100
    );

  return (
    <div
      className="detection-box"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${boxWidth}%`,
        height: `${boxHeight}%`
      }}
    >
      <div className="box-label">
        <span>
          {detection.displayName}
        </span>

        <span className="confidence">
          {confidence}%
        </span>
      </div>
    </div>
  );
}

export default DetectionBox;
