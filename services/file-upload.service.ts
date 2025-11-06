import path from "path";
import fs from "fs";
import { PrismaClient } from "@/prisma/app/generated/prisma/client";
import { TransformService } from "./transform.service";

export class FileUploadService {
    private readonly uploadDir: string;
    private readonly unhandledChunksDir: string;
    private readonly prisma: PrismaClient;
    private readonly transformService: TransformService;

    constructor() {
        this.prisma = new PrismaClient();
        this.uploadDir = path.join(process.cwd(), "uploads");
        this.unhandledChunksDir = path.join(process.cwd(), "unhandled-chunks");
        this.transformService = new TransformService();
    }

    async getFiles() {
        return this.prisma.fileStorage.findMany();
    }

    getUploadSession(uploadId: number) {
        return this.prisma.fileStorage.findUnique({
            where: {
                id: uploadId,
            },
        });
    }

    private cleanUpUnhandledChunks(uploadId: number) {
        const unhandledChunksFolderPath = path.join(this.unhandledChunksDir, uploadId.toString());
        if (fs.existsSync(unhandledChunksFolderPath)) {
            fs.rmdirSync(unhandledChunksFolderPath, { recursive: true });
        }
    }

    generateUniqueKey(fileName: string) {
        const key = `${fileName.split(".")[0]}-${Date.now().toString()}${path.extname(fileName)}`;
        return key;
    }

    private async mergeFiles(uploadId: number) {
        const uploadSession = await this.getUploadSession(uploadId);
        if (!uploadSession) {
            throw new Error("Upload session not found");
        }
        const unhandledChunksFolderPath = path.join(this.unhandledChunksDir, uploadId.toString());

        if (!fs.existsSync(unhandledChunksFolderPath)) {
            throw new Error("Unhandled chunks folder not found");
        }

        const chunkFiles = fs.readdirSync(unhandledChunksFolderPath).sort((a, b) => {
            const splitA = a.split(".part");
            const splitB = b.split(".part");
            return parseInt(splitA[splitA.length - 1]) - parseInt(splitB[splitB.length - 1]);
        });

        const mergedFilePath = path.join(this.uploadDir, uploadSession.key);

        if (!fs.existsSync(mergedFilePath)) {
            fs.writeFileSync(mergedFilePath, "");
        }

        for (const chunkFile of chunkFiles) {
            const chunkFilePath = path.join(unhandledChunksFolderPath, chunkFile);
            const chunkData = fs.readFileSync(chunkFilePath);
            fs.appendFileSync(mergedFilePath, chunkData);
        }

        // Clean up unhandled chunks
        this.cleanUpUnhandledChunks(uploadId);
    }

    async createUploadSession(fileName: string, fileSize: number, metadata: Record<string, unknown>) {
        const uniqueName = this.generateUniqueKey(fileName);
        const filePath = path.join(this.uploadDir, uniqueName);

        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        const fileMetadata = await this.prisma.fileStorage.create({
            data: {
                key: uniqueName,
                fileName,
                size: fileSize,
                path: filePath,
                status: "uploading",
                metadata: JSON.stringify(metadata),
                uploadedChunks: [],
            },
        });

        return fileMetadata.id;
    }

    async uploadChunk(uploadId: number, chunkNumber: number, chunkData: Buffer) {
        const uploadSession = await this.getUploadSession(uploadId);
        if (!uploadSession) {
            throw new Error("Upload session not found");
        }

        const unhandledChunksFolderPath = path.join(this.unhandledChunksDir, uploadId.toString());

        if (!fs.existsSync(unhandledChunksFolderPath)) {
            fs.mkdirSync(unhandledChunksFolderPath, { recursive: true });
        }

        const chunkFilePath = path.join(unhandledChunksFolderPath, `${uploadSession.key}.part${chunkNumber}`);

        if (!fs.existsSync(chunkFilePath)) {
            fs.writeFileSync(chunkFilePath, chunkData);
        }
    }

    async completeUpload(uploadId: number) {
        const uploadSession = await this.getUploadSession(uploadId);
        if (!uploadSession) {
            throw new Error("Upload session not found");
        }

        await this.mergeFiles(uploadId);

        const splittedFileName = uploadSession.key.split(".");
        const fileNameWithoutExtension = splittedFileName.slice(0, splittedFileName.length - 1).join("."); // to remove the last extension in case has multiple extensions

        await this.transformService.transform(path.join(this.uploadDir, uploadSession.key), fileNameWithoutExtension);

        await this.prisma.fileStorage.update({
            where: {
                id: uploadId,
            },
            data: {
                status: "completed",
            },
        });
    }

    async deleteFiles() {
        return this.prisma.fileStorage.deleteMany();
    }
}
