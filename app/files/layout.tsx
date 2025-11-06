import { Container, Heading } from "@chakra-ui/react";

export default function FilesLayout({ children }: { children: React.ReactNode }) {
    return (
        <Container maxW="4xl" py={8}>
            <Heading size="lg" textAlign="center" mb={8}>
                List files
            </Heading>
            {children}
        </Container>
    );
}
