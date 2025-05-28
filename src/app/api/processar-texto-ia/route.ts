// src/app/api/processar-texto-ia/route.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    const errorMessage = "Chave da API do Gemini não configurada no servidor.";
    console.error(`[API Rota ERRO] ${errorMessage}`);
    return NextResponse.json({ error: errorMessage, details: "Verifique as variáveis de ambiente." }, { status: 500 });
  }

  try {
    const reqBody = await request.json();
    const textoParaProcessar: string = reqBody.texto;
    const hojeISO = new Date().toISOString();

    if (!textoParaProcessar || typeof textoParaProcessar !== 'string' || textoParaProcessar.trim() === "") {
      return NextResponse.json({ error: "Texto para processar é obrigatório e não pode ser vazio." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        safetySettings,
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

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
          - "dataHora": string (a data e hora de início no formato ISO 8601 "YYYY-MM-DDTHH:mm:ss", opcional, somente se encontrado)
          - "subTarefas": array de strings (os textos das sub-tarefas; se não houver, um array vazio [])
      
      Se não houver categorias explícitas, mas houver uma lista de tarefas, coloque todas sob uma categoria "Geral".
      Se uma tarefa não tiver data/hora explícita, não inclua o campo "dataHora" para essa tarefa.
      Certifique-se de que a saída seja um JSON válido e nada mais. Não inclua nenhuma explicação ou texto adicional antes ou depois do JSON.

      Exemplo de Texto de Entrada:
      Categoria: Estudos
      Tarefa: [QUARTA 09:00] Aprender React
      - Ler docs
      Tarefa: Projeto Final [dia 15 14:00]
      Sub-tarefa: Definir escopo

      Exemplo de JSON de Saída Esperado (assumindo que hoje é 2025-05-27 e a próxima quarta é 2025-05-28, e dia 15 é 2025-06-15):
      [
        {
          "nomeCategoria": "Estudos",
          "tarefas": [
            {
              "textoTarefa": "Aprender React",
              "dataHora": "2025-05-28T09:00:00.000Z", 
              "subTarefas": ["Ler docs"]
            },
            {
              "textoTarefa": "Projeto Final",
              "dataHora": "2025-06-15T14:00:00.000Z",
              "subTarefas": ["Definir escopo"]
            }
          ]
        }
      ]

      Texto para análise:
      ---
      ${textoParaProcessar}
      ---
    `;

    console.log("[API Rota IA] Enviando prompt para a IA...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    console.log("[API Rota IA] Resposta da IA (texto bruto):", textResponse);

    let jsonString = textResponse.trim();
    if (jsonString.startsWith("```json")) { jsonString = jsonString.substring(jsonString.indexOf('[') === -1 ? jsonString.indexOf('{') : jsonString.indexOf('[')); }
    if (jsonString.endsWith("```")) { jsonString = jsonString.substring(0, jsonString.lastIndexOf(']') === -1 ? jsonString.lastIndexOf('}') : jsonString.lastIndexOf(']') + 1); }
    jsonString = jsonString.trim();

    try {
      const dadosEstruturados = JSON.parse(jsonString);
      console.log("[API Rota IA] JSON parseado com sucesso:", dadosEstruturados);
      return NextResponse.json(dadosEstruturados, { status: 200 });
    } catch (parseError: unknown) { 
      const errorMessage = parseError instanceof Error ? parseError.message : "Erro de parse desconhecido";
      console.error("[API Rota IA] Erro ao parsear JSON da IA:", errorMessage);
      console.error("[API Rota IA] String que causou o erro de parse:", jsonString);
      return NextResponse.json({ error: "A IA retornou um formato que não é JSON válido.", iaResponse: jsonString, parseError: errorMessage }, { status: 500 });
    }

  } catch (error: unknown) { 
    console.error("[API Rota IA] Erro ao chamar a API do Gemini ou outro erro:", error);
    let errorMessage = "Erro desconhecido ao processar o texto com IA.";
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    if (error && typeof error === 'object') {
        const errAsObject = error as { response?: { data?: unknown }, cause?: unknown }; // Tipagem mais genérica para 'data' e 'cause'
        if (errAsObject.response && typeof errAsObject.response === 'object' && errAsObject.response.data) {
            errorDetails = errAsObject.response.data as Record<string, unknown>;
        } else if (errAsObject.cause) {
            errorDetails = errAsObject.cause as Record<string, unknown>;
        }
    }

    return NextResponse.json({ 
        error: "Erro interno do servidor ao contatar a IA.", 
        details: errorMessage,
        apiErrorDetails: errorDetails 
    }, { status: 500 });
  }
}