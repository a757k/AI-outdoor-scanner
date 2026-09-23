```jsx
import React, { useRef, useState } from "react";

export default function LipReadingScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Lip Reading Scanner");
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setActive(true);
      setMessage("Listening to lip movement...");
    } catch (err) {
      console.error(err);
      setError("Camera permission is required.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setActive(false);
    setMessage("Lip Reading Scanner");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#050505",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)"
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)"
          }}
        />

        {!active && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px"
            }}
          >
            Camera ready
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: "15px",
            right: "15px",
            bottom: "15px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            textAlign: "center"
          }}
        >
          {message}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            borderRadius: "10px",
            background: "rgba(255,0,0,0.15)",
            color: "#ff6b6b",
            textAlign: "center"
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: "15px"
        }}
      >
        {!active ? (
          <button onClick={startCamera}>
            Start Lip Reading
          </button>
        ) : (
          <button onClick={stopCamera}>
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
```
