// src/app/api/processar-texto-ia/route.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Função utilitária para adicionar cabeçalhos CORS
function withCors(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    const errorMessage = "Nenhuma chave de API configurada (Gemini ou OpenAI).";
    console.error(`[API Rota ERRO CRÍTICO] ${errorMessage}`);
    return withCors(NextResponse.json({ error: errorMessage, details: "Configure pelo menos uma chave de API (Gemini ou OpenAI)." }, { status: 500 }));
  }

  try {
    const reqBody = await request.json();
    const textoParaProcessar: string = reqBody.texto;
    const hojeISO = new Date().toISOString();

    if (!textoParaProcessar || typeof textoParaProcessar !== 'string' || textoParaProcessar.trim() === "") {
      return withCors(NextResponse.json({ error: "Texto para processar é obrigatório e não pode ser vazio." }, { status: 400 }));
    }

    const prompt = `
      Você é um assistente especialista em organizar textos em planos de ação estruturados em JSON. A data de referência para cálculo de dias da semana é ${hojeISO}.
      Analise o seguinte texto. Seu objetivo é extrair:
      1. Categorias principais (linhas que explicitamente começam com "Categoria:", "Cat:", ou que são claramente títulos de seções maiores).
      2. Tarefas principais dentro de cada categoria (linhas que explicitamente começam com "Tarefa:", "Task:", ou itens principais abaixo de uma categoria).
      3. Sub-tarefas para cada tarefa principal (linhas que iniciam com um hífen "-", um asterisco "*", ou "Sub-tarefa:").
      4. Data e Hora de início da tarefa, se especificado no texto da tarefa, geralmente entre colchetes, como "[QUARTA 08:30]", "[DIA 15 14:00]" ou "[15/07 10:00]".

      O texto da tarefa principal deve ser limpo, sem a informação de data/hora se esta for extraída.

      Retorne os dados EXCLUSIVAMENTE em formato JSON. O JSON deve ser um array de objetos de categoria.
      Cada objeto de categoria deve ter:
      - "nomeCategoria": string (o nome da categoria identificada)
      - "tarefas": array de objetos de tarefa, onde cada objeto tem:
          - "textoTarefa": string (o texto limpo da tarefa principal)
          - "dataHora": string (a data e hora de início no formato ISO 8601 "YYYY-MM-DDTHH:mm:ss.sssZ", opcional, somente se encontrado e puder ser convertido para uma data válida)
          - "subTarefas": array de strings (os textos das sub-tarefas; se não houver, um array vazio [])
      
      Se não houver categorias explícitas, mas houver uma lista de tarefas, coloque todas sob uma categoria "Geral".
      Se uma tarefa não tiver data/hora explícita ou se a data/hora não puder ser interpretada como uma data futura ou válida baseada em ${hojeISO}, omita o campo "dataHora" para essa tarefa ou deixe-o como null.
      Certifique-se de que a saída seja um JSON válido e nada mais. Não inclua nenhuma explicação ou texto adicional antes ou depois do JSON. Não coloque o JSON dentro de blocos de markdown como \`\`\`json ... \`\`\`.

      Exemplo de JSON de Saída Esperado:
      [{"nomeCategoria": "Estudos", "tarefas": [{"textoTarefa": "Aprender React", "dataHora": "2025-05-28T09:00:00.000Z", "subTarefas": ["Ler docs"]}, {"textoTarefa": "Projeto Final", "dataHora": "2025-06-15T14:00:00.000Z", "subTarefas": ["Definir escopo"]}]}]

      Texto para análise:
      ---
      ${textoParaProcessar}
      ---
    `;

    let textResponse = "";
    let apiUsed = "";

    // Tentar Gemini primeiro
    if (GEMINI_API_KEY) {
      try {
        console.log("[API Rota IA] Tentando Gemini...");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            safetySettings,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0]) {
          textResponse = response.candidates[0].content.parts[0].text || "";
          apiUsed = "Gemini";
          console.log("[API Rota IA] Gemini funcionou!");
        }
      } catch (geminiError) {
        console.warn("[API Rota IA] Gemini falhou, tentando OpenAI...", geminiError);
      }
    }

    // Se Gemini falhou ou não está configurado, tentar OpenAI
    if (!textResponse && OPENAI_API_KEY) {
      try {
        console.log("[API Rota IA] Tentando OpenAI...");
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Você é um assistente especialista em organizar textos em planos de ação estruturados em JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });

        textResponse = completion.choices[0]?.message?.content || "";
        apiUsed = "OpenAI";
        console.log("[API Rota IA] OpenAI funcionou!");
      } catch (openaiError) {
        console.error("[API Rota IA] OpenAI também falhou:", openaiError);
        throw openaiError;
      }
    }

    if (!textResponse) {
      return withCors(NextResponse.json({ error: "Ambas as APIs falharam. Tente novamente mais tarde." }, { status: 500 }));
    }

    console.log(`[API Rota IA] Resposta da ${apiUsed} (texto bruto inicial):`, textResponse);

    let jsonString = textResponse.trim();
    if (jsonString.startsWith("```json")) { jsonString = jsonString.substring(jsonString.indexOf('[') === -1 ? jsonString.indexOf('{') : jsonString.indexOf('[')); }
    if (jsonString.endsWith("```")) { jsonString = jsonString.substring(0, jsonString.lastIndexOf(']') === -1 ? jsonString.lastIndexOf('}') : jsonString.lastIndexOf(']') + 1); }
    jsonString = jsonString.trim();
    
    console.log(`[API Rota IA] String JSON após tentativa de limpeza (${apiUsed}):`, jsonString);

    try {
      const dadosEstruturados = JSON.parse(jsonString);
      console.log(`[API Rota IA] JSON parseado com sucesso (${apiUsed}):`, dadosEstruturados);
      return withCors(NextResponse.json({ ...dadosEstruturados, apiUsed }, { status: 200 }));
    } catch (parseError: unknown) { 
      const errorMessage = parseError instanceof Error ? parseError.message : "Erro de parse desconhecido";
      console.error(`[API Rota IA] Erro ao parsear JSON da ${apiUsed}:`, errorMessage);
      console.error(`[API Rota IA] String que causou o erro de parse (após limpeza final):`, jsonString);
      return withCors(NextResponse.json({ error: `A ${apiUsed} retornou um formato que não é JSON válido após limpeza.`, iaResponse: textResponse, cleanedIaResponse: jsonString, parseError: errorMessage }, { status: 500 }));
    }

  } catch (error: unknown) { 
    console.error("[API Rota IA] Erro ao chamar as APIs ou outro erro:", error);
    let errorMessage = "Erro desconhecido ao processar o texto com IA.";
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    if (error && typeof error === 'object') {
        const errAsObject = error as { response?: { data?: unknown }, cause?: unknown, message?: string };
        if (errAsObject.message && typeof errAsObject.message === 'string' && errAsObject.message.includes("API key")) { 
            errorMessage = "Erro de autenticação com as APIs. Verifique suas chaves de API.";
        }
        if (errAsObject.response && typeof errAsObject.response === 'object' && errAsObject.response.data) {
            errorDetails = errAsObject.response.data as Record<string, unknown>;
        } else if (errAsObject.cause) {
            errorDetails = errAsObject.cause as Record<string, unknown>;
        }
    }

    return withCors(NextResponse.json({ 
        error: "Erro interno do servidor ao contatar as IAs.", 
        details: errorMessage,
        apiErrorDetails: errorDetails 
    }, { status: 500 }));
  }
}