'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DadosApp, Tarefa, TarefaConcluida, Categoria } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';

export function usePainel() {
  const [dados, setDados] = useState<DadosApp>(() => obterDadosIniciais());
  const [carregando, setCarregando] = useState(true);
  const [textoNovaTarefa, setTextoNovaTarefa] = useState('');

  useEffect(() => {
    const dadosCarregados = carregarDados();
    setDados(dadosCarregados); // carregarDados agora sempre retorna DadosApp
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      // console.log('DADOS ATUALIZADOS NO HOOK (use-painel.ts):', JSON.parse(JSON.stringify(dados)));
      salvarDados(dados);
    }
  }, [dados, carregando]);

  const concluirTarefa = useCallback((tarefaParaConcluir: Tarefa) => {
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      let tarefaRemovida: Tarefa | undefined;
      const { categoriaId } = tarefaParaConcluir;

      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) {
        const tarefasDaCategoria = novosDados.tarefas[categoriaId]; // Não precisa de || [] aqui se tarefas[categoriaId] é garantido
        const index = tarefasDaCategoria.findIndex(t => t.id === tarefaParaConcluir.id);
        if (index > -1) {
          [tarefaRemovida] = tarefasDaCategoria.splice(index, 1);
          if (novosDados.progresso) { // Verificação de progresso
            novosDados.progresso.totalTarefasConcluidas = (novosDados.progresso.totalTarefasConcluidas || 0) + 1;
            if (novosDados.progresso.tarefasConcluidasPorCategoria) {
                novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] = (novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] || 0) + 1;
            }
            novosDados.progresso.ultimaTarefaConcluida = new Date();
          }
        }
      }

      if (tarefaRemovida) {
        const tarefaConcluidaObj: TarefaConcluida = {
          id: tarefaRemovida.id,
          texto: tarefaRemovida.texto,
          categoriaId: tarefaRemovida.categoriaId,
          concluidaEm: new Date()
        };
        novosDados.tarefasConcluidas = [...(novosDados.tarefasConcluidas || []), tarefaConcluidaObj];
      }
      return novosDados;
    });
  }, []);

  const adicionarTarefa = useCallback((categoriaIdSelecionada: string) => {
    if (textoNovaTarefa.trim() === "") {
        toast.error("O texto da tarefa não pode estar vazio.");
        return;
    }
    if (!categoriaIdSelecionada || !dados.categorias || !dados.categorias[categoriaIdSelecionada]) {
        toast.error("Por favor, selecione uma categoria válida.");
        return;
    }

    const novaTarefa: Tarefa = {
      id: `tarefa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      texto: textoNovaTarefa,
      categoriaId: categoriaIdSelecionada,
      criadaEm: new Date(),
      completada: false, 
    };

    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      novosDados.tarefas = { ...novosDados.tarefas }; 
      
      if (!novosDados.tarefas[novaTarefa.categoriaId]) {
        novosDados.tarefas[novaTarefa.categoriaId] = [];
      }
      novosDados.tarefas[novaTarefa.categoriaId]?.unshift(novaTarefa); 
      
      return novosDados;
    });

    const categoriaInfo = dados.categorias[categoriaIdSelecionada];
    toast.success(`Tarefa "${textoNovaTarefa}" adicionada na categoria ${categoriaInfo?.nome || categoriaIdSelecionada}!`);
    setTextoNovaTarefa('');
  }, [textoNovaTarefa, dados.categorias]);

  const excluirTarefa = useCallback((tarefaId: string, categoriaIdDaTarefa: string) => {
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      if (novosDados.tarefas && novosDados.tarefas[categoriaIdDaTarefa]) {
        novosDados.tarefas[categoriaIdDaTarefa] = 
          (novosDados.tarefas[categoriaIdDaTarefa] || []).filter(t => t.id !== tarefaId);
      }
      return novosDados;
    });
    toast.error("Tarefa excluída!");
  }, []);

  const adicionarNovaCategoria = useCallback((nome: string, emoji: string, cor: string) => {
    if (nome.trim() === "" ) {
      toast.error("O nome da categoria é obrigatório.");
      return;
    }
    
    const categoriasAtuais = dados.categorias ? Object.values(dados.categorias) : [];
    const nomeExistente = categoriasAtuais.find(
      (cat: Categoria) => cat.nome.toLowerCase() === nome.toLowerCase()
    );

    if (nomeExistente) {
      toast.error(`A categoria "${nome}" já existe.`);
      return;
    }

    const novoIdCategoria = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const novaCategoria: Categoria = {
      id: novoIdCategoria,
      nome,
      emoji: emoji || '📁',
      cor: cor || '#718096',
    };

    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      novosDados.categorias = {
        ...(novosDados.categorias || {}),
        [novoIdCategoria]: novaCategoria
      };
      // Garante que a lista de tarefas para a nova categoria seja inicializada
      if (novosDados.tarefas && novosDados.tarefas[novaCategoria.id] === undefined) {
          novosDados.tarefas[novaCategoria.id] = [];
      }
      return novosDados;
    });
    toast.success(`Categoria "${nome}" adicionada!`);
  }, [dados.categorias]);

  const excluirCategoria = useCallback((categoriaIdParaExcluir: string) => {
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;

      if (novosDados.categorias) {
        delete novosDados.categorias[categoriaIdParaExcluir];
      }
      if (novosDados.tarefas) {
        delete novosDados.tarefas[categoriaIdParaExcluir];
      }
      if (novosDados.tarefasConcluidas) {
        novosDados.tarefasConcluidas = (novosDados.tarefasConcluidas || []).filter(
          tc => tc.categoriaId !== categoriaIdParaExcluir
        );
      }
      if (novosDados.progresso && novosDados.progresso.tarefasConcluidasPorCategoria) {
        delete novosDados.progresso.tarefasConcluidasPorCategoria[categoriaIdParaExcluir];
      }
      return novosDados;
    });
    toast.error("Categoria e suas tarefas foram excluídas!");
  }, []);

  const resetar = useCallback(() => {
    const dadosIniciaisReset = resetarDados(); 
    setDados(dadosIniciaisReset);
  }, []);

  const obterTotalTarefas = useCallback(() => {
    if (!dados || !dados.tarefas) return 0;
    return (Object.keys(dados.tarefas) as string[]).reduce((total, key) => {
        const tarefasDaCategoria = dados.tarefas[key] || [];
        return total + (Array.isArray(tarefasDaCategoria) ? tarefasDaCategoria.length : 0);
    }, 0);
  }, [dados.tarefas]);

  const obterTarefasHoje = useCallback(() => {
    const hoje = new Date();
    if (!dados || !dados.tarefasConcluidas) return [];
    return dados.tarefasConcluidas.filter(tarefa => {
      if (!tarefa.concluidaEm) return false;
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
    adicionarTarefa,
    excluirTarefa,
    adicionarNovaCategoria,
    excluirCategoria,
    resetar,
    obterTotalTarefas,
    obterTarefasHoje,
    jaConcluidoHoje,
    textoNovaTarefa,
    setTextoNovaTarefa,
  };
}