"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB chunks

export interface UploadProgress {
    file: File | null;
    uploadId: number | null;
    totalChunks: number;
    uploadedChunks: number;
    bytesUploaded: number;
    status: "idle" | "initializing" | "uploading" | "paused" | "completed" | "error";
    error: string | null;
}

interface UploadProgressContextType {
    progress: UploadProgress;
    setProgress: React.Dispatch<React.SetStateAction<UploadProgress>>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    shouldContinueUploadRef: React.MutableRefObject<boolean>;
    CHUNK_SIZE: number;

    // Functions
    handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    initializeUpload: (file: File) => Promise<number>;
    uploadChunk: (uploadId: number, chunkNumber: number, chunkData: ArrayBuffer) => Promise<void>;
    completeUpload: (uploadId: number) => Promise<void>;
    uploadFile: () => Promise<void>;
    interruptUpload: () => void;
    resumeUpload: () => Promise<void>;
    resetUpload: () => void;
    formatBytes: (bytes: number) => string;
    progressPercentage: number;
}

const UploadProgressContext = createContext<UploadProgressContextType | undefined>(undefined);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useState<UploadProgress>({
        file: null,
        uploadId: null,
        totalChunks: 0,
        uploadedChunks: 0,
        bytesUploaded: 0,
        status: "idle",
        error: null,
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const shouldContinueUploadRef = useRef(true);

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

        shouldContinueUploadRef.current = true;

        try {
            setProgress((prev) => ({ ...prev, status: "initializing", error: null }));

            // Step 1: Initialize upload
            const uploadId = await initializeUpload(progress.file);

            setProgress((prev) => ({
                ...prev,
                uploadId,
                status: "uploading",
            }));

            // Step 2: Upload chunks sequentially (interruptible)
            const file = progress.file;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let chunkNumber = progress.uploadedChunks + 1;

            while (chunkNumber <= totalChunks && shouldContinueUploadRef.current) {
                const start = (chunkNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const chunkData = await chunk.arrayBuffer();

                await uploadChunk(uploadId, chunkNumber, chunkData);

                setProgress((prev) => ({
                    ...prev,
                    uploadedChunks: chunkNumber,
                    bytesUploaded: end,
                }));

                chunkNumber++;
            }

            // Check if upload was interrupted
            if (!shouldContinueUploadRef.current) {
                setProgress((prev) => ({
                    ...prev,
                    status: "paused",
                }));
                return;
            }

            // Step 3: Complete upload
            await completeUpload(uploadId);

            setProgress((prev) => ({
                ...prev,
                status: "completed",
            }));
        } catch (error) {
            setProgress((prev) => ({
                ...prev,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }));
        }
    };

    const interruptUpload = () => {
        shouldContinueUploadRef.current = false;
    };

    const resumeUpload = async () => {
        if (!progress.file || !progress.uploadId) return;

        shouldContinueUploadRef.current = true;
        setProgress((prev) => ({ ...prev, status: "uploading", error: null }));

        try {
            // Continue from where we left off
            const file = progress.file;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let chunkNumber = progress.uploadedChunks + 1;

            while (chunkNumber <= totalChunks && shouldContinueUploadRef.current) {
                const start = (chunkNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const chunkData = await chunk.arrayBuffer();

                await uploadChunk(progress.uploadId, chunkNumber, chunkData);

                setProgress((prev) => ({
                    ...prev,
                    uploadedChunks: chunkNumber,
                    bytesUploaded: end,
                }));

                chunkNumber++;
            }

            // Check if upload was interrupted again
            if (!shouldContinueUploadRef.current) {
                setProgress((prev) => ({
                    ...prev,
                    status: "paused",
                }));
                return;
            }

            // Step 3: Complete upload
            await completeUpload(progress.uploadId);

            setProgress((prev) => ({
                ...prev,
                status: "completed",
            }));
        } catch (error) {
            setProgress((prev) => ({
                ...prev,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }));
        }
    };

    const resetUpload = () => {
        shouldContinueUploadRef.current = false;
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

    const value: UploadProgressContextType = {
        progress,
        setProgress,
        fileInputRef,
        shouldContinueUploadRef,
        CHUNK_SIZE,
        handleFileSelect,
        initializeUpload,
        uploadChunk,
        completeUpload,
        uploadFile,
        interruptUpload,
        resumeUpload,
        resetUpload,
        formatBytes,
        progressPercentage,
    };

    return <UploadProgressContext.Provider value={value}>{children}</UploadProgressContext.Provider>;
}

export function useUploadProgress() {
    const context = useContext(UploadProgressContext);
    if (context === undefined) {
        throw new Error("useUploadProgress must be used within an UploadProgressProvider");
    }
    return context;
}
