// src/app/api/chat-gpt/route.ts
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
  console.warn("Chave da API da OpenAI não encontrada. A API não funcionará.");
}

export async function POST(request: NextRequest) {
  if (!openai) {
    return NextResponse.json({ error: "Chave da API da OpenAI não configurada corretamente no servidor." }, { status: 500 });
  }

  try {
    const reqBody = await request.json();
    const userMessage: string = reqBody.message;
    const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = reqBody.history || [];

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === "") {
      return NextResponse.json({ error: "A mensagem do usuário é obrigatória." }, { status: 400 });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        ...chatHistory,
        { role: "system", content: "Você é um assistente prestativo." },
        { role: "user", content: userMessage },
    ];

    console.log("[API ChatGPT] Enviando para OpenAI:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const assistantReply = completion.choices[0]?.message?.content;
    
    console.log("[API ChatGPT] Resposta da OpenAI:", assistantReply);

    if (!assistantReply) {
      return NextResponse.json({ error: "A IA não retornou uma resposta." }, { status: 500 });
    }

    return NextResponse.json({ reply: assistantReply.trim() }, { status: 200 });

  } catch (error: unknown) { 
    console.error("[API ChatGPT] Erro:", error);
    let errorMessage = "Erro desconhecido ao comunicar com a OpenAI.";
    let errorDetails: Record<string, unknown> = {}; 

    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Tentativa de extrair mais detalhes do erro da API da OpenAI
    if (error && typeof error === 'object') {
        const errAsAny = error as any; // Usar 'as any' com cautela para inspeção
        if (errAsAny.response && errAsAny.response.data && errAsAny.response.data.error && errAsAny.response.data.error.message) {
            errorMessage = errAsAny.response.data.error.message;
            errorDetails = errAsAny.response.data.error;
        } else if (errAsAny.response && errAsAny.response.data) {
            errorDetails = errAsAny.response.data;
        } else if ('cause' in errAsAny) {
            errorDetails = errAsAny.cause as Record<string, unknown>;
        }
    }

    return NextResponse.json({ error: "Erro ao comunicar com a IA.", details: errorMessage, apiErrorDetails: errorDetails }, { status: 500 });
  }
}