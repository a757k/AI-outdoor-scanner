import React from "react";

function LipReadingOverlay({
  text = "",
  confidence = 0,
  status = "idle",
  onClose
}) {
  const confidencePercent =
    Math.round(
      Math.max(
        0,
        Math.min(1, confidence)
      ) * 100
    );

  return (
    <div className="lip-reading-overlay">
      <div className="lip-reading-header">
        <div>
          <span className="lip-reading-dot" />

          <span className="lip-reading-title">
            SILENT SPEECH
          </span>
        </div>

        {onClose && (
          <button
            className="lip-reading-close"
            onClick={onClose}
            aria-label="Close silent speech"
          >
            ×
          </button>
        )}
      </div>

      <div className="lip-reading-content">
        {status === "idle" && (
          <>
            <div className="lip-reading-status">
              READY
            </div>

            <p>
              Position a face inside
              the camera view.
            </p>
          </>
        )}

        {status === "collecting" && (
          <>
            <div className="lip-reading-status">
              ANALYZING MOUTH
            </div>

            <p>
              Keep the face visible
              while the person speaks.
            </p>
          </>
        )}

        {status === "ready" && !text && (
          <>
            <div className="lip-reading-status">
              READY TO READ
            </div>

            <p>
              Silent speech analysis
              is ready.
            </p>
          </>
        )}

        {status === "model-not-connected" && (
          <>
            <div className="lip-reading-status">
              MODEL REQUIRED
            </div>

            <p>
              The lip-reading model
              has not been connected yet.
            </p>
          </>
        )}

        {text && (
          <div className="lip-reading-result">
            <div className="lip-reading-label">
              POSSIBLE SPEECH
            </div>

            <div className="lip-reading-text">
              "{text}"
            </div>

            <div className="lip-reading-confidence">
              Confidence:{" "}
              {confidencePercent}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LipReadingOverlay;
