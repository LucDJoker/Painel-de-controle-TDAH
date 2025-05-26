// src/lib/types.ts
'use client';

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
}

export interface Tarefa {
  id: string;
  texto: string;
  categoriaId: string; // ID da Categoria à qual a tarefa pertence
  criadaEm: Date;
  completada?: boolean;
}

export interface TarefaConcluida {
  id: string; // Pode ser o mesmo ID da Tarefa original
  texto: string;
  categoriaId: string; // ID da Categoria
  concluidaEm: Date;
}

export interface ProgressoUsuario {
  streakAtual: number;
  maiorStreak: number;
  totalTarefasConcluidas: number;
  tarefasConcluidasPorCategoria: Record<string, number>; // A chave aqui é categoriaId
  ultimaTarefaConcluida?: Date;
}

export interface DadosApp {
  tarefas: Record<string, Tarefa[]>; // Chave é categoriaId (string), valor é array de Tarefas
  tarefasConcluidas: TarefaConcluida[];
  progresso: ProgressoUsuario;
  categorias: Record<string, Categoria>; // Chave é categoriaId (string), valor é o objeto Categoria
}