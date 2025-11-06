import { parentPort } from "worker_threads";
import ffmpeg from "fluent-ffmpeg";

export interface TranscodeTask {
    input: string;
    task: { type: "video"; height?: number; output: string } | { type: "audio"; format: "mp3" | "aac"; output: string };
}

parentPort?.on("message", (msg: TranscodeTask) => {
    const { input, task } = msg;

    if (task.type === "video") {
        ffmpeg(input)
            .size(`?x${task.height}`) // keep aspect ratio
            .videoCodec("libx264")
            .audioCodec("aac")
            .outputOptions(["-preset fast", "-crf 23"])
            .save(task.output)
            .on("end", () => {
                console.log("==============================================Task completed", task.output);
                parentPort?.postMessage({ status: "done", output: task.output });
            })
            .on("error", (err) => parentPort?.postMessage({ status: "error", error: err.message }));
    } else if (task.type === "audio") {
        ffmpeg(input)
            .outputFormat(task.format)
            .save(task.output)
            .on("end", () => {
                console.log("==============================================Task completed", task.output);
                parentPort?.postMessage({ status: "done", output: task.output });
            })
            .on("error", (err) => parentPort?.postMessage({ status: "error", error: err.message }));
    }
});
