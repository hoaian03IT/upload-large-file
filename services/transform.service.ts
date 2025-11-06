import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { Worker } from "worker_threads";
import { TranscodeTask } from "@/worker";

interface Solution {
    name: string;
    height: number;
}

export class TransformService {
    private readonly ffmpeg: typeof ffmpeg;
    private readonly resolutions: Solution[];
    private readonly transformDir: string;

    constructor() {
        this.ffmpeg = ffmpeg;
        this.resolutions = [
            { name: "240p", height: 240 },
            { name: "360p", height: 360 },
            { name: "720p", height: 720 },
            { name: "1080p", height: 1080 },
            { name: "2160p", height: 2160 },
            { name: "4320p", height: 4320 },
        ];

        this.transformDir = path.join(process.cwd(), "transformed-uploads");
        if (!fs.existsSync(this.transformDir)) {
            fs.mkdirSync(this.transformDir, { recursive: true });
        }
    }

    private transformVideo(originFilePath: string, filename: string, resolution: number) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(process.cwd(), "worker.ts"));

            const task: TranscodeTask = {
                input: originFilePath,
                task: {
                    type: "video",
                    height: resolution,
                    output: path.join(this.transformDir, `${filename}-${resolution}p.mp4`),
                },
            };

            worker.postMessage(task);

            worker.on("message", (msg) => {
                if (msg.status === "done") resolve(`${msg.status}: ${msg.output}`);
                else reject(new Error(msg.error));
            });

            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }

    private transformAudio(originFilePath: string, filename: string) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(process.cwd(), "worker.ts"));

            const task: TranscodeTask = {
                input: originFilePath,
                task: {
                    type: "audio",
                    format: "mp3",
                    output: path.join(this.transformDir, `${filename}-audio.mp3`),
                },
            };
            worker.postMessage(task);

            worker.on("message", (msg) => {
                if (msg.status === "done") resolve(`${msg.status}: ${msg.output}`);
                else reject(new Error(msg.error));
            });

            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }

    async transform(originFilePath: string, folderName: string) {
        this.ffmpeg(originFilePath)
            .outputFormat("mp4")
            .ffprobe(async (err, metadata) => {
                if (err) {
                    console.error(err);
                }
                const currentResolution = metadata?.streams[0]?.height;

                const possibleSolutions = this.resolutions.filter(
                    (resolution) => resolution.height <= (currentResolution ?? 0)
                );

                // Transform each resolution
                Promise.all([
                    ...possibleSolutions.map((resolution) =>
                        this.transformVideo(originFilePath, folderName, resolution.height)
                    ),
                    this.transformAudio(originFilePath, folderName),
                ]).then(() => {
                    fs.rmSync(originFilePath, { recursive: true });
                });
            });
    }
}
