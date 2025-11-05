import { FileUploadService } from "@/services/file-upload.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const headerRequestSchema = z.object({
    "x-upload-id": z
        .string()
        .transform((val) => parseInt(val))
        .refine((data) => data > 0, { message: "Upload ID must be a positive number" }),
    "x-chunk-number": z
        .string()
        .transform((val) => parseInt(val))
        .refine((data) => data > 0, { message: "Chunk number must be a positive number" }),
});

const fileUploadService = new FileUploadService();

export async function POST(request: Request) {
    const headers = request.headers;

    const parsedHeaders = headerRequestSchema.safeParse({
        "x-upload-id": headers.get("x-upload-id"),
        "x-chunk-number": headers.get("x-chunk-number"),
    });

    if (!parsedHeaders.success) {
        return NextResponse.json({ error: parsedHeaders.error.message }, { status: 400 });
    }

    const { "x-upload-id": uploadId, "x-chunk-number": chunkNumber } = parsedHeaders.data;

    const uploadSession = await fileUploadService.getUploadSession(Number(uploadId));
    if (!uploadSession) {
        return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }
    await fileUploadService.uploadChunk(Number(uploadId), chunkNumber, Buffer.from(await request.arrayBuffer()));

    return NextResponse.json({ message: "Chunk uploaded successfully", chunkNumber, uploadId }, { status: 200 });
}
