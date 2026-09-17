import React from "react";

function AlertOverlay({
  alert,
  onClose
}) {
  if (!alert) {
    return null;
  }

  return (
    <div className="alert-overlay">
      <div className="alert-title">
        {alert.title}
      </div>

      <div className="alert-text">
        {alert.message}
      </div>

      <button
        className="alert-close"
        onClick={onClose}
      >
        DISMISS
      </button>
    </div>
  );
}

export default AlertOverlay;
