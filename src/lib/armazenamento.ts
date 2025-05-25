import type { DadosApp, TarefaConcluida, ProgressoUsuario } from './types';
import { obterDadosIniciais } from './dados-iniciais';

const CHAVE_STORAGE = 'painel-controle-dados';

// Verificar se a última tarefa foi concluída hoje
function foiConcluidaHoje(data: Date): boolean {
  const hoje = new Date();
  const dataComparacao = new Date(data);

  return hoje.toDateString() === dataComparacao.toDateString();
}

// Calcular streak atual
function calcularStreakAtual(tarefasConcluidas: TarefaConcluida[]): number {
  if (tarefasConcluidas.length === 0) return 0;

  // Ordenar por data mais recente
  const ordenadas = [...tarefasConcluidas].sort((a, b) =>
    new Date(b.concluidaEm).getTime() - new Date(a.concluidaEm).getTime()
  );

  let streak = 0;
  let dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  for (const tarefa of ordenadas) {
    const dataTarefa = new Date(tarefa.concluidaEm);
    dataTarefa.setHours(0, 0, 0, 0);

    const diferencaDias = Math.floor((dataAtual.getTime() - dataTarefa.getTime()) / (1000 * 60 * 60 * 24));

    if (diferencaDias === streak) {
      streak++;
      dataAtual = dataTarefa;
    } else {
      break;
    }
  }

  return streak;
}

// Atualizar progresso do usuário
function atualizarProgresso(dados: DadosApp): ProgressoUsuario {
  const progresso = dados.progresso;
  const tarefasConcluidas = dados.tarefasConcluidas;

  // Calcular total de tarefas concluídas
  progresso.totalTarefasConcluidas = tarefasConcluidas.length;

  // Calcular tarefas por categoria
  progresso.tarefasConcluidasPorCategoria = {};
  for (const tarefa of tarefasConcluidas) {
    const categoria = tarefa.categoria;
    progresso.tarefasConcluidasPorCategoria[categoria] =
      (progresso.tarefasConcluidasPorCategoria[categoria] || 0) + 1;
  }

  // Calcular streaks
  progresso.streakAtual = calcularStreakAtual(tarefasConcluidas);
  progresso.maiorStreak = Math.max(progresso.maiorStreak, progresso.streakAtual);

  // Última tarefa concluída
  if (tarefasConcluidas.length > 0) {
    const ultimaTarefa = tarefasConcluidas.reduce((mais_recente, atual) =>
      new Date(atual.concluidaEm) > new Date(mais_recente.concluidaEm) ? atual : mais_recente
    );
    progresso.ultimaTarefaConcluida = ultimaTarefa.concluidaEm;
  }

  return progresso;
}

export function carregarDados(): DadosApp {
  if (typeof window === 'undefined') {
    return obterDadosIniciais();
  }

  try {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (!dadosSalvos) {
      return obterDadosIniciais();
    }

    const dados: DadosApp = JSON.parse(dadosSalvos);

    // Converter strings de data de volta para objetos Date
    dados.tarefasConcluidas = dados.tarefasConcluidas.map(tarefa => ({
      ...tarefa,
      concluidaEm: new Date(tarefa.concluidaEm)
    }));

    if (dados.progresso.ultimaTarefaConcluida) {
      dados.progresso.ultimaTarefaConcluida = new Date(dados.progresso.ultimaTarefaConcluida);
    }

    // Recalcular progresso para garantir consistência
    dados.progresso = atualizarProgresso(dados);

    return dados;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return obterDadosIniciais();
  }
}

export function salvarDados(dados: DadosApp): void {
  if (typeof window === 'undefined') return;

  try {
    // Atualizar progresso antes de salvar
    dados.progresso = atualizarProgresso(dados);

    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

export function resetarDados(): DadosApp {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CHAVE_STORAGE);
  }
  return obterDadosIniciais();
}

export function exportarDados(): string {
  const dados = carregarDados();
  return JSON.stringify(dados, null, 2);
}

export function importarDados(jsonDados: string): boolean {
  try {
    const dados: DadosApp = JSON.parse(jsonDados);
    salvarDados(dados);
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return false;
  }
}
