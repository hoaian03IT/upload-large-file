"use client";

import { Box, Text, Progress, Alert, VStack, HStack } from "@chakra-ui/react";
import { useUploadProgress } from "@/contexts/upload-progress-context";

export function GlobalProgress() {
    const { progress, formatBytes, progressPercentage } = useUploadProgress();

    if (progress.status === "idle") {
        return null;
    }

    return (
        <Box position="fixed" top={4} right={4} zIndex={1000} maxW="400px">
            <VStack gap={2}>
                {progress.status === "initializing" && (
                    <Alert.Root>
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Initializing upload session...</Alert.Title>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {progress.status === "uploading" && (
                    <Alert.Root status="success" size="sm">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Uploading... ({progressPercentage}% complete)</Alert.Title>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {progress.status === "paused" && (
                    <Alert.Root status="warning" size="sm">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Upload paused</Alert.Title>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {progress.status === "completed" && (
                    <Alert.Root status="success" size="sm">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Upload completed!</Alert.Title>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {progress.error && (
                    <Alert.Root status="error" size="sm">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>{progress.error}</Alert.Title>
                        </Alert.Content>
                        <Text>{progress.error}</Text>
                    </Alert.Root>
                )}

                {progress.status !== "uploading" && progress.status !== "completed" && progress.status !== "error" && (
                    <Box bg="white" p={3} borderRadius="md" boxShadow="md" w="full">
                        <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color="gray.600">
                                Progress
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                                {progress.uploadedChunks} / {progress.totalChunks} chunks
                            </Text>
                        </HStack>
                        <Progress.Root value={progress.uploadedChunks} max={progress.totalChunks} size="sm">
                            <Progress.Track>
                                <Progress.Range />
                            </Progress.Track>
                        </Progress.Root>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.file?.size || 0)}
                        </Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}
