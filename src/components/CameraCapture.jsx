import { useState, useRef } from "react";

function CameraCapture() {
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState("");
  const [useUpload, setUseUpload] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setError("");
    setUseUpload(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasCamera(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Could not access camera. Please ensure permissions are granted.",
      );
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
    setHasCamera(false);
  };

  // Handle file upload from library
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Resize to 1920x1080 maintaining aspect ratio
        const targetWidth = 1920;
        const targetHeight = 1080;

        const scale = Math.min(
          targetWidth / img.width,
          targetHeight / img.height,
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent("imageCaptured", {
            detail: { imageDataUrl: canvas.toDataURL("image/jpeg") },
          }),
        );

        // Reset upload state
        setUseUpload(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");

    // Stop camera and return image
    stopCamera();

    // Dispatch custom event for parent to capture
    window.dispatchEvent(
      new CustomEvent("imageCaptured", {
        detail: { imageDataUrl },
      }),
    );
  };

  return (
    <div className="camera-capture">
      <div className="camera-controls">
        {!hasCamera && !useUpload && (
          <>
            <button onClick={startCamera}>Start Camera</button>
            <label className="upload-label">
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
            {error && <p className="error">{error}</p>}
          </>
        )}

        {hasCamera && (
          <>
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div className="capture-buttons">
                <button onClick={captureImage}>Capture Photo</button>
                <button onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
