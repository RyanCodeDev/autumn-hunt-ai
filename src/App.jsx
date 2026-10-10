import { useEffect, useRef, useState } from "react";
import Progress from "./components/Progress.jsx";
import CameraCapture from "./components/CameraCapture.jsx";

function App() {
  // Model loading
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Input and Output
  const [imageInput, setImageInput] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Create a reference to the worker object.
  const worker = useRef(null);

  // Handle captured images
  useEffect(() => {
    const handleImageCaptured = (event) => {
      setImageInput(event.detail.imageDataUrl);
    };

    window.addEventListener("imageCaptured", handleImageCaptured);

    return () => {
      window.removeEventListener("imageCaptured", handleImageCaptured);
    };
  }, []);

  // We use the `useEffect` hook to set up the worker as soon as the `App` component is mounted.
  useEffect(() => {
    // Create the worker if it does not yet exist.
    worker.current ??= new Worker(new URL("./lib/worker.js", import.meta.url), {
      type: "module",
    });
    console.log("AI Worker created:", worker.current);

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      console.log("Message received from worker:", e.data);
      switch (e.data.status) {
        case "initiate":
          // Model file start load: add a new progress item to the list.
          setReady(false);
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress };
              }
              return item;
            }),
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setReady(true);
          break;

        case "update":
          // Generation update: update the output text.
          break;

        case "ai-process-started":
          // AI process started: update the status message.
          setStatusMessage("Analyzing image with local AI...");
          setDetectedObjects([]);
          break;

        case "complete":
          // Generation complete: re-enable the "Translate" button
          setDisabled(false);
          setDetectedObjects(e.data.output);
          setStatusMessage("");
          console.log("Detected objects:", e.data.output);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  const detectObjects = () => {
    setDisabled(true);
    worker.current.postMessage({
      image: imageInput,
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-autumn-900 mb-4">Autumn Hunt AI</h1>
      <h2 className="text-xl font-semibold text-autumn-800 mb-4">
        Get outside and find some autumn fun!{" "}
      </h2>

      <div className="container m-6 flex flex-col gap-2.5">
        <CameraCapture />

        {imageInput && (
          <div className="image-preview mt-5 text-center">
            <img src={imageInput} alt="Captured" className="max-w-full max-h-[400px] rounded-lg border-2 border-gray-800" />
          </div>
        )}
      </div>

      <button
        disabled={!imageInput || disabled}
        onClick={detectObjects}
        className="px-[0.6em] py-[0.6em] cursor-pointer font-medium rounded-md border border-transparent bg-autumn-500 text-white text-sm hover:bg-autumn-600 focus:outline-4 focus:outline-auto focus:outline-[-webkit-focus-ring-color]"
      >
        Detect Autumn
      </button>
      <p className="status-message text-red-600 text-sm mt-2.5">{statusMessage}</p>

      {detectedObjects.length > 0 && (
        <div id="detected-objects">
          <h3 className="text-lg font-semibold text-autumn-900 mb-2">Detected Objects:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {detectedObjects.map((obj, index) => (
              <li key={index}>
                <span className="text-autumn-800">{obj.label}</span> (
                <span className="text-autumn-600">{obj.score.toFixed(2)}</span>
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="progress-bars-container p-2 h-35">
        {ready === false && <label className="text-autumn-900">Loading models... (only run once)</label>}
        {progressItems.map((data) => (
          <div key={data.file}>
            <Progress text={data.file} percentage={data.progress} />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
