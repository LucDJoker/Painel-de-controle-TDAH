export interface Tarefa {
  id: string;
  texto: string;
  categoria: string;
  criadaEm: Date;
}

export interface TarefaConcluida {
  id: string;
  texto: string;
  categoria: string;
  concluidaEm: Date;
}

export interface Categoria {
  nome: string;
  emoji: string;
  cor: string;
}

export interface ProgressoUsuario {
  streakAtual: number;
  maiorStreak: number;
  totalTarefasConcluidas: number;
  tarefasConcluidasPorCategoria: Record<string, number>;
  ultimaTarefaConcluida?: Date;
}

export interface DadosApp {
  tarefas: Record<string, Tarefa[]>;
  tarefasConcluidas: TarefaConcluida[];
  progresso: ProgressoUsuario;
  categorias: Record<string, Categoria>;
}
