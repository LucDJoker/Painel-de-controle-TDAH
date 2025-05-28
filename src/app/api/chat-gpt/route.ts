// src/app/api/chat-gpt/route.ts
// ... (imports e código anterior)

import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("Chave da API da OpenAI não encontrada nas variáveis de ambiente. A API não funcionará.");
  // Não jogue um erro fatal aqui para o build não quebrar se a chave só for usada no runtime.
}

// Inicializa o cliente da OpenAI fora da função handler para reutilização
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Ensure only one export of POST exists in this file.
// (If you have another export or definition of POST elsewhere in this file, remove it.)
// The following is the only export for POST:

export async function POST(request: NextRequest) {
  if (!openai) {
    return NextResponse.json({ error: "Chave da API da OpenAI não configurada corretamente no servidor." }, { status: 500 });
  }

  try {
    const reqBody = await request.json();
    const userMessage: string = reqBody.message;
    // Opcional: você pode querer passar um histórico de chat também
    // const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = reqBody.history || [];

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === "") {
      return NextResponse.json({ error: "A mensagem do usuário é obrigatória." }, { status: 400 });
    }

    // Monta as mensagens para a API do ChatGPT
    // Se tiver histórico, adicione-o antes da mensagem do usuário
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        // ...chatHistory, // Descomente e ajuste se for passar histórico
        { role: "system", content: "Você é um assistente prestativo." }, // Define o comportamento da IA
        { role: "user", content: userMessage },
    ];

    console.log("[API ChatGPT] Enviando para OpenAI:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Ou "gpt-4" se sua chave tiver acesso e você preferir
      messages: messages,
      // temperature: 0.7, // Opcional: controla a criatividade
      // max_tokens: 150, // Opcional: limita o tamanho da resposta
    });

    const assistantReply = completion.choices[0]?.message?.content;
    
    console.log("[API ChatGPT] Resposta da OpenAI:", assistantReply);

    if (!assistantReply) {
      return NextResponse.json({ error: "A IA não retornou uma resposta." }, { status: 500 });
    }

    return NextResponse.json({ reply: assistantReply.trim() }, { status: 200 });

  } catch (error: any) {
    console.error("[API ChatGPT] Erro:", error);
    let errorMessage = "Erro desconhecido ao comunicar com a OpenAI.";
    if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
        errorMessage = error.response.data.error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Erro ao comunicar com a IA.", details: errorMessage }, { status: 500 });
  }
}