"use client";

import { Container, Text } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Header = () => {
    const pathname = usePathname();

    return (
        <header>
            <nav>
                <Container bg="blue.100" p={1} display="flex" gap={2} justifyContent="center">
                    <Link href="/">
                        <Text
                            _hover={{ bg: "blue.200" }}
                            bg={pathname === "/" ? "blue.300" : "transparent"}
                            px={4}
                            py={2}
                            borderRadius="md"
                            fontSize="xl"
                            fontWeight="bold"
                            color="blue.800">
                            Upload
                        </Text>
                    </Link>
                    <Link href="/files">
                        <Text
                            _hover={{ bg: "blue.200" }}
                            bg={pathname === "/files" ? "blue.300" : "transparent"}
                            px={4}
                            py={2}
                            borderRadius="md"
                            fontSize="xl"
                            fontWeight="bold"
                            color="blue.800">
                            Files
                        </Text>
                    </Link>
                </Container>
            </nav>
        </header>
    );
};
