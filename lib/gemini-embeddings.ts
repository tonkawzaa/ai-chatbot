import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TextChunk } from './types';

const API_KEY = process.env.GOOGLE_AI_API_KEY!;
const MODEL_NAME = 'text-embedding-004';

/**
 * Initialize Gemini AI client
 */
export function getGeminiClient() {
  if (!API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(API_KEY);
}

/**
 * Generate embedding for a single text chunk using Gemini
 * Returns a 768-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  try {
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    
    if (!embedding.values || embedding.values.length !== 768) {
      throw new Error(`Expected 768-dimensional vector, got ${embedding.values?.length ?? 0}`);
    }

    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 * Processes chunks sequentially to avoid rate limits
 */
export async function generateEmbeddings(
  chunks: TextChunk[],
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await generateEmbedding(chunk.content);
      embeddings.set(chunk.id, embedding);
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, chunks.length);
      }
      
      // Add small delay to avoid rate limiting (adjust based on your quota)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * Generate embeddings with retry logic
 */
export async function generateEmbeddingWithRetry(
  text: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<number[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Failed to generate embedding after retries');
}
