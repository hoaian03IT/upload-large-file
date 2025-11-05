import path from "path";
import fs from "fs";
import { PrismaClient } from "@/prisma/app/generated/prisma/client";

export class FileUploadService {
    private readonly uploadDir: string;
    private readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
        this.uploadDir = path.join(process.cwd(), "uploads");
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

    generateUniqueKey(fileName: string) {
        const key = `${fileName}-${Date.now().toString()}${path.extname(fileName)}`;
        return key;
    }

    async createUploadSession(fileName: string, fileSize: number, metadata: Record<string, unknown>) {
        const uniqueName = this.generateUniqueKey(fileName);
        const filePath = path.join(this.uploadDir, uniqueName);

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
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

        const chunkFilePath = path.join(process.cwd(), `${uploadSession.key}.part${chunkNumber}`);
        fs.writeFileSync(chunkFilePath, chunkData);

        console.log(`📦 Saved chunk ${chunkNumber} for ${uploadSession.fileName}`);
    }

    async completeUpload(uploadId: number) {
        await this.prisma.fileStorage.update({
            where: {
                id: uploadId,
            },
            data: {
                status: "completed",
            },
        });
    }
}
