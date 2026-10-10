import { pipeline } from "@huggingface/transformers";

class ObjectDetectionPipeline {
  static task = "object-detection";
  static model = "onnx-community/rtdetr_v2_r50vd-ONNX";
  static threshold = 0.1;
  static instance = null;

  static async getInstance(progress_callback = null) {
    this.instance ??= pipeline(this.task, this.model, { progress_callback });
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  // Retrieve the object detection pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const detector = await ObjectDetectionPipeline.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage(x);
  });

  // Send the output back to the main thread
  self.postMessage({
    status: "ai-process-started"
  });

  // Actually perform the object detection
  const output = await detector(event.data.image, {
    threshold: ObjectDetectionPipeline.threshold,
  });

  // Send the output back to the main thread
  self.postMessage({
    status: "complete",
    output,
  });
});