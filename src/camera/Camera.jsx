import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";

const Camera = forwardRef(function Camera(
  {
    onStateChange
  },
  ref
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getVideoElement() {
      return videoRef.current;
    },

    getStream() {
      return streamRef.current;
    },

    restart() {
      startCamera();
    },

    stop() {
      stopCamera();
    }
  }));

  async function startCamera() {
    try {
      onStateChange?.("starting");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      stopCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            },

            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            },

            frameRate: {
              ideal: 30,
              max: 30
            }
          },

          audio: false
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      onStateChange?.("ready");
    } catch (error) {
      console.error("Camera error:", error);

      onStateChange?.("error");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }

      streamRef.current = null;
    }
  }

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="camera-video"
      playsInline
      muted
      autoPlay
    />
  );
});

export default Camera;
