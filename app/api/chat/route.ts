import { NextRequest } from 'next/server';
import { generateQueryEmbedding } from '@/lib/gemini-embeddings';
import { querySimilarVectors } from '@/lib/pinecone-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Generate embedding for user query
    console.log('Generating embedding for query:', message);
    const queryEmbedding = await generateQueryEmbedding(message);

    // 2. Search Pinecone for relevant context
    console.log('Searching Pinecone for relevant context...');
    const matches = await querySimilarVectors(queryEmbedding, 5);
    console.log(`Found ${matches.length} relevant documents`);

    // 3. Build context from retrieved chunks
    const context = matches
      .map((match, i) => {
        const metadata = match.metadata as { content: string; fileName: string };
        return `[Document ${i + 1}: ${metadata.fileName}]\n${metadata.content}`;
      })
      .join('\n\n---\n\n');

    // 4. Build prompt with context
    const systemPrompt = `คุณเป็น AI assistant ที่ช่วยตอบคำถามโดยใช้ข้อมูลจากเอกสารที่มีให้ 
หากไม่พบข้อมูลที่เกี่ยวข้อง ให้บอกผู้ใช้ว่าไม่พบข้อมูล
ตอบเป็นภาษาไทยหรือภาษาเดียวกับที่ผู้ใช้ถาม
ให้คำตอบที่กระชับและตรงประเด็น`;

    const prompt = context
      ? `${systemPrompt}

## เอกสารอ้างอิง:
${context}

## คำถามของผู้ใช้:
${message}

## คำตอบ:`
      : `${systemPrompt}

ไม่พบเอกสารที่เกี่ยวข้องในฐานข้อมูล กรุณาตอบตามความรู้ทั่วไป และแจ้งให้ผู้ใช้ทราบว่าไม่พบข้อมูลในระบบ

## คำถามของผู้ใช้:
${message}

## คำตอบ:`;

    // 5. Stream response from Gemini (try multiple models)
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try different models in order of preference
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
    let result;
    let lastError;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContentStream(prompt);
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (error: unknown) {
        console.error(`Model ${modelName} failed:`, error);
        lastError = error;
        
        // If it's a rate limit error, continue to next model
        if (error instanceof Error && error.message.includes('429')) {
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    if (!result) {
      // All models failed due to rate limiting
      const errorMessage = 'ขณะนี้ระบบมีการใช้งานสูง กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (API Rate Limit)';
      return new Response(errorMessage, {
        status: 429,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 6. Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('429')) {
      return new Response('ขณะนี้ระบบมีการใช้งานสูง กรุณารอสักครู่แล้วลองใหม่อีกครั้ง', {
        status: 429,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

