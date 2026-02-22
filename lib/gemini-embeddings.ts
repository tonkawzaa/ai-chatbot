import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { LRUCache } from 'lru-cache';
import type { TextChunk } from './types';

const API_KEY = process.env.GOOGLE_AI_API_KEY!;
// gemini-embedding-001 is the available embedding model for this API key
const EMBEDDING_MODELS = ['gemini-embedding-001'];

// LRU cache for embeddings - avoids regenerating for identical text (cross-request caching)
const embeddingCache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 60 * 60 * 1000, // 1 hour
});

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
  // Check cache first (use first 1000 chars as key for memory efficiency)
  const cacheKey = text.slice(0, 1000);
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    console.log('Embedding cache hit');
    return cached;
  }

  const genAI = getGeminiClient();
  let lastError: unknown;

  for (const modelName of EMBEDDING_MODELS) {
    try {
      console.log(`Trying embedding model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Pass content as structured object with taskType to avoid 404 on some API keys
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      });
      const embedding = result.embedding;

      if (!embedding.values || embedding.values.length === 0) {
        throw new Error(`Empty embedding returned from ${modelName}`);
      }

      console.log(`Embedding generated with ${modelName} (${embedding.values.length} dims)`);
      embeddingCache.set(cacheKey, embedding.values);
      return embedding.values;
    } catch (error) {
      console.error(`Embedding model ${modelName} failed:`, error);
      lastError = error;
      // Continue to next model
    }
  }

  throw new Error(`Failed to generate embedding with all models: ${lastError}`);
}

/**
 * Generate embedding for a query (uses RETRIEVAL_QUERY taskType for better retrieval accuracy)
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const cacheKey = `query:${text.slice(0, 1000)}`;
  const cached = embeddingCache.get(cacheKey);
  if (cached) return cached;

  const genAI = getGeminiClient();
  let lastError: unknown;

  for (const modelName of EMBEDDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_QUERY,
      });
      const embedding = result.embedding;
      if (!embedding.values || embedding.values.length === 0) {
        throw new Error(`Empty embedding returned from ${modelName}`);
      }
      embeddingCache.set(cacheKey, embedding.values);
      return embedding.values;
    } catch (error) {
      console.error(`Query embedding model ${modelName} failed:`, error);
      lastError = error;
    }
  }

  throw new Error(`Failed to generate query embedding: ${lastError}`);
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
