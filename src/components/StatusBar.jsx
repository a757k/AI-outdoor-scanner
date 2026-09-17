import React from "react";

function StatusBar({
  status,
  fps,
  detectionCount,
  motion
}) {
  const isError =
    status.includes("error") ||
    status.includes("unavailable");

  const isLoading =
    status.includes("Loading");

  return (
    <div className="status-row">
      <span
        className={`status-light ${
          isError
            ? "error"
            : isLoading
              ? "warning"
              : ""
        }`}
      />

      <span>
        {status}
      </span>

      <span>•</span>

      <span>
        {fps} FPS
      </span>

      <span>•</span>

      <span>
        {detectionCount} detected
      </span>

      {motion?.detected && (
        <>
          <span>•</span>

          <span>
            motion
          </span>
        </>
      )}
    </div>
  );
}

export default StatusBar;
