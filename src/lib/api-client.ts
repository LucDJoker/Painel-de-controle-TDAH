// src/lib/api-client.ts
// Cliente de API que funciona tanto em desenvolvimento quanto em produção

// Detectar automaticamente a base da API
// - No navegador: usar caminho relativo (mesma origem) para evitar problemas de hostname e CORS
// - No servidor: usar variável de ambiente pública ou fallback para Vercel
const getApiBaseUrl = () => {
	if (typeof window !== 'undefined') {
		return '';
	}

	return process.env.NEXT_PUBLIC_SITE_URL || 'https://painel-de-controle-tdah-6oo2.vercel.app';
};

export const apiClient = {
  async processarTextoIA(texto: string) {
    const baseUrl = getApiBaseUrl();
    console.log('Usando API em:', baseUrl || 'mesma origem');

    const response = await fetch(`${baseUrl}/api/processar-texto-ia/`, {
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
    console.log('Usando API em:', baseUrl || 'mesma origem');

    const response = await fetch(`${baseUrl}/api/chat-gpt/`, {
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