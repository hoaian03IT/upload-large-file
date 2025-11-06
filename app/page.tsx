"use client";

import {
    Button,
    Box,
    HStack,
    Container,
    Heading,
    Text,
    Code,
    Field,
    Progress,
    AlertRoot as Alert,
    AlertTitle,
    AlertDescription,
    FileUpload,
} from "@chakra-ui/react";
import { useUploadProgress } from "@/contexts/upload-progress-context";
import { HiUpload } from "react-icons/hi";

export default function Home() {
    const {
        progress,
        fileInputRef,
        CHUNK_SIZE,
        handleFileSelect,
        uploadFile,
        interruptUpload,
        resumeUpload,
        resetUpload,
        formatBytes,
        progressPercentage,
    } = useUploadProgress();

    return (
        <Container maxW="2xl" py={8}>
            <Heading size="lg" textAlign="center" mb={8}>
                Large File Upload Test
            </Heading>

            <Box bg="white" borderRadius="lg" boxShadow="lg" p={6} mb={6}>
                <Field.Root mb={6}>
                    <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                        Select File to Upload
                    </Field.Label>
                    <FileUpload.Root gap="1" maxWidth="300px" disabled={progress.status === "uploading"}>
                        <FileUpload.HiddenInput ref={fileInputRef} onChange={handleFileSelect} />
                        <FileUpload.Trigger asChild>
                            <Button variant="outline" size="sm">
                                <HiUpload /> Upload file
                            </Button>
                        </FileUpload.Trigger>
                    </FileUpload.Root>
                </Field.Root>

                {progress.file && (
                    <Box mb={6} p={4} bg="gray.50" borderRadius="lg">
                        <Heading size="md" mb={2}>
                            File Details
                        </Heading>
                        <Text fontSize="sm" color="gray.600">
                            <Text as="span" fontWeight="medium">
                                Name:
                            </Text>
                            &nbsp;
                            {progress.file.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            <Text as="span" fontWeight="medium">
                                Size:
                            </Text>
                            &nbsp;
                            {formatBytes(progress.file.size)}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            <Text as="span" fontWeight="medium">
                                Chunks:
                            </Text>
                            &nbsp;
                            {progress.totalChunks} ({formatBytes(CHUNK_SIZE)} each)
                        </Text>
                    </Box>
                )}

                {progress.status !== "idle" && progress.status !== "completed" && (
                    <Box mb={6}>
                        <HStack justify="space-between" fontSize="sm" color="gray.600" mb={2}>
                            <Text>Progress</Text>
                        </HStack>

                        <Progress.Root value={progress.uploadedChunks} max={progress.totalChunks}>
                            <Progress.Track>
                                <Progress.Range />
                            </Progress.Track>
                            <Progress.Label />
                            <Progress.ValueText />
                        </Progress.Root>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.file?.size || 0)}
                        </Text>
                    </Box>
                )}

                {progress.status === "initializing" && (
                    <Alert status="info" mb={4}>
                        <Text mr={2}>ℹ️</Text>
                        <AlertDescription>Initializing upload session...</AlertDescription>
                    </Alert>
                )}

                {progress.status === "uploading" && (
                    <Alert status="success" mb={4}>
                        <Text mr={2}>✅</Text>
                        <AlertDescription>Uploading... ({progressPercentage}% complete)</AlertDescription>
                    </Alert>
                )}

                {progress.status === "paused" && (
                    <Alert status="warning" mb={4}>
                        <Text mr={2}>⏸️</Text>
                        <Box>
                            <AlertTitle>Upload paused</AlertTitle>
                            <AlertDescription>Progress saved. Click Resume to continue.</AlertDescription>
                        </Box>
                    </Alert>
                )}

                {progress.status === "completed" && (
                    <Alert status="success" mb={4}>
                        <Text mr={2}>🎉</Text>
                        <Box>
                            <AlertTitle>Upload completed successfully!</AlertTitle>
                            <AlertDescription>Upload ID: {progress.uploadId}</AlertDescription>
                        </Box>
                    </Alert>
                )}

                {progress.error && (
                    <Alert status="error" mb={4}>
                        <Text mr={2}>❌</Text>
                        <Box>
                            <AlertTitle>Upload failed</AlertTitle>
                            <AlertDescription>{progress.error}</AlertDescription>
                        </Box>
                    </Alert>
                )}

                <HStack gap={4}>
                    {progress.status === "idle" && (
                        <Button onClick={uploadFile} disabled={!progress.file} colorScheme="blue" size="lg" flex={1}>
                            Start Upload
                        </Button>
                    )}

                    {progress.status === "uploading" && (
                        <Button onClick={interruptUpload} colorScheme="yellow" size="lg" flex={1}>
                            Interrupt Upload
                        </Button>
                    )}

                    {progress.status === "paused" && (
                        <HStack gap={4} flex={1}>
                            <Button onClick={resumeUpload} colorScheme="green" size="lg" flex={1}>
                                Resume Upload
                            </Button>
                            <Button onClick={resetUpload} colorScheme="gray" size="lg">
                                Cancel
                            </Button>
                        </HStack>
                    )}

                    {progress.status === "initializing" && (
                        <Button disabled colorScheme="gray" size="lg" flex={1}>
                            Initializing...
                        </Button>
                    )}

                    {(progress.status === "completed" || progress.status === "error") && (
                        <Button onClick={resetUpload} colorScheme="gray" size="lg" flex={1}>
                            Upload Another File
                        </Button>
                    )}
                </HStack>
            </Box>

            <Box bg="gray.50" borderRadius="lg" p={4} fontSize="sm" color="gray.600">
                <Heading size="md" mb={2}>
                    API Flow:
                </Heading>
                <Box as="ol" className="space-y-1">
                    <Box as="li">
                        <Code bg="white" px={1} py={0.5} borderRadius="md">
                            POST /api/upload-file/init
                        </Code>{" "}
                        - Initialize upload session
                    </Box>
                    <Box as="li">
                        <Code bg="white" px={1} py={0.5} borderRadius="md">
                            POST /api/upload-file/chunk
                        </Code>{" "}
                        - Upload each chunk sequentially
                    </Box>
                    <Box as="li">
                        <Code bg="white" px={1} py={0.5} borderRadius="md">
                            POST /api/upload-file/complete
                        </Code>{" "}
                        - Complete the upload
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
