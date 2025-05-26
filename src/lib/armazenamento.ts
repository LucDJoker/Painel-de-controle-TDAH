// src/lib/armazenamento.ts
import type { DadosApp, Tarefa, TarefaConcluida } from './types';
import { obterDadosIniciais } from './dados-iniciais';

const CHAVE_LOCAL_STORAGE = 'painelControleTDAHDados_v5';

export function carregarDados(): DadosApp {
  if (typeof window !== 'undefined') {
    try {
      const dadosString = localStorage.getItem(CHAVE_LOCAL_STORAGE);
      if (dadosString) {
        const dadosCarregados = JSON.parse(dadosString) as DadosApp;
        const dadosPadrao = obterDadosIniciais();

        dadosCarregados.categorias = dadosCarregados.categorias && typeof dadosCarregados.categorias === 'object' && !Array.isArray(dadosCarregados.categorias)
          ? dadosCarregados.categorias
          : dadosPadrao.categorias;
        
        dadosCarregados.tarefas = dadosCarregados.tarefas && typeof dadosCarregados.tarefas === 'object' && !Array.isArray(dadosCarregados.tarefas)
          ? dadosCarregados.tarefas
          : dadosPadrao.tarefas;
        
        // CORREÇÃO AQUI: Garante que é um array de TarefaConcluida ou um array vazio
        dadosCarregados.tarefasConcluidas = Array.isArray(dadosCarregados.tarefasConcluidas)
          ? dadosCarregados.tarefasConcluidas.map(tarefa => ({ // Garante a estrutura de cada item
              id: tarefa.id || `tc_${Date.now()}`, // Fallback para ID se necessário
              texto: tarefa.texto || '',
              categoriaId: tarefa.categoriaId || '',
              concluidaEm: tarefa.concluidaEm ? new Date(tarefa.concluidaEm) : new Date(),
              alarme: tarefa.alarme ? new Date(tarefa.alarme) : undefined,
            }))
          : []; // Se não for um array, começa como array vazio
          
        dadosCarregados.progresso = {
            ...(dadosPadrao.progresso), 
            ...(dadosCarregados.progresso || {}), 
            totalPomodorosFocoCompletos: dadosCarregados.progresso?.totalPomodorosFocoCompletos ?? 0,
        };

        dadosCarregados.configPomodoro = {
            ...(dadosPadrao.configPomodoro),
            ...(dadosCarregados.configPomodoro || {}),
        };

        Object.keys(dadosCarregados.tarefas).forEach(catId => {
          dadosCarregados.tarefas[catId] = (dadosCarregados.tarefas[catId] || []).map(tarefa => ({
            ...tarefa,
            criadaEm: tarefa.criadaEm ? new Date(tarefa.criadaEm) : new Date(),
            alarme: tarefa.alarme ? new Date(tarefa.alarme) : undefined,
          }));
        });
        // A conversão de datas para tarefasConcluidas já está dentro do map acima
        if (dadosCarregados.progresso.ultimaTarefaConcluida && typeof dadosCarregados.progresso.ultimaTarefaConcluida === 'string') {
          dadosCarregados.progresso.ultimaTarefaConcluida = new Date(dadosCarregados.progresso.ultimaTarefaConcluida);
        }
        return dadosCarregados;
      }
    } catch (error) { console.error("Erro ao carregar dados do localStorage, resetando para iniciais:", error); }
  }
  return obterDadosIniciais(); 
}

export function salvarDados(dados: DadosApp): void {
  if (typeof window !== 'undefined') {
    try {
      const dadosParaSalvar = JSON.parse(JSON.stringify(dados)); 
      Object.keys(dadosParaSalvar.tarefas).forEach(catId => {
        dadosParaSalvar.tarefas[catId] = (dadosParaSalvar.tarefas[catId] || []).map((tarefa: Tarefa) => ({
          ...tarefa,
          criadaEm: new Date(tarefa.criadaEm).toISOString(),
          alarme: tarefa.alarme ? new Date(tarefa.alarme).toISOString() : undefined,
        }));
      });
      dadosParaSalvar.tarefasConcluidas = dadosParaSalvar.tarefasConcluidas.map((tarefa: TarefaConcluida) => ({
        ...tarefa,
        concluidaEm: new Date(tarefa.concluidaEm).toISOString(),
        alarme: tarefa.alarme ? new Date(tarefa.alarme).toISOString() : undefined,
      }));
      if (dadosParaSalvar.progresso.ultimaTarefaConcluida) {
        dadosParaSalvar.progresso.ultimaTarefaConcluida = new Date(dadosParaSalvar.progresso.ultimaTarefaConcluida).toISOString();
      }
      localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(dadosParaSalvar));
    } catch (error) { console.error("Erro ao salvar dados no localStorage:", error); }
  }
}

export function resetarDados(): DadosApp {
  const dadosIniciais = obterDadosIniciais();
  if (typeof window !== 'undefined') {
    salvarDados(dadosIniciais); 
  }
  return dadosIniciais;
}