import type { DadosApp, Categoria, Tarefa } from './types';

export const categorias: Record<string, Categoria> = {
  FACULDADE: {
    nome: "🎓 FACULDADE",
    emoji: "🎓",
    cor: "bg-blue-500"
  },
  CASA_FAMILIA: {
    nome: "🏡 CASA E FAMÍLIA",
    emoji: "🏡",
    cor: "bg-green-500"
  },
  MEU_FUTURO: {
    nome: "🚀 MEU FUTURO",
    emoji: "🚀",
    cor: "bg-purple-500"
  }
};

export function obterTarefasPadrao(): Tarefa[] {
  const tarefasTexto = {
    FACULDADE: [
      "Assistir UM vídeo de 10 minutos sobre Python",
      "Escrever 5 linhas de código",
      "Abrir o material de UMA matéria e ler os títulos por 5 minutos",
      "Anotar UMA dúvida que eu tenho sobre a faculdade",
    ],
    CASA_FAMILIA: [
      "Lavar a louça de UMA refeição",
      "Tirar o lixo",
      "Brincar com meu filho por 20 minutos (sem celular)",
      "Guardar 5 coisas que estão fora do lugar",
      "Perguntar para minha esposa como foi o dia dela e ouvir",
    ],
    MEU_FUTURO: [
      "Abrir meu arquivo de currículo (só abrir, não precisa editar)",
      "Anotar 3 coisas que eu sou bom em fazer",
      "Procurar no Google por 'vagas de estágio em TI' e ler UMA vaga",
      "Fazer UMA lição no site FreeCodeCamp",
    ]
  };

  const tarefas: Tarefa[] = [];

  for (const [categoria, textos] of Object.entries(tarefasTexto)) {
    for (const [index, texto] of textos.entries()) {
      tarefas.push({
        id: `${categoria}-${index}`,
        texto,
        categoria,
        criadaEm: new Date()
      });
    }
  }

  return tarefas;
}

export function obterDadosIniciais(): DadosApp {
  const tarefas = obterTarefasPadrao();
  const tarefasPorCategoria: Record<string, Tarefa[]> = {};

  // Organizar tarefas por categoria
  for (const cat of Object.keys(categorias)) {
    tarefasPorCategoria[cat] = tarefas.filter(t => t.categoria === cat);
  }

  return {
    tarefas: tarefasPorCategoria,
    tarefasConcluidas: [],
    progresso: {
      streakAtual: 0,
      maiorStreak: 0,
      totalTarefasConcluidas: 0,
      tarefasConcluidasPorCategoria: {},
      ultimaTarefaConcluida: undefined
    },
    categorias
  };
}
