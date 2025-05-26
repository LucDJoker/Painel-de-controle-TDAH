'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { DadosApp, Tarefa, TarefaConcluida, Categoria, ConfigPomodoro } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';

type TipoCicloPomodoro = 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';

export function usePainel() {
  const dadosIniciaisCompletos = obterDadosIniciais();
  const [dados, setDados] = useState<DadosApp>(() => dadosIniciaisCompletos);
  const [carregando, setCarregando] = useState(true);
  const [textoNovaTarefa, setTextoNovaTarefa] = useState('');
  const [alarmeNovaTarefa, setAlarmeNovaTarefa] = useState<string>('');

  const [tempoRestantePomodoro, setTempoRestantePomodoro] = useState(
    (dados.configPomodoro || dadosIniciaisCompletos.configPomodoro).duracaoFocoMin * 60
  );
  const [pomodoroAtivo, setPomodoroAtivo] = useState(false);
  const [cicloAtualPomodoro, setCicloAtualPomodoro] = useState<TipoCicloPomodoro>('FOCO');
  const [ciclosFocoCompletosSessao, setCiclosFocoCompletosSessao] = useState(0);
  
  const intervalRefPomodoro = useRef<NodeJS.Timeout | null>(null);
  const audioRefPomodoro = useRef<HTMLAudioElement | null>(null);
  const audioRefAlarmeTarefa = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const dadosCarregados = carregarDados();
    setDados(dadosCarregados);
    setTempoRestantePomodoro((dadosCarregados.configPomodoro?.duracaoFocoMin || dadosIniciaisCompletos.configPomodoro.duracaoFocoMin) * 60);
    setCiclosFocoCompletosSessao(0);
    setCarregando(false);
    if (typeof window !== 'undefined') {
        audioRefPomodoro.current = new Audio('/pomodoro_fim.mp3');
        audioRefAlarmeTarefa.current = new Audio('/alarme.mp3');
    }
  }, []); // Roda apenas na montagem

  useEffect(() => {
    if (!carregando) {
      salvarDados(dados);
    }
  }, [dados, carregando]);
  
  const tocarSom = (audioElement: HTMLAudioElement | null, nomeSom: string) => { /* ... (código existente) ... */ };
  useEffect(() => { /* ... (useEffect de alarmes de tarefa - código existente) ... */ }, [dados.tarefas, carregando]);
  useEffect(() => { /* ... (useEffect do Pomodoro - código existente) ... */ }, [pomodoroAtivo, tempoRestantePomodoro, cicloAtualPomodoro, ciclosFocoCompletosSessao, dados.configPomodoro, dadosIniciaisCompletos.configPomodoro]);

  const iniciarOuPausarPomodoro = useCallback(() => { /* ... (código existente) ... */ }, [tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, dados.configPomodoro, dadosIniciaisCompletos.configPomodoro]);
  const resetarCicloPomodoro = useCallback(() => { /* ... (código existente) ... */ setCiclosFocoCompletosSessao(0); }, [cicloAtualPomodoro, dados.configPomodoro, dadosIniciaisCompletos.configPomodoro]);
  const atualizarConfigPomodoro = useCallback((novasConfigs: Partial<ConfigPomodoro>) => { /* ... (código existente) ... */ }, [pomodoroAtivo, cicloAtualPomodoro, dadosIniciaisCompletos.configPomodoro]);
  
  const concluirTarefa = useCallback((tarefaParaConcluir: Tarefa) => { /* ... (código existente) ... */ }, []);
  const adicionarTarefa = useCallback((categoriaIdSelecionada: string, alarme?: string) => { /* ... (código existente) ... */ }, [textoNovaTarefa, alarmeNovaTarefa, dados.categorias, dadosIniciaisCompletos.configPomodoro]); // Removido dados.configPomodoro se não usado aqui
  const excluirTarefa = useCallback((tarefaId: string, categoriaIdDaTarefa: string) => { /* ... (código existente) ... */ }, []);
  const adicionarNovaCategoria = useCallback((nome: string, emoji: string, cor: string) => { /* ... (código existente) ... */ }, [dados.categorias]);
  const excluirCategoria = useCallback((categoriaIdParaExcluir: string) => { /* ... (código existente) ... */ }, []);
  
  const resetarGeral = useCallback(() => { 
    const dadosIniciaisReset = resetarDados(); 
    setDados(dadosIniciaisReset);
    if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
    setPomodoroAtivo(false);
    setCicloAtualPomodoro('FOCO');
    // Use o configPomodoro dos dados resetados, com fallback para o default global
    const configPomoReset = dadosIniciaisReset.configPomodoro || dadosIniciaisCompletos.configPomodoro;
    setTempoRestantePomodoro(configPomoReset.duracaoFocoMin * 60);
    setCiclosFocoCompletosSessao(0);
  }, [dadosIniciaisCompletos.configPomodoro]); // Adicionado dadosIniciaisCompletos.configPomodoro como dependência

  // CORREÇÕES AQUI: Garantindo retornos e verificações
  const obterTotalTarefas = useCallback((): number => {
    if (!dados || !dados.tarefas || typeof dados.tarefas !== 'object') return 0; // Verifica se é objeto
    return (Object.keys(dados.tarefas) as string[]).reduce((total, key) => {
        const tarefasDaCategoria = dados.tarefas[key]; // Acessa diretamente
        return total + (Array.isArray(tarefasDaCategoria) ? tarefasDaCategoria.length : 0);
    }, 0);
  }, [dados.tarefas]);

  const obterTarefasHoje = useCallback((): TarefaConcluida[] => {
    const hoje = new Date();
    if (!dados || !Array.isArray(dados.tarefasConcluidas)) return []; // Garante que é array
    return dados.tarefasConcluidas.filter(tarefa => {
      if (!tarefa.concluidaEm) return false;
      const dataTarefa = new Date(tarefa.concluidaEm);
      return hoje.toDateString() === dataTarefa.toDateString();
    });
  }, [dados.tarefasConcluidas]);

  const jaConcluidoHoje = useCallback((): boolean => {
    return obterTarefasHoje().length > 0;
  }, [obterTarefasHoje]); // obterTarefasHoje já é um useCallback

  return {
    dados, carregando, concluirTarefa, adicionarTarefa, excluirTarefa,
    adicionarNovaCategoria, excluirCategoria, 
    resetar: resetarGeral, 
    obterTotalTarefas, obterTarefasHoje, jaConcluidoHoje, 
    textoNovaTarefa, setTextoNovaTarefa, alarmeNovaTarefa, setAlarmeNovaTarefa,
    tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, 
    ciclosCompletos: ciclosFocoCompletosSessao,
    iniciarOuPausarPomodoro, 
    resetarPomodoro: resetarCicloPomodoro, 
    atualizarConfigPomodoro,
    configPomodoro: dados.configPomodoro || dadosIniciaisCompletos.configPomodoro,
  };
}