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
    const fallbackParse = () => {
      // Fallback local: processa texto com estrutura hierárquica e datas
      const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      const categorias: any[] = [];
      let categoriaAtual: any = null;
      let tarefaAtual: any = null;
      let semanaAtual = 1;

      // Função para calcular data da semana
      const calcularDataSemana = (numeroSemana: number) => {
        const hoje = new Date();
        const diasParaSemana = (numeroSemana - 1) * 7;
        const dataSemana = new Date(hoje.getTime() + (diasParaSemana * 24 * 60 * 60 * 1000));
        dataSemana.setHours(9, 0, 0, 0); // 9h da manhã
        return dataSemana.toISOString();
      };

      for (const linha of linhas) {
        if (linha.toLowerCase().startsWith('categoria:')) {
          // Nova categoria
          if (categoriaAtual) categorias.push(categoriaAtual);
          categoriaAtual = {
            nomeCategoria: linha.replace(/^categoria:\s*/i, '').trim(),
            tarefas: []
          };
          tarefaAtual = null;
          semanaAtual = 1; // Reset semana para nova categoria
        } else if (linha.toLowerCase().startsWith('tarefa:')) {
          // Nova tarefa - extrair número da semana
          if (!categoriaAtual) {
            categoriaAtual = { nomeCategoria: 'Caixa de Entrada', tarefas: [] };
          }
          
          const textoTarefa = linha.replace(/^tarefa:\s*/i, '').trim();
          
          // Procurar padrão [SEMANA X] no texto
          const matchSemana = textoTarefa.match(/\[SEMANA\s+(\d+)\]/i);
          if (matchSemana) {
            semanaAtual = parseInt(matchSemana[1]);
          }
          
          tarefaAtual = {
            textoTarefa: textoTarefa,
            dataHora: calcularDataSemana(semanaAtual),
            subTarefas: []
          };
          categoriaAtual.tarefas.push(tarefaAtual);
        } else if (linha.toLowerCase().startsWith('sub-tarefa:') || linha.startsWith('-') || linha.startsWith('*')) {
          // Sub-tarefa
          if (tarefaAtual) {
            const subTexto = linha.replace(/^(sub-tarefa:|[-*])\s*/i, '').trim();
            if (subTexto) {
              tarefaAtual.subTarefas.push(subTexto);
            }
          }
        } else if (linha.toLowerCase().startsWith('objetivo:')) {
          // Ignora objetivos por enquanto
          continue;
        } else if (linha.length > 10) {
          // Linha genérica vira tarefa
          if (!categoriaAtual) {
            categoriaAtual = { nomeCategoria: 'Caixa de Entrada', tarefas: [] };
          }
          tarefaAtual = {
            textoTarefa: linha,
            dataHora: calcularDataSemana(semanaAtual),
            subTarefas: []
          };
          categoriaAtual.tarefas.push(tarefaAtual);
        }
      }

      if (categoriaAtual) categorias.push(categoriaAtual);
      
      // Se não encontrou nenhuma categoria, cria uma padrão
      if (categorias.length === 0) {
        const tarefas = linhas.map(l => ({ textoTarefa: l, dataHora: calcularDataSemana(1), subTarefas: [] }));
        categorias.push({ nomeCategoria: 'Caixa de Entrada', tarefas });
      }

      return categorias;
    };

    try {
      const response = await fetch(`${baseUrl}/api/processar-texto-ia/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });

      const status = response.status;
      const rawText = await response.text();
      console.log('STATUS DA RESPOSTA:', status);
      console.log('RESPOSTA BRUTA DA API:', rawText);

      if (!response.ok) {
        console.warn('API IA respondeu com erro, usando fallback local');
        return fallbackParse();
      }

      try {
        const parsed = JSON.parse(rawText);
        return parsed.categorias || parsed;
      } catch (e) {
        console.warn('Resposta nao eh JSON valido, usando fallback local');
        return fallbackParse();
      }
    } catch (err) {
      console.warn('Erro chamando API IA, usando fallback local', err);
      return fallbackParse();
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