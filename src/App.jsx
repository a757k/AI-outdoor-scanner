import React, { useEffect, useState } from "react";

import Scanner from "./components/Scanner";
import BottomTabs from "./components/BottomTabs";

function App() {
  const [mode, setMode] = useState("BIG");
  const [cameraState, setCameraState] = useState("starting");

  useEffect(() => {
    document.title = `AI Scanner — ${mode}`;
  }, [mode]);

  return (
    <main className="app">
      <Scanner
        mode={mode}
        cameraState={cameraState}
        setCameraState={setCameraState}
      />

      <BottomTabs
        mode={mode}
        setMode={setMode}
      />
    </main>
  );
}

export default App;
