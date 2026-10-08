import { useEffect, useRef, useState } from "react";
import "./App.css";
import Progress from "./components/Progress.jsx";
import AutumnScavengerHuntData from "./data/autumn-scavenger-hunt.json";
import CameraCapture from "./components/CameraCapture.jsx";

function App() {
  // Model loading
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Input and Output
  const [imageInput, setImageInput] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [output, setOutput] = useState("");

  // Create a reference to the worker object.
  const worker = useRef(null);

  // Handle captured images
  useEffect(() => {
    const handleImageCaptured = (event) => {
      setImageInput(event.detail.imageDataUrl);
      setOutput("");
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
          setOutput((o) => o + e.data.output);
          break;

        case "complete":
          // Generation complete: re-enable the "Translate" button
          setDisabled(false);
          setDetectedObjects(e.data.output);
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
    setOutput("");
    worker.current.postMessage({
      image: imageInput,
    });
  };

  return (
    <>
      <h1>Autumn Hunt AI</h1>
      <h2>Get outside and find some autumn fun!</h2>

      <div className="container">
        <CameraCapture />

        {imageInput && (
          <div className="image-preview">
            <img src={imageInput} alt="Captured" />
          </div>
        )}
      </div>

      <button disabled={!imageInput || disabled} onClick={detectObjects}>
        Detect Autumn
      </button>

      <div className="progress-bars-container">
        {ready === false && <label>Loading models... (only run once)</label>}
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
