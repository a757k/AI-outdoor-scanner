```jsx
import React, {
  useEffect,
  useState
} from "react";

import Scanner from "./components/Scanner";
import BottomTabs from "./components/BottomTabs";
import FaceScanner from "./components/FaceScanner";
import LipReadingScanner from "./components/LipReadingScanner";

function App() {
  const [mode, setMode] =
    useState("BIG");

  const [cameraState, setCameraState] =
    useState("starting");

  useEffect(() => {
    document.title =
      `AI Scanner - ${mode}`;
  }, [mode]);

  const isFaceMode =
    mode === "FACE";

  const isLipMode =
    mode === "LIP";

  return (
    <main className="app">
      {isLipMode ? (
        <LipReadingScanner />
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
