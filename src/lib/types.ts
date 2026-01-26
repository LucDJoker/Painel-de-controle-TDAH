// src/lib/types.ts
'use client';

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
}

// NOVO: Interface para SubTarefa
export interface SubTarefa {
  id: string;
  texto: string;
  completada: boolean;
}

export interface Tarefa {
  id: string;
  texto: string;
  categoriaId: string;
  criadaEm: Date;
  completada?: boolean;
  alarme?: string | Date;
  subTarefas?: SubTarefa[]; // ADICIONADO: Array opcional de sub-tarefas
}

export interface TarefaConcluida {
  id: string;
  texto: string;
  categoriaId: string;
  concluidaEm: Date;
  alarme?: string | Date;
  subTarefas?: SubTarefa[]; // Adicionado aqui também para consistência no histórico
}

export interface ProgressoUsuario {
  streakAtual: number;
  maiorStreak: number;
  totalTarefasConcluidas: number;
  tarefasConcluidasPorCategoria: Record<string, number>;
  ultimaTarefaConcluida?: Date | string;
  totalPomodorosFocoCompletos?: number;
  totalSubTarefasConcluidas?: number;
}

export interface ConfigPomodoro {
  duracaoFocoMin: number;
  duracaoPausaCurtaMin: number;
  duracaoPausaLongaMin: number;
  ciclosAtePausaLonga: number;
}

export interface DadosApp {
  tarefas: Record<string, Tarefa[]>;
  tarefasConcluidas: TarefaConcluida[];
  progresso: ProgressoUsuario;
  categorias: Record<string, Categoria>;
  configPomodoro: ConfigPomodoro;
}

// Tipos de Finanças
export interface Transacao {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string; // ISO
  fixo?: boolean;
}

export interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string; // ISO
  anotacoes?: string;
  fixo?: boolean;
}

export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string; // ISO
  anotacoes?: string;
}

export interface CategoriaGasto {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
  tipo: 'gasto' | 'receita'; // Tipo de categoria
}

export interface FinancasApp {
  transacoes: Transacao[];
  gastos?: Gasto[];
  receitas?: Receita[];
  categoriasGastos?: CategoriaGasto[];
}

// Extensão dos dados da aplicação para incluir finanças
export interface DadosAppComFinancas extends DadosApp {
  financas?: FinancasApp;
}