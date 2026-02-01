import { Pinecone } from '@pinecone-database/pinecone';
import type { EmbeddingVector } from './types';

const API_KEY = process.env.PINECONE_API_KEY!;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'ai-chatbot-embeddings';

// Singleton cache for Pinecone client and index (performance optimization)
let pineconeClient: Pinecone | null = null;
let cachedIndex: ReturnType<Pinecone['index']> | null = null;

/**
 * Initialize Pinecone client (singleton pattern)
 */
export function getPineconeClient() {
  if (pineconeClient) return pineconeClient;

  if (!API_KEY) {
    throw new Error('PINECONE_API_KEY is not configured');
  }

  pineconeClient = new Pinecone({
    apiKey: API_KEY,
  });
  return pineconeClient;
}

/**
 * Get or create Pinecone index (with caching)
 */
export async function getOrCreateIndex() {
  if (cachedIndex) return cachedIndex;

  const pc = getPineconeClient();

  try {
    // Check if index exists
    const indexList = await pc.listIndexes();
    const indexExists = indexList.indexes?.some(index => index.name === INDEX_NAME);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${INDEX_NAME}`);
      
      // Create new index with 768 dimensions (Gemini text-embedding-004)
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: 768,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    cachedIndex = pc.index(INDEX_NAME);
    return cachedIndex;
  } catch (error) {
    console.error('Error getting/creating Pinecone index:', error);
    throw error;
  }
}

/**
 * Upsert vectors to Pinecone
 */
export async function upsertVectors(vectors: EmbeddingVector[]) {
  const index = await getOrCreateIndex();

  try {
    // Prepare records for Pinecone
    const records = vectors.map(vector => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata,
    }));

    // Upsert in batches of 100 (Pinecone limit)
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    console.log(`Successfully upserted ${vectors.length} vectors to Pinecone`);
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw new Error('Failed to store vectors in Pinecone');
  }
}

/**
 * Query similar vectors from Pinecone
 */
export async function querySimilarVectors(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  const index = await getOrCreateIndex();

  try {
    const queryResponse = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter,
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error('Failed to query vectors from Pinecone');
  }
}

/**
 * Delete vectors by file ID
 */
export async function deleteVectorsByFileId(fileId: string) {
  const index = await getOrCreateIndex();

  try {
    await index.deleteMany({
      filter: { fileId: { $eq: fileId } },
    });

    console.log(`Deleted vectors for file: ${fileId}`);
  } catch (error) {
    console.error('Error deleting vectors:', error);
    throw new Error('Failed to delete vectors from Pinecone');
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  const index = await getOrCreateIndex();

  try {
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    throw new Error('Failed to get Pinecone index statistics');
  }
}
