import mammoth from 'mammoth';
import type { TextChunk } from './types';

/**
 * Extract text from various file formats
 */
export async function extractTextFromFile(
  content: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    // Handle different file types
    if (mimeType === 'application/pdf') {
      // Dynamic import for pdf-parse v1 - use lib/pdf-parse.js directly to avoid test file loading issue
      // See: https://github.com/modesty/pdf-parse/issues/24
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(content);
      return data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: content });
      return result.value;
    } else if (mimeType.startsWith('text/') || fileName.endsWith('.txt')) {
      return content.toString('utf-8');
    } else if (mimeType === 'application/json') {
      return content.toString('utf-8');
    } else {
      // Try to decode as text for other formats
      return content.toString('utf-8');
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from ${fileName}`);
  }
}

/**
 * Chunk text into smaller segments for embedding
 * Uses a combination of paragraph and character-based chunking
 */
export function chunkText(
  text: string,
  fileId: string,
  fileName: string,
  maxChunkSize: number = 1000,
  overlapSize: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  // Clean and normalize text
  const cleanedText = text
    .replaceAll(/\r\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanedText.length === 0) {
    return [];
  }

  // Split by paragraphs first
  const paragraphs = cleanedText.split(/\n\n+/);
  
  let currentChunk = '';
  let chunkStartChar = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) continue;

    // If adding this paragraph would exceed max size, save current chunk
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${fileId}-chunk-${chunkIndex}`,
        fileId,
        fileName,
        content: currentChunk.trim(),
        index: chunkIndex,
        startChar: chunkStartChar,
        endChar: chunkStartChar + currentChunk.length,
      });

      // Start new chunk with overlap
      chunkStartChar = chunkStartChar + currentChunk.length - overlapSize;
      currentChunk = currentChunk.slice(-overlapSize) + '\n\n' + trimmedParagraph;
      chunkIndex++;
    } else {
      // Add paragraph to current chunk
      currentChunk = currentChunk
        ? currentChunk + '\n\n' + trimmedParagraph
        : trimmedParagraph;
    }
  }

  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${fileId}-chunk-${chunkIndex}`,
      fileId,
      fileName,
      content: currentChunk.trim(),
      index: chunkIndex,
      startChar: chunkStartChar,
      endChar: chunkStartChar + currentChunk.length,
    });
  }

  return chunks;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
