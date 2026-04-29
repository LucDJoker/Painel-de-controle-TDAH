// src/lib/armazenamento.ts
import type { DadosApp, Tarefa, TarefaConcluida, SubTarefa, FinancasApp, Transacao } from './types';
import { obterDadosIniciais } from './dados-iniciais';
import { obterChaveDadosUsuario } from './auth';

const CHAVE_BASE = 'painelControleTDAHDados_v7';

// Função para obter chave específica do usuário
const obterChaveStorage = () => obterChaveDadosUsuario(CHAVE_BASE);

export function inicializarDadosParaUsuario(usuarioId: string): void {
  if (typeof window === 'undefined') return;
  const dadosZerados = construirDadosZerados();
  const chaveUsuario = `${CHAVE_BASE}_${usuarioId}`;
  try {
    localStorage.setItem(chaveUsuario, JSON.stringify(dadosZerados));
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário', error);
  }
}

function construirDadosZerados(): DadosApp {
  const base = obterDadosIniciais();
  return {
    categorias: {},
    tarefas: {},
    tarefasConcluidas: [],
    progresso: {
      streakAtual: 0,
      maiorStreak: 0,
      totalTarefasConcluidas: 0,
      tarefasConcluidasPorCategoria: {},
      ultimaTarefaConcluida: undefined,
      totalPomodorosFocoCompletos: 0,
      totalSubTarefasConcluidas: 0,
    },
    configPomodoro: base.configPomodoro,
  } as DadosApp;
}

export function carregarDados(): DadosApp {
  if (typeof window !== 'undefined') {
    try {
      const dadosString = localStorage.getItem(obterChaveStorage());
      if (dadosString) {
        const dadosCarregados = JSON.parse(dadosString) as DadosApp;
        const dadosPadrao = obterDadosIniciais();

        dadosCarregados.categorias = dadosCarregados.categorias && typeof dadosCarregados.categorias === 'object' && !Array.isArray(dadosCarregados.categorias)
          ? dadosCarregados.categorias : dadosPadrao.categorias;
        
        dadosCarregados.tarefas = dadosCarregados.tarefas && typeof dadosCarregados.tarefas === 'object' && !Array.isArray(dadosCarregados.tarefas)
          ? dadosCarregados.tarefas : dadosPadrao.tarefas;
        
        dadosCarregados.tarefasConcluidas = Array.isArray(dadosCarregados.tarefasConcluidas)
          ? dadosCarregados.tarefasConcluidas : [];
          
        dadosCarregados.progresso = {
            ...(dadosPadrao.progresso), 
            ...(dadosCarregados.progresso || {}), 
            totalPomodorosFocoCompletos: dadosCarregados.progresso?.totalPomodorosFocoCompletos ?? 0,
        };

        dadosCarregados.configPomodoro = {
            ...(dadosPadrao.configPomodoro),
            ...(dadosCarregados.configPomodoro || {}),
        };

        // Convertendo datas e garantindo subTarefas
        for (const catId of Object.keys(dadosCarregados.tarefas)) {
          dadosCarregados.tarefas[catId] = (dadosCarregados.tarefas[catId] || []).map(tarefa => ({
            ...tarefa,
            criadaEm: tarefa.criadaEm ? new Date(tarefa.criadaEm) : new Date(),
            alarme: tarefa.alarme ? new Date(tarefa.alarme) : undefined,
            subTarefas: Array.isArray(tarefa.subTarefas) ? tarefa.subTarefas : [], 
          }));
        }
        dadosCarregados.tarefasConcluidas = dadosCarregados.tarefasConcluidas.map(tarefa => ({
          ...tarefa,
          concluidaEm: tarefa.concluidaEm ? new Date(tarefa.concluidaEm) : new Date(),
          alarme: tarefa.alarme ? new Date(tarefa.alarme) : undefined,
          subTarefas: Array.isArray(tarefa.subTarefas) ? tarefa.subTarefas : [],
        }));
        if (dadosCarregados.progresso.ultimaTarefaConcluida && typeof dadosCarregados.progresso.ultimaTarefaConcluida === 'string') {
          dadosCarregados.progresso.ultimaTarefaConcluida = new Date(dadosCarregados.progresso.ultimaTarefaConcluida);
        }

        // Garantir estrutura mínima para finanças
        const dadosFinancas = (dadosCarregados as unknown as Record<string, unknown>).financas;
        (dadosCarregados as unknown as Record<string, unknown>).financas = dadosFinancas && typeof dadosFinancas === 'object'
          ? dadosFinancas : { transacoes: [] } as FinancasApp;

        // Garantir datas das transações
        const transacoes = ((dadosCarregados as unknown as Record<string, unknown>).financas as FinancasApp)?.transacoes || [];
        for (const tx of transacoes) {
          if (tx?.date && typeof tx.date === 'string') {
            tx.date = new Date(tx.date).toISOString();
          }
        }
        return dadosCarregados;
      }
    } catch (error) { console.error("Erro ao carregar dados do localStorage, resetando para iniciais:", error); }
  }
  const zerados = construirDadosZerados();
  (zerados as unknown as Record<string, unknown>).financas = { transacoes: [] } as FinancasApp;
  return zerados as DadosApp;
}

// salvarDados e resetarDados continuam como na última versão que te mandei
export function salvarDados(dados: DadosApp): void {
  if (typeof window !== 'undefined') {
    try {
      const dadosParaSalvar = JSON.parse(JSON.stringify(dados)); 
      // Garantir campo de finanças
      dadosParaSalvar.financas = dadosParaSalvar.financas || { transacoes: [] };

      // Normalizar datas das transações
      dadosParaSalvar.financas.transacoes = (dadosParaSalvar.financas.transacoes || []).map((tx: Transacao) => ({
        ...tx,
        date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      }));
      for (const catId of Object.keys(dadosParaSalvar.tarefas)) {
        dadosParaSalvar.tarefas[catId] = (dadosParaSalvar.tarefas[catId] || []).map((tarefa: Tarefa) => ({
          ...tarefa,
          criadaEm: new Date(tarefa.criadaEm).toISOString(),
          alarme: tarefa.alarme ? new Date(tarefa.alarme).toISOString() : undefined,
        }));
      }
      dadosParaSalvar.tarefasConcluidas = dadosParaSalvar.tarefasConcluidas.map((tarefa: TarefaConcluida) => ({
        ...tarefa,
        concluidaEm: new Date(tarefa.concluidaEm).toISOString(),
        alarme: tarefa.alarme ? new Date(tarefa.alarme).toISOString() : undefined,
      }));
      if (dadosParaSalvar.progresso.ultimaTarefaConcluida) {
        dadosParaSalvar.progresso.ultimaTarefaConcluida = new Date(dadosParaSalvar.progresso.ultimaTarefaConcluida).toISOString();
      }
      localStorage.setItem(obterChaveStorage(), JSON.stringify(dadosParaSalvar));
    } catch (error) { console.error("Erro ao salvar dados no localStorage:", error); }
  }
}

export function resetarDados(): DadosApp {
  const dadosZerados = construirDadosZerados();
  if (typeof window !== 'undefined') {
    salvarDados(dadosZerados); 
  }
  return dadosZerados;
}

// Inicializa dados zerados para um usuário recém-cadastrado