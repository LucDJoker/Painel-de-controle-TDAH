'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DadosApp, Tarefa, TarefaConcluida } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';

export function usePainel() {
  const [dados, setDados] = useState<DadosApp>(() => obterDadosIniciais());
  const [carregando, setCarregando] = useState(true);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const dadosCarregados = carregarDados();
    setDados(dadosCarregados);
    setCarregando(false);
  }, []);

  // Salvar dados sempre que mudarem
  useEffect(() => {
    if (!carregando) {
      salvarDados(dados);
    }
  }, [dados, carregando]);

  const concluirTarefa = useCallback((tarefa: Tarefa) => {
    setDados(prevDados => {
      const novosDados = { ...prevDados };

      // Remover tarefa da categoria
      novosDados.tarefas = { ...prevDados.tarefas };
      novosDados.tarefas[tarefa.categoria] = prevDados.tarefas[tarefa.categoria].filter(
        t => t.id !== tarefa.id
      );

      // Adicionar à lista de concluídas
      const tarefaConcluida: TarefaConcluida = {
        id: tarefa.id,
        texto: tarefa.texto,
        categoria: tarefa.categoria,
        concluidaEm: new Date()
      };

      novosDados.tarefasConcluidas = [...prevDados.tarefasConcluidas, tarefaConcluida];

      return novosDados;
    });
  }, []);

  const resetar = useCallback(() => {
    const dadosIniciais = resetarDados();
    setDados(dadosIniciais);
  }, []);

  const obterTotalTarefas = useCallback(() => {
    return Object.values(dados.tarefas).reduce((total, tarefas) => total + tarefas.length, 0);
  }, [dados.tarefas]);

  const obterTarefasHoje = useCallback(() => {
    const hoje = new Date();
    return dados.tarefasConcluidas.filter(tarefa => {
      const dataTarefa = new Date(tarefa.concluidaEm);
      return hoje.toDateString() === dataTarefa.toDateString();
    });
  }, [dados.tarefasConcluidas]);

  const jaConcluidoHoje = useCallback(() => {
    return obterTarefasHoje().length > 0;
  }, [obterTarefasHoje]);

  return {
    dados,
    carregando,
    concluirTarefa,
    resetar,
    obterTotalTarefas,
    obterTarefasHoje,
    jaConcluidoHoje
  };
}
