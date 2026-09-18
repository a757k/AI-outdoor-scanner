```jsx
import React, {
  useEffect,
  useState
} from "react";

import Scanner from "./components/Scanner";
import BottomTabs from "./components/BottomTabs";
import FaceScanner from "./components/FaceScanner";
import LipReadingOverlay from "./components/LipReadingOverlay";

function LipReadingScreen() {
  const [status, setStatus] =
    useState("idle");

  const [text, setText] =
    useState("");

  const [confidence, setConfidence] =
    useState(0);

  useEffect(() => {
    setStatus("collecting");

    return () => {
      setStatus("idle");
    };
  }, []);

  return (
    <div className="lip-reading-screen">
      <div className="lip-reading-camera">
        <video
          className="lip-reading-video"
          autoPlay
          muted
          playsInline
        />

        <div className="lip-reading-frame">
          <div className="lip-corner top-left" />
          <div className="lip-corner top-right" />
          <div className="lip-corner bottom-left" />
          <div className="lip-corner bottom-right" />
        </div>

        <div className="lip-reading-camera-label">
          SILENT SPEECH SCANNER
        </div>
      </div>

      <LipReadingOverlay
        text={text}
        confidence={confidence}
        status={status}
      />
    </div>
  );
}

function App() {
  const [mode, setMode] =
    useState("BIG");

  const [cameraState, setCameraState] =
    useState("starting");

  useEffect(() => {
    document.title =
      `AI Scanner — ${mode}`;
  }, [mode]);

  const isFaceMode =
    mode === "FACE";

  const isLipMode =
    mode === "LIP";

  return (
    <main className="app">
      {isLipMode ? (
        <LipReadingScreen />
      ) : isFaceMode ? (
        <FaceScanner />
      ) : (
        <Scanner
          mode={mode}
          cameraState={cameraState}
          setCameraState={setCameraState}
        />
      )}

      <BottomTabs
        mode={mode}
        setMode={setMode}
      />
    </main>
  );
}

export default App;
```
