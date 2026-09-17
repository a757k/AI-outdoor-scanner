import React, { useEffect, useRef, useState } from "react";
import Camera from "../camera/Camera";
import {
  detectFaces,
  initFaceDetector,
  isFaceDetectorSupported
} from "../ai/faceDetector";
import PublicInfoPanel from "./PublicInfoPanel";

export default function FaceScanner() {
  const cameraRef = useRef(null);
  const animationRef = useRef(null);
  const lastScanRef = useRef(0);

  const [faces, setFaces] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let mounted = true;

    initFaceDetector().then((ok) => {
      if (mounted) {
        setSupported(ok);
      }
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraReady) return;

    const scan = async (time) => {
      animationRef.current = requestAnimationFrame(scan);

      if (time - lastScanRef.current < 250) {
        return;
      }

      lastScanRef.current = time;

      const video = cameraRef.current;

      if (!video) return;

      const detected = await detectFaces(video);

      setFaces(detected);
    };

    animationRef.current = requestAnimationFrame(scan);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [cameraReady]);

  async function searchPublicInfo() {
    const cleanName = name.trim();

    if (!cleanName) {
      setSearchError("Enter the person's name first.");
      return;
    }

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const response = await fetch(
        `/.netlify/functions/public-info?name=${encodeURIComponent(
          cleanName
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setSearchError(
        error.message || "Could not search public information."
      );
    } finally {
      setSearching(false);
    }
  }

  function clearSession() {
    setName("");
    setResults([]);
    setSearchError("");
  }

  return (
    <div className="face-scanner">
      <Camera
        ref={cameraRef}
        onReady={() => setCameraReady(true)}
      />

      <div className="face-overlay">
        {faces.map((face) => (
          <div
            key={face.id}
            className="face-box"
            style={{
              left: `${(face.bbox.x / 1280) * 100}%`,
              top: `${(face.bbox.y / 720) * 100}%`,
              width: `${(face.bbox.width / 1280) * 100}%`,
              height: `${(face.bbox.height / 720) * 100}%`
            }}
          >
            <div className="face-label">
              FACE DETECTED
            </div>
          </div>
        ))}
      </div>

      <div className="face-top-panel">
        <div className="face-title">
          FACE SCANNER
        </div>

        <div className="face-status">
          {faces.length === 0
            ? "No face detected"
            : `${faces.length} face${
                faces.length === 1 ? "" : "s"
              } detected`}
        </div>
      </div>

      {!supported && (
        <div className="face-warning">
          Face detection is not supported by this browser.
        </div>
      )}

      <div className="face-control-panel">
        <div className="face-input-title">
          Public information search
        </div>

        <div className="face-input-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter person's name"
            autoComplete="off"
          />

          <button
            onClick={searchPublicInfo}
            disabled={searching || !name.trim()}
          >
            {searching ? "SEARCHING..." : "SEARCH"}
          </button>
        </div>

        <div className="face-private-note">
          Nothing about the face, name, or search is saved by this app.
        </div>

        {searchError && (
          <div className="face-error">
            {searchError}
          </div>
        )}

        {results.length > 0 && (
          <PublicInfoPanel results={results} />
        )}

        {(name || results.length > 0) && (
          <button
            className="face-clear-button"
            onClick={clearSession}
          >
            CLEAR SESSION
          </button>
        )}
      </div>
    </div>
  );
}
