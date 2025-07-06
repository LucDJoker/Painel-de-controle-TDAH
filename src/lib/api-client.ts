// src/lib/api-client.ts
// Cliente de API que funciona tanto em desenvolvimento quanto em produção

// Forçar o uso da URL da Vercel em todas as requisições
const getApiBaseUrl = () => {
  return 'https://SEU-PROJETO.vercel.app'; // Substitua pela sua URL real da Vercel
};

export const apiClient = {
  async processarTextoIA(texto: string) {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/processar-texto-ia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });

    const status = response.status;
    const rawText = await response.text();
    console.log('STATUS DA RESPOSTA:', status);
    console.log('RESPOSTA BRUTA DA API:', rawText);

    try {
      return JSON.parse(rawText);
    } catch (e) {
      throw new Error('Resposta não é JSON: ' + rawText);
    }
  },

  async chatGPT(message: string, history: unknown[] = []) {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/chat-gpt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    return response.json();
  }
}; 