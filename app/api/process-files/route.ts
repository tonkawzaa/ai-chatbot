import { NextResponse } from 'next/server';
import { listFilesInFolder, downloadFileContent, exportGoogleDocAsText } from '@/lib/google-drive';
import { extractTextFromFile, chunkText } from '@/lib/text-processor';
import { generateEmbeddings } from '@/lib/gemini-embeddings';
import { upsertVectors } from '@/lib/pinecone-client';
import type { ProcessingProgress, EmbeddingVector } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const folderId = body.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json(
        { error: 'Google Drive folder ID is required' },
        { status: 400 }
      );
    }

    const progress: ProcessingProgress = {
      status: 'fetching',
      filesProcessed: 0,
      totalFiles: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      vectorsStored: 0,
    };

    // Step 1: Fetch files from Google Drive
    console.log('Fetching files from Google Drive...');
    const files = await listFilesInFolder(folderId);
    progress.totalFiles = files.length;

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files found in the folder',
        progress,
      });
    }

    const allVectors: EmbeddingVector[] = [];

    // Step 2: Process each file
    for (const file of files) {
      try {
        progress.currentFile = file.name;
        progress.status = 'extracting';

        console.log(`Processing file: ${file.name}`);

        // Download file content
        let textContent: string;

        // Check if it's a Google Workspace file
        if (
          file.mimeType.includes('google-apps.document') ||
          file.mimeType.includes('google-apps.spreadsheet') ||
          file.mimeType.includes('google-apps.presentation')
        ) {
          textContent = await exportGoogleDocAsText(file.id, file.mimeType);
        } else {
          const fileContent = await downloadFileContent(file.id);
          textContent = await extractTextFromFile(
            fileContent as Buffer,
            file.mimeType,
            file.name
          );
        }

        if (!textContent || textContent.trim().length === 0) {
          console.log(`Skipping ${file.name}: No text content`);
          progress.filesProcessed++;
          continue;
        }

        // Step 3: Chunk the text
        progress.status = 'chunking';
        const chunks = chunkText(textContent, file.id, file.name);
        progress.chunksCreated += chunks.length;

        console.log(`Created ${chunks.length} chunks from ${file.name}`);

        if (chunks.length === 0) {
          progress.filesProcessed++;
          continue;
        }

        // Step 4: Generate embeddings
        progress.status = 'embedding';
        const embeddings = await generateEmbeddings(chunks, (processed, total) => {
          console.log(`Generating embeddings: ${processed}/${total} for ${file.name}`);
        });

        progress.embeddingsGenerated += embeddings.size;

        // Step 5: Prepare vectors for Pinecone
        const vectors: EmbeddingVector[] = chunks.map((chunk) => {
          const embedding = embeddings.get(chunk.id)!;
          return {
            id: chunk.id,
            values: embedding,
            metadata: {
              fileName: file.name,
              fileId: file.id,
              chunkIndex: chunk.index,
              content: chunk.content.substring(0, 1000), // Limit content in metadata
              timestamp: new Date().toISOString(),
            },
          };
        });

        allVectors.push(...vectors);
        progress.filesProcessed++;

        console.log(`Completed processing ${file.name}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
        progress.filesProcessed++;
      }
    }

    // Step 6: Store all vectors in Pinecone
    if (allVectors.length > 0) {
      progress.status = 'storing';
      console.log(`Storing ${allVectors.length} vectors in Pinecone...`);
      await upsertVectors(allVectors);
      progress.vectorsStored = allVectors.length;
    }

    // Complete
    progress.status = 'completed';

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${progress.filesProcessed} files`,
      progress,
    });
  } catch (error) {
    console.error('Error in file processing pipeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
