

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
    <div className="camera-capture flex flex-col items-center p-5">
      <div className="camera-controls w-full max-w-[640px]">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          capture="environment"
          className="p-0.5 cursor-pointer rounded-md border border-transparent bg-gray-100 text-sm font-medium hover:border-autumn-500 hover:bg-autumn-50 transition-colors"
        />
        <button
          type="button"
          onClick={handleCameraCapture}
          className="px-4 py-2 cursor-pointer font-medium rounded-md border border-transparent bg-leaf-500 text-white text-sm hover:bg-leaf-600 focus:outline-4 focus:outline-auto focus:outline-[-webkit-focus-ring-color]"
        >
          Take Photo
        </button>
      </div>
    </div>
  );
}

export default CameraCapture;
