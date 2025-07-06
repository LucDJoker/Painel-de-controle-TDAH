// src/app/api/test-env/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    geminiConfigured: !!geminiKey,
    openaiConfigured: !!openaiKey,
    geminiLength: geminiKey ? geminiKey.length : 0,
    openaiLength: openaiKey ? openaiKey.length : 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  });
} 