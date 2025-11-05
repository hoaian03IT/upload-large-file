import { FileUploadService } from "@/services/file-upload.service";
import { NextResponse } from "next/server";

const fileUploadService = new FileUploadService();

export async function POST(request: Request) {
    const body = await request.json();
    const { uploadId } = body;
    const uploadSession = await fileUploadService.getUploadSession(Number(uploadId));
    if (!uploadSession) {
        return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "File uploaded successfully", uploadId }, { status: 200 });
}
