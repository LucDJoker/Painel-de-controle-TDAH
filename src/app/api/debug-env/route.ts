// src/app/api/debug-env/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envVars = {
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  console.log('[DEBUG ENV] Variáveis de ambiente:', envVars);

  return NextResponse.json({
    message: 'Debug das variáveis de ambiente',
    envVars,
    timestamp: new Date().toISOString()
  });
} 