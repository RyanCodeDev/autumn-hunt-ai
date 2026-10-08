import { pipeline } from "@huggingface/transformers";

class ObjectDetectionPipeline {
  static task = "object-detection";
  static model = "Xenova/detr-resnet-50";
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

  // // Capture partial output as it streams from the pipeline
  // const streamer = new TextStreamer(detector.tokenizer, {
  //   skip_prompt: true,
  //   skip_special_tokens: true,
  //   callback_function: function (text) {
  //     self.postMessage({
  //       status: "update",
  //       output: text,
  //     });
  //   },
  // });

  // Actually perform the object detection
  const output = await detector(event.data.image, {
    threshold: 0.6,
  });

  // Send the output back to the main thread
  self.postMessage({
    status: "complete",
    output,
  });
});