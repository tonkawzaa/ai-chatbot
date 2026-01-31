---
description: How to run and develop the AI Chatbot application
---

# Running the AI Chatbot

This document provides instructions for running and developing the AI Chatbot application.

## Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

Create an optimized production build:

```bash
npm run build
```

## Running Production Build

After building, start the production server:

```bash
npm start
```

## Linting

Run ESLint to check for code quality issues:

```bash
npm run lint
```

## Common Tasks

### Changing the UI Theme

The application uses a dark theme by default. To customize colors, edit the CSS variables in `app/globals.css`:

```css
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

### Modifying the Sidebar

The sidebar component is in `app/page.tsx`. Key sections:

- **Hamburger Menu**: Top icon for navigation
- **Branding**: "Gemini" text
- **New Chat Icon**: Bottom plus icon

### Updating Quick Actions

Quick action chips are defined in the `actions` array in `app/page.tsx`. Each action has:

```tsx
{ icon: "emoji", label: "Action name" }
```

## Troubleshooting

### Hydration Errors

If you see hydration warnings, they're often caused by browser extensions. The app includes `suppressHydrationWarning` on the `<html>` tag to suppress these.

### Port Already in Use

If port 3000 is busy, Next.js will prompt you to use a different port, or you can specify one:

```bash
PORT=3001 npm run dev
```

### Build Errors

If you encounter Tailwind CSS errors:

1. Ensure you're using Tailwind v4 syntax
2. Avoid using `@apply` with custom classes
3. Use inline utility classes instead

## Development Tips

- **Auto-reload**: The dev server automatically refreshes when you edit files
- **TypeScript**: Type-check files before committing
- **Git**: Use conventional commits for better history

## Google Drive Integration

The project includes a pipeline to ingest files from Google Drive, generate embeddings with Gemini, and store them in Pinecone.

### Setup

1.  **Environment Variables**: Ensure `.env.local` has the following:
    ```env
    GOOGLE_DRIVE_FOLDER_ID=...
    GOOGLE_SERVICE_ACCOUNT_KEY=...
    GOOGLE_AI_API_KEY=...
    PINECONE_API_KEY=...
    PINECONE_INDEX_NAME=...
    ```
2.  **Service Account**: The Google Service Account must have "Viewer" access to the specified Drive folder.
3.  **API Enablement**: The "Google Drive API" must be enabled in the Google Cloud Console project.

### Usage

The feature is implemented in `app/api/process-files/route.ts`.

To trigger processing, you can send a POST request to `/api/process-files`.
(Note: The UI button for this was removed per user request, but the API remains functional).

### PDF Parsing

The project uses `pdf-parse@1.1.1` for extracting text from PDF files. Important notes:

- **Import Path**: Use `pdf-parse/lib/pdf-parse.js` directly instead of `pdf-parse` to avoid a known issue where the library tries to load a non-existent test file.
- **Why v1.1.1**: Version 2.x uses `pdfjs-dist` which requires worker files that don't work well in Next.js server-side environments.
- **Type Declarations**: Custom type declarations are in `types/pdf-parse.d.ts`.

Example usage:

```typescript
const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
const data = await pdfParse(pdfBuffer);
console.log(data.text);
```
