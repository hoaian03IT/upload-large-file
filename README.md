# Large File Upload with Chunks

A practice project demonstrating large file upload implementation using chunked uploads, transform, and merge functionality.

## Features

-   **Chunked Upload**: Files are split into 10MB chunks for reliable large file uploads
-   **Progress Tracking**: Real-time upload progress with pause/resume functionality
-   **Global State**: Upload progress is accessible throughout the app
-   **Chakra UI**: Modern React component library for consistent UI
-   **Prisma + PostgreSQL**: Database integration for file metadata storage

## Tech Stack

-   **Frontend**: Next.js 16, React 19, Chakra UI v3
-   **Backend**: Next.js API Routes
-   **Database**: PostgreSQL with Prisma ORM
-   **Styling**: Tailwind CSS

## Getting Started

1. **Install dependencies**:

    ```bash
    pnpm install
    ```

2. **Set up database**:

    ```bash
    npx prisma generate
    npx prisma db push
    ```

3. **Run development server**:

    ```bash
    pnpm dev
    ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## API Endpoints

-   `POST /api/upload-file/init` - Initialize upload session
-   `POST /api/upload-file/chunk` - Upload individual chunks
-   `POST /api/upload-file/complete` - Complete and merge chunks

## Upload Flow

1. **Initialize**: Create upload session with file metadata
2. **Chunk Upload**: Send file in 10MB chunks sequentially
3. **Transform**: Process chunks on server (validation, etc.)
4. **Merge**: Combine chunks into final file
5. **Complete**: Mark upload as finished

## Key Components

-   `UploadProgressProvider` - Global upload state management
-   `GlobalProgress` - App-wide progress indicator
-   `FileUpload` - Chakra UI file input component
-   File chunking logic in `contexts/upload-progress-context.tsx`
