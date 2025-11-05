"use client";

import { useState, useRef, useEffect } from "react";

const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB chunks

interface UploadProgress {
    file: File | null;
    uploadId: number | null;
    totalChunks: number;
    uploadedChunks: number;
    bytesUploaded: number;
    status: "idle" | "initializing" | "uploading" | "completed" | "error";
    error: string | null;
}

export default function Home() {
    const [progress, setProgress] = useState<UploadProgress>({
        file: null,
        uploadId: null,
        totalChunks: 0,
        uploadedChunks: 0,
        bytesUploaded: 0,
        status: "idle",
        error: null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (progress.error) alert(progress.error);
    }, [progress.error]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setProgress({
                file,
                uploadId: null,
                totalChunks: Math.ceil(file.size / CHUNK_SIZE),
                uploadedChunks: 0,
                bytesUploaded: 0,
                status: "idle",
                error: null,
            });
        }
    };

    const initializeUpload = async (file: File): Promise<number> => {
        const response = await fetch("/api/upload-file/init", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileName: file.name,
                fileSize: file.size,
                metadata: {
                    mimeType: file.type,
                    lastModified: file.lastModified,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to initialize upload: ${response.statusText}`);
        }

        const data = await response.json();
        return data.uploadId;
    };

    const uploadChunk = async (uploadId: number, chunkNumber: number, chunkData: ArrayBuffer): Promise<void> => {
        const response = await fetch("/api/upload-file/chunk", {
            method: "POST",
            headers: {
                "x-upload-id": uploadId.toString(),
                "x-chunk-number": chunkNumber.toString(),
                "Content-Type": "application/octet-stream",
            },
            body: chunkData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload chunk ${chunkNumber}: ${response.statusText}`);
        }
    };

    const completeUpload = async (uploadId: number): Promise<void> => {
        const response = await fetch("/api/upload-file/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uploadId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to complete upload: ${response.statusText}`);
        }
    };

    const uploadFile = async () => {
        if (!progress.file) return;

        try {
            setProgress((prev) => ({ ...prev, status: "initializing", error: null }));

            // Step 1: Initialize upload
            const uploadId = await initializeUpload(progress.file);

            setProgress((prev) => ({
                ...prev,
                uploadId,
                status: "uploading",
            }));

            // Step 2: Upload chunks sequentially
            const file = progress.file;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

            for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
                const start = (chunkNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const chunkData = await chunk.arrayBuffer();

                console.log(uploadId);

                await uploadChunk(uploadId, chunkNumber, chunkData);

                setProgress((prev) => ({
                    ...prev,
                    uploadedChunks: chunkNumber,
                    bytesUploaded: end,
                }));
            }

            // Step 3: Complete upload
            await completeUpload(uploadId);

            setProgress((prev) => ({
                ...prev,
                status: "completed",
            }));
        } catch (error) {
            console.log(error);
            setProgress((prev) => ({
                ...prev,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }));
        }
    };

    const resetUpload = () => {
        setProgress({
            file: null,
            uploadId: null,
            totalChunks: 0,
            uploadedChunks: 0,
            bytesUploaded: 0,
            status: "idle",
            error: null,
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const progressPercentage =
        progress.file && progress.totalChunks > 0
            ? Math.round((progress.uploadedChunks / progress.totalChunks) * 100)
            : 0;

    const getFiles = async () => {
        const response = await fetch("/api/upload-file/init");
        const data = await response.json();
        console.log(data);
    };

    const deleteFiles = async () => {
        const response = await fetch("/api/upload-file/init", {
            method: "DELETE",
        });
        const data = await response.json();
        console.log(data);
    };

    return (
        <div className="container mx-auto max-w-2xl p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Large File Upload Test</h1>

            <div className="flex justify-between">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={getFiles}>
                    Get Files
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={deleteFiles}>
                    Delete Files
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select File to Upload</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={progress.status === "uploading"}
                    />
                </div>

                {progress.file && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">File Details</h3>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Name:</span> {progress.file.name}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Size:</span> {formatBytes(progress.file.size)}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Chunks:</span> {progress.totalChunks} (
                            {formatBytes(CHUNK_SIZE)} each)
                        </p>
                    </div>
                )}

                {progress.status !== "idle" && progress.status !== "completed" && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>
                                {progress.uploadedChunks} / {progress.totalChunks} chunks
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.file?.size || 0)}
                        </p>
                    </div>
                )}

                {progress.status === "initializing" && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800">Initializing upload session...</p>
                    </div>
                )}

                {progress.status === "uploading" && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800">Uploading chunks... ({progressPercentage}% complete)</p>
                    </div>
                )}

                {progress.status === "completed" && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold">Upload completed successfully! ✅</p>
                        <p className="text-green-700 text-sm mt-1">Upload ID: {progress.uploadId}</p>
                    </div>
                )}

                {progress.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-semibold">Upload failed ❌</p>
                        <p className="text-red-700 text-sm mt-1">{progress.error}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={uploadFile}
                        disabled={
                            !progress.file || progress.status === "uploading" || progress.status === "initializing"
                        }
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {progress.status === "uploading" ? "Uploading..." : "Start Upload"}
                    </button>

                    {(progress.status === "completed" || progress.status === "error") && (
                        <button
                            onClick={resetUpload}
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                            Upload Another File
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <h3 className="font-semibold mb-2">API Flow:</h3>
                <ol className="list-decimal list-inside space-y-1">
                    <li>
                        <code className="bg-white px-1 py-0.5 rounded">POST /api/upload-file/init</code> - Initialize
                        upload session
                    </li>
                    <li>
                        <code className="bg-white px-1 py-0.5 rounded">POST /api/upload-file/chunk</code> - Upload each
                        chunk sequentially
                    </li>
                    <li>
                        <code className="bg-white px-1 py-0.5 rounded">POST /api/upload-file/complete</code> - Complete
                        the upload
                    </li>
                </ol>
            </div>
        </div>
    );
}
