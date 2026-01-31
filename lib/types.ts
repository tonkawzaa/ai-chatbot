// Type definitions for the file processing pipeline

export interface ProcessedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  chunks: TextChunk[];
  processingStatus: ProcessingStatus;
  error?: string;
}

export interface TextChunk {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
  index: number;
  startChar: number;
  endChar: number;
  metadata?: Record<string, any>;
}

export interface EmbeddingVector {
  id: string;
  values: number[]; // 768-dimensional vector from Gemini
  metadata: {
    fileName: string;
    fileId: string;
    chunkIndex: number;
    content: string;
    timestamp: string;
  };
}

export type ProcessingStatus = 
  | 'pending'
  | 'fetching'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'storing'
  | 'completed'
  | 'failed';

export interface ProcessingProgress {
  status: ProcessingStatus;
  filesProcessed: number;
  totalFiles: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  vectorsStored: number;
  currentFile?: string;
  error?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
}
