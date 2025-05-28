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

// Função para tentar converter dia da semana e hora em uma data ISO
function tryParseDateTime(textFragment: string, today: Date): string | undefined {
    const dayMap: { [key: string]: number } = {
        'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6,
        'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6
    };

    const match = textFragment.match(/\[\s*([^\]\s]+)\s*(\d{1,2}:\d{2})\s*\]/i);
    if (match) {
        const dayStr = match[1].toLowerCase();
        const timeStr = match[2]; // HH:mm
        const [hours, minutes] = timeStr.split(':').map(Number);

        let targetDay = dayMap[dayStr];
        if (targetDay === undefined && dayStr.match(/^\d{1,2}\/\d{1,2}/)) { // Formato DD/MM
            const [dayOfMonth, month] = dayStr.split('/').map(Number);
            if (dayOfMonth && month) {
                const targetDate = new Date(today.getFullYear(), month - 1, dayOfMonth, hours, minutes, 0);
                if (targetDate >= today) {
                    return targetDate.toISOString();
                } else { // Se a data já passou este ano, assume o próximo ano
                    targetDate.setFullYear(today.getFullYear() + 1);
                    return targetDate.toISOString();
                }
            }
        } else if (targetDay === undefined) {
            // Tenta ver se é uma data como "dia 29"
            const dayNumMatch = dayStr.match(/dia\s*(\d+)/i);
            if (dayNumMatch && dayNumMatch[1]) {
                const dayOfMonth = parseInt(dayNumMatch[1], 10);
                let targetDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth, hours, minutes, 0);
                if (targetDate < today) { // Se o dia já passou neste mês, tenta o próximo mês
                    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth, hours, minutes, 0);
                }
                 // Se ainda assim for no passado (ex: dia 29 de um mês que só tem 28, e pulou pro mês seguinte mas ainda é passado)
                 // Poderia adicionar lógica para próximo ano, mas vamos manter simples por ora.
                return targetDate.toISOString();
            }
            return undefined; // Não conseguiu parsear o dia
        }


        let date = new Date(today);
        // Avança até encontrar o dia da semana desejado (na semana atual ou próxima)
        while (date.getDay() !== targetDay || date < today) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() === targetDay && date < today) { // Se encontrou o dia mas é no passado desta semana, pula 7 dias
                date.setDate(date.getDate() + 7);
                break;
            }
             if (date.getDay() === targetDay && date >= today) { // Encontrou o dia correto
                break;
            }
        }
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString();
    }
    return undefined;
}


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
            // temperature: 0.3 // Menor temperatura para respostas mais determinísticas e estruturadas
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

    console.log("[API Rota] Enviando prompt para a IA...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    console.log("[API Rota] Resposta da IA (texto bruto):", textResponse);

    let jsonString = textResponse.trim();
    if (jsonString.startsWith("```json")) { jsonString = jsonString.substring(jsonString.indexOf('[') === -1 ? jsonString.indexOf('{') : jsonString.indexOf('[')); } // Tenta pegar o início do array ou objeto JSON
    if (jsonString.endsWith("```")) { jsonString = jsonString.substring(0, jsonString.lastIndexOf(']') === -1 ? jsonString.lastIndexOf('}') : jsonString.lastIndexOf(']') + 1); }
    jsonString = jsonString.trim();

    try {
      const dadosEstruturados = JSON.parse(jsonString);
      console.log("[API Rota] JSON parseado com sucesso:", dadosEstruturados);
      return NextResponse.json(dadosEstruturados, { status: 200 });
    } catch (e: any) {
      console.error("[API Rota] Erro ao parsear JSON da IA:", e.message);
      console.error("[API Rota] String que causou o erro de parse:", jsonString);
      return NextResponse.json({ error: "A IA retornou um formato que não é JSON válido.", iaResponse: jsonString, parseError: e.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[API Rota] Erro ao chamar a API do Gemini ou outro erro:", error);
    return NextResponse.json({ 
        error: "Erro interno do servidor ao contatar a IA.", 
        details: error.message || "Erro desconhecido",
        apiErrorDetails: error.response?.data || error.cause || {}
    }, { status: 500 });
  }
}