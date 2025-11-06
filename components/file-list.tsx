"use client";

import { FileStorage } from "@/prisma/app/generated/prisma/client";
import { Badge, Flex, IconButton, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { toaster } from "./ui/toaster";
import { FaLink, FaRegTrashCan } from "react-icons/fa6";
import Link from "next/link";
import dayjs from "dayjs";

export const FileList = () => {
    const [files, setFiles] = useState<FileStorage[]>([]);

    useEffect(() => {
        (async () => {
            const response = await fetch("/api/upload-file/init");
            const data = await response.json();

            if (!Array.isArray(data)) {
                toaster.create({
                    title: "Failed to get files",
                    description: "Please try again later",
                    type: "error",
                });
                return;
            }

            setFiles(data);
        })();
    }, []);

    const handledSize = (size: number) => {
        const kbBreakpoint = 1024;
        const mbBreakpoint = kbBreakpoint * 1024;
        const gbBreakpoint = mbBreakpoint * 1024;

        if (size < kbBreakpoint) {
            return `${size} KB`;
        }

        if (size < mbBreakpoint) {
            return `${(size / kbBreakpoint).toFixed(2)} KB`;
        }

        if (size < gbBreakpoint) {
            return `${(size / mbBreakpoint).toFixed(2)} MB`;
        }

        return `${(size / gbBreakpoint).toFixed(2)} GB`;
    };

    return (
        <Table.Root variant="outline" striped showColumnBorder stickyHeader>
            <Table.Caption />
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>File Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Size</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Uploaded At</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {files.map((file) => (
                    <Table.Row key={file.id}>
                        <Table.Cell>{file.id}</Table.Cell>
                        <Table.Cell>{file.fileName}</Table.Cell>
                        <Table.Cell textWrap="nowrap">{handledSize(file.size)}</Table.Cell>
                        <Table.Cell>
                            <Badge variant="surface" colorPalette={file.status === "completed" ? "green" : "red"}>
                                {file.status}
                            </Badge>
                        </Table.Cell>
                        <Table.Cell textWrap="nowrap">{dayjs(file.createdAt).format("MMM D, YY HH:mm a")}</Table.Cell>
                        <Table.Cell>
                            <Flex gap={2}>
                                <Link href={file.path ?? ""}>
                                    <IconButton aria-label="Copy link" size="xs" variant="subtle" colorPalette="blue">
                                        <FaLink />
                                    </IconButton>
                                </Link>
                                <IconButton aria-label="Delete file" size="xs" variant="subtle" colorPalette="red">
                                    <FaRegTrashCan />
                                </IconButton>
                            </Flex>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
            <Table.Caption>
                {files.length} {files.length > 1 ? "files" : "file"} found
            </Table.Caption>
        </Table.Root>
    );
};
