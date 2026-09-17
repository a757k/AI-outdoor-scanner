import React, {
  useEffect,
  useRef,
  useState
} from "react";

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
  const scanningRef = useRef(false);

  const [faces, setFaces] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [supported, setSupported] = useState(true);

  const [videoSize, setVideoSize] = useState({
    width: 1280,
    height: 720
  });

  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!isFaceDetectorSupported()) {
      setSupported(false);
      return () => {
        mounted = false;
      };
    }

    initFaceDetector().then((ok) => {
      if (mounted) {
        setSupported(ok);
      }
    });

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraReady) {
      return;
    }

    let mounted = true;

    const scan = async (time) => {
      if (!mounted) {
        return;
      }

      animationRef.current =
        requestAnimationFrame(scan);

      if (
        time - lastScanRef.current <
        250
      ) {
        return;
      }

      if (scanningRef.current) {
        return;
      }

      lastScanRef.current = time;
      scanningRef.current = true;

      try {
        const video =
          cameraRef.current?.getVideoElement();

        if (!video) {
          return;
        }

        if (
          video.readyState < 2 ||
          !video.videoWidth ||
          !video.videoHeight
        ) {
          return;
        }

        setVideoSize({
          width: video.videoWidth,
          height: video.videoHeight
        });

        const detected =
          await detectFaces(video);

        if (mounted) {
          setFaces(detected);
        }
      } catch (error) {
        console.error(
          "Face scanning error:",
          error
        );
      } finally {
        scanningRef.current = false;
      }
    };

    animationRef.current =
      requestAnimationFrame(scan);

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      scanningRef.current = false;
    };
  }, [cameraReady]);

  async function searchPublicInfo() {
    const cleanName = name.trim();

    if (!cleanName) {
      setSearchError(
        "Enter the person's name first."
      );

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
        throw new Error(
          data.error || "Search failed."
        );
      }

      setResults(data.results || []);
    } catch (error) {
      console.error(
        "Public information search error:",
        error
      );

      setSearchError(
        error.message ||
          "Could not search public information."
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

  const videoWidth = videoSize.width || 1280;
  const videoHeight = videoSize.height || 720;

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
              left: `${
                (face.bbox.x /
                  videoWidth) *
                100
              }%`,

              top: `${
                (face.bbox.y /
                  videoHeight) *
                100
              }%`,

              width: `${
                (face.bbox.width /
                  videoWidth) *
                100
              }%`,

              height: `${
                (face.bbox.height /
                  videoHeight) *
                100
              }%`
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
                faces.length === 1
                  ? ""
                  : "s"
              } detected`}
        </div>
      </div>

      {!supported && (
        <div className="face-warning">
          Face detection is not supported
          by this browser.
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
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Enter person's name"
            autoComplete="off"
          />

          <button
            onClick={searchPublicInfo}
            disabled={
              searching ||
              !name.trim()
            }
          >
            {searching
              ? "SEARCHING..."
              : "SEARCH"}
          </button>
        </div>

        <div className="face-private-note">
          Nothing about the face, name, or
          search is saved by this app.
        </div>

        {searchError && (
          <div className="face-error">
            {searchError}
          </div>
        )}

        {results.length > 0 && (
          <PublicInfoPanel
            results={results}
          />
        )}

        {(name ||
          results.length > 0) && (
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
