import { FileUploadService } from "@/services/file-upload.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const fileUploadRequestSchema = z.object({
    fileName: z.string(),
    fileSize: z.number(),
    metadata: z.record(z.string(), z.unknown()),
});

const fileUploadService = new FileUploadService();

export async function POST(request: Request) {
    const body = await request.json();
    const parsedBody = fileUploadRequestSchema.safeParse(body);
    if (!parsedBody.success) {
        return NextResponse.json({ error: parsedBody.error.message }, { status: 400 });
    }

    const { fileName, fileSize, metadata } = parsedBody.data;

    const upload = await fileUploadService.createUploadSession(fileName, fileSize, metadata);

    return NextResponse.json({ uploadId: upload, status: "readyToUpload" });
}

export async function GET() {
    const files = await fileUploadService.getFiles();
    return NextResponse.json(files);
}

export async function DELETE() {
    await fileUploadService.deleteFiles();
    return NextResponse.json({ message: "Files deleted successfully" });
}
