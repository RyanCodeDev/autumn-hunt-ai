import { useEffect, useRef, useState } from "react";
import CameraCapture from "./components/CameraCapture.jsx";
import scavengerHuntItems from "./data/autumn-scavenger-hunt.json";
import toast, { Toaster } from "react-hot-toast";

function App() {
  // Model loading
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Input and Output
  const [imageInput, setImageInput] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Scavenger hunt list state
  const [completedItems, setCompletedItems] = useState([]);

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

  const checkDetectedObjects = (detected) => {
    const detectedLabels = detected.map((obj) => {
      // Remove spaces from label
      const label = obj.label.replace(/\s+/g, "");
      return label.toLowerCase();
    });

    scavengerHuntItems.forEach((item, index) => {
      const itemName = item.name.replace(/\s+/g, "").toLowerCase();
      const itemAlternatives = item.alternatives.map((alt) =>
        alt.replace(/\s+/g, "").toLowerCase(),
      );

      const allVariants = [itemName, ...itemAlternatives];

      if (detectedLabels.some((label) => allVariants.includes(label))) {
        setCompletedItems((prev) => {
          if (prev.includes(index)) return prev;
          return [...prev, index];
        });
        toast.success(`You found: ${item.name}!`);
      }
    });
  };

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
          toast.loading(`Loading local model file ${e.data.file}...`, {
            id: "modelLoading",
          });
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
          toast.loading(
            `Loading local model file ${e.data.file}... ${e.data.progress.toFixed(2)}%`,
            { id: "modelLoading" },
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
          toast.dismiss("modelLoading");
          break;

        case "update":
          // Generation update: update the output text.
          break;

        case "ai-process-started":
          setDisabled(true);
          // AI process started: update the status message.
          toast.loading("Analyzing image with local AI...", {
            id: "aiAnalyze",
          });
          setDetectedObjects([]);
          break;

        case "complete":
          // Generation complete: re-enable the "Translate" button
          setDisabled(false);
          setDetectedObjects(e.data.output);
          setStatusMessage("");
          console.log("Detected objects:", e.data.output);
          toast("Local image analysis completed", { id: "aiAnalyze" });
          setDetectedObjects(e.data.output);
          // Check for matches and mark items as completed
          checkDetectedObjects(e.data.output);
          break;

        default:
          console.warn("Unknown message from worker:", e.data);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  // const resetCompletedItems = () => {
  //   setCompletedItems([]);
  // };

  const detectObjects = () => {
    setDisabled(true);
    worker.current.postMessage({
      image: imageInput,
    });
  };

  return (
    <div id="main-app-container">
      <Toaster />
      <h1 className="text-3xl font-bold text-autumn-900 mb-1">
        Autumn Hunt AI
      </h1>
      <h2 className="text-xl font-semibold text-autumn-800 mb-4">
        Get outside and find some autumn fun!{" "}
      </h2>

      <div className="container m-1 flex flex-col gap-2.5">
        {/* Scavenger Hunt List */}
        <div className="scavenger-hunt-list p-4 bg-autumn-50 rounded-lg border border-autumn-200">
          <h3 className="text-lg font-semibold text-autumn-900 mb-3">
            Snap a picture of these items to check them off your list!
          </h3>
          <ul className="space-y-2">
            {scavengerHuntItems.map((item, index) => {
              const isCompleted = completedItems.includes(index);
              return (
                <li
                  key={index}
                  className={`flex items-center rounded ${
                    isCompleted
                      ? "text-gray-400 line-through"
                      : "text-autumn-800"
                  }`}
                >
                  <span className="mr-2">•</span>
                  <span>{item.name}</span>
                  {isCompleted && (
                    <span className="ml-2 text-green-600 text-sm">✓</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <CameraCapture />

        <div className="flex flex-col gap-2 justify-center max-w-[90%] mx-auto">
          {imageInput && (
            <div className="image-preview mt-5 text-center mx-auto">
              <img
                src={imageInput}
                alt="Captured"
                className="max-w-full max-h-100 rounded-lg border-2 border-gray-800"
              />
            </div>
          )}

          <button
            disabled={!imageInput || disabled}
            onClick={detectObjects}
            className="px-[0.6em] py-[0.6em] cursor-pointer font-medium rounded-md border border-transparent bg-autumn-500 text-white text-sm hover:bg-autumn-600 focus:outline-4 focus:outline-auto focus:outline-[-webkit-focus-ring-color] w-full max-w-xl mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Detect Autumn
          </button>
        </div>

        {detectedObjects.length > 0 && (
          <div id="detected-objects">
            <p className="font-semibold text-autumn-900 mb-2">
              The local AI model detected objects in your image that{" "}
              <em>may</em> look like the following. We know that AI models are
              not perfect, so some of these results may be hilarious.
            </p>
            <table className="max-w-lg">
              <thead>
                <tr className="text-sm">
                  <th className="text-autumn-800 border-b border-autumn-200 px-2 py-1">
                    Object
                  </th>
                  <th className="text-autumn-600 border-b border-autumn-200 px-2 py-1">
                    Confidence Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {detectedObjects.map((obj, index) => (
                  <tr key={index} className="text-sm">
                    <td className="text-autumn-800 border-b border-autumn-100 px-2 py-1 text-center">
                      {obj.label}
                    </td>
                    <td className="text-autumn-600 border-b border-autumn-100 px-2 py-1 text-center">
                      {obj.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
