import React, { useEffect, useState } from "react";

import Scanner from "./components/Scanner";
import BottomTabs from "./components/BottomTabs";
import FaceScanner from "./components/FaceScanner";

function App() {
  const [mode, setMode] = useState("BIG");
  const [cameraState, setCameraState] = useState("starting");

  useEffect(() => {
    document.title = `AI Scanner — ${mode}`;
  }, [mode]);

  const isFaceMode = mode === "FACE";

  return (
    <main className="app">
      {isFaceMode ? (
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
