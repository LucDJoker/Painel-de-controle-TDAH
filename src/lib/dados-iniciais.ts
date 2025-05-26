// src/lib/dados-iniciais.ts
import type { DadosApp } from './types';

export function obterDadosIniciais(): DadosApp {
  return {
    categorias: {}, // Começa sem nenhuma categoria
    tarefas: {},    // Começa sem nenhuma tarefa
    tarefasConcluidas: [],
    progresso: {
      streakAtual: 0,
      maiorStreak: 0,
      totalTarefasConcluidas: 0,
      tarefasConcluidasPorCategoria: {},
      ultimaTarefaConcluida: undefined,
    },
  };
}