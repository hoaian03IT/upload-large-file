import { FileUploadService } from "@/services/file-upload.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const headerRequestSchema = z.object({
    uploadId: z.string().nonempty(),
    chunkNumber: z.number().int().positive(),
});

const fileUploadService = new FileUploadService();

export async function POST(request: Request) {
    const headers = request.headers;

    const parsedHeaders = headerRequestSchema.safeParse(headers);
    if (!parsedHeaders.success) {
        return NextResponse.json({ error: parsedHeaders.error.message }, { status: 400 });
    }

    const { uploadId, chunkNumber } = parsedHeaders.data;

    const uploadSession = await fileUploadService.getUploadSession(Number(uploadId));
    if (!uploadSession) {
        return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }
    await fileUploadService.uploadChunk(Number(uploadId), chunkNumber, Buffer.from(await request.arrayBuffer()));

    return NextResponse.json({ message: "Chunk uploaded successfully", chunkNumber, uploadId }, { status: 200 });
}
