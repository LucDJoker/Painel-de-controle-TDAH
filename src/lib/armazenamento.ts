// src/lib/armazenamento.ts
import type { DadosApp } from './types';
import { obterDadosIniciais } from './dados-iniciais';

const CHAVE_LOCAL_STORAGE = 'painelControleTDAHDados_v1'; // Mudei a chave para forçar um reset na primeira vez com os novos dados iniciais

export function carregarDados(): DadosApp { // Removido | null, sempre retorna DadosApp
  if (typeof window !== 'undefined') {
    try {
      const dadosString = localStorage.getItem(CHAVE_LOCAL_STORAGE);
      if (dadosString) {
        const dadosCarregados = JSON.parse(dadosString) as DadosApp;
        // Garante que as estruturas principais existam e tenham o tipo correto
        dadosCarregados.categorias = dadosCarregados.categorias || obterDadosIniciais().categorias;
        dadosCarregados.tarefas = dadosCarregados.tarefas || obterDadosIniciais().tarefas;
        dadosCarregados.tarefasConcluidas = dadosCarregados.tarefasConcluidas || [];
        dadosCarregados.progresso = dadosCarregados.progresso || obterDadosIniciais().progresso;
        return dadosCarregados;
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      // Se der erro, retorna os dados iniciais para não quebrar o app
    }
  }
  return obterDadosIniciais(); 
}

export function salvarDados(dados: DadosApp): void {
  if (typeof window !== 'undefined') {
    try {
      const dadosString = JSON.stringify(dados);
      localStorage.setItem(CHAVE_LOCAL_STORAGE, dadosString);
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
    }
  }
}

export function resetarDados(): DadosApp {
  const dadosIniciais = obterDadosIniciais();
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(dadosIniciais)); 
  }
  return dadosIniciais;
}