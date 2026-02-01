"use client";

import { useState } from 'react';
import type { ProcessingProgress } from '@/lib/types';

interface FileProcessingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function FileProcessingModal({ isOpen, onClose }: FileProcessingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startProcessing = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({
      status: 'pending',
      filesProcessed: 0,
      totalFiles: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      vectorsStored: 0,
    });

    try {
      const response = await fetch('/api/process-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process files');
      }

      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setProgress(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">📄 Process Files</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {!progress && !error && (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">
                Click the button below to start processing files from Google Drive.
              </p>
              <button
                onClick={startProcessing}
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Start Processing
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Processing files...</p>
              {progress?.currentFile ? (
                <p className="text-sm text-gray-500 mt-2">Current: {progress.currentFile}</p>
              ) : null}
            </div>
          )}

          {progress && progress.status === 'completed' && (
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-center text-green-500 mb-3">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-center text-white font-semibold mb-4">Processing Complete!</p>
              
              <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Files Processed:</span>
                  <span className="text-white font-semibold">{progress.filesProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chunks Created:</span>
                  <span className="text-white font-semibold">{progress.chunksCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Embeddings Generated:</span>
                  <span className="text-white font-semibold">{progress.embeddingsGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vectors Stored:</span>
                  <span className="text-white font-semibold">{progress.vectorsStored}</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {error && (
            <div className="py-4">
              <div className="flex items-center justify-center text-red-500 mb-3">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-center text-white font-semibold mb-2">Error</p>
              <p className="text-center text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
