import { useState } from "react";

function CameraCapture() {
  const handleImageCapture = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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

        window.dispatchEvent(
          new CustomEvent("imageCaptured", {
            detail: { imageDataUrl: canvas.toDataURL("image/jpeg") },
          }),
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageCapture(file);
      event.target.value = "";
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL("image/jpeg");

      stream.getTracks().forEach((track) => track.stop());

      window.dispatchEvent(
        new CustomEvent("imageCaptured", {
          detail: { imageDataUrl },
        }),
      );
    } catch (err) {
      console.error("Camera capture failed:", err);
    }
  };

  return (
    <div className="camera-capture">
      <div className="camera-controls">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          capture="environment"
        />
        <button type="button" onClick={handleCameraCapture}>
          Take Photo
        </button>
      </div>
    </div>
  );
}

export default CameraCapture;
