'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { DadosApp, Tarefa, TarefaConcluida, Categoria, ConfigPomodoro } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';

type TipoCicloPomodoro = 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';

const DURACAO_FOCO_PADRAO = 25;

export function usePainel() {
  const dadosIniciaisGlobais = useRef(obterDadosIniciais());
  const [dados, setDados] = useState<DadosApp>(() => carregarDados());
  const [carregando, setCarregando] = useState(true);
  const [textoNovaTarefa, setTextoNovaTarefa] = useState('');
  const [alarmeNovaTarefa, setAlarmeNovaTarefa] = useState<string>('');

  const getConfigPomodoro = useCallback(
    (): ConfigPomodoro => dados.configPomodoro || dadosIniciaisGlobais.current.configPomodoro,
    [dados.configPomodoro, dadosIniciaisGlobais]
  );

  const [tempoRestantePomodoro, setTempoRestantePomodoro] = useState(getConfigPomodoro().duracaoFocoMin * 60);
  const [pomodoroAtivo, setPomodoroAtivo] = useState(false);
  const [cicloAtualPomodoro, setCicloAtualPomodoro] = useState<TipoCicloPomodoro>('FOCO');
  const [ciclosCompletos, setCiclosCompletos] = useState(0);
  
  const intervalRefPomodoro = useRef<NodeJS.Timeout | null>(null);
  const audioRefPomodoro = useRef<HTMLAudioElement | null>(null);
  const audioRefAlarmeTarefa = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const dadosCarregados = carregarDados();
    setDados(dadosCarregados);
    const confPomoInicial = dadosCarregados.configPomodoro || dadosIniciaisGlobais.current.configPomodoro;
    setTempoRestantePomodoro(confPomoInicial.duracaoFocoMin * 60);
    setCiclosCompletos(0); 
    setCarregando(false);
    if (typeof window !== 'undefined') {
        audioRefPomodoro.current = new Audio('/pomodoro_fim.mp3');
        audioRefAlarmeTarefa.current = new Audio('/alarme.mp3');
    }
  }, [dadosIniciaisGlobais]); 

  useEffect(() => {
    if (!carregando) {
      salvarDados(dados);
    }
  }, [dados, carregando]);
  
  const tocarSom = useCallback((audioElement: HTMLAudioElement | null, nomeSom: string): void => {
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(error => {
        console.warn(`Não foi possível tocar o som (${nomeSom}) automaticamente:`, error);
      });
    }
  },[]);

  useEffect(() => { 
    if (carregando || typeof window === 'undefined' || !dados || !dados.tarefas) return;
    const verificarAlarmes = ():void => {
        const agora = new Date();
        let algumaNotificacaoMostradaParaToast = false;
        Object.values(dados.tarefas).flat().forEach(tarefa => {
          if (tarefa.alarme && !tarefa.completada) {
            const dataAlarme = new Date(tarefa.alarme);
            const diffTempo = agora.getTime() - dataAlarme.getTime();
            if (dataAlarme <= agora && diffTempo < 60000 && diffTempo >= 0) {
              if (Notification.permission === "granted") {
                new Notification("Alarme de Tarefa!", {
                  body: `Hora de fazer: ${tarefa.texto}`, icon: "/icon-192x192.png", tag: tarefa.id,
                });
                tocarSom(audioRefAlarmeTarefa.current, "Alarme de Tarefa");
                if (!algumaNotificacaoMostradaParaToast) {
                  toast.info(`🔔 Alarme: ${tarefa.texto}`);
                  algumaNotificacaoMostradaParaToast = true;
                }
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") { 
                    new Notification("Alarme de Tarefa!", {
                      body: `Hora de fazer: ${tarefa.texto}`, icon: "/icon-192x192.png", tag: tarefa.id,
                    });
                    tocarSom(audioRefAlarmeTarefa.current, "Alarme de Tarefa");
                    if (!algumaNotificacaoMostradaParaToast) {
                      toast.info(`🔔 Alarme: ${tarefa.texto}`);
                      algumaNotificacaoMostradaParaToast = true;
                    }
                   }
                });
              }
            }
          }
        });
      };
      if (typeof Notification !== 'undefined' && Notification.permission === "default") {
          Notification.requestPermission();
      }
      const intervalId = setInterval(verificarAlarmes, 30000); 
      return () => clearInterval(intervalId);
  }, [dados.tarefas, carregando, tocarSom]);

  useEffect(() => { 
    const confPomo = getConfigPomodoro();
    if (pomodoroAtivo && tempoRestantePomodoro > 0) {
      intervalRefPomodoro.current = setInterval(() => {
        setTempoRestantePomodoro(tempo => Math.max(0, tempo - 1));
      }, 1000);
    } else if (pomodoroAtivo && tempoRestantePomodoro === 0) {
      if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
      setPomodoroAtivo(false); 
      tocarSom(audioRefPomodoro.current, "Fim do Pomodoro");

      if (cicloAtualPomodoro === 'FOCO') {
        const novosCiclos = ciclosCompletos + 1;
        setCiclosCompletos(novosCiclos);
        
        setDados(prevDados => {
          const novosDadosProgresso = { ...(prevDados.progresso || dadosIniciaisGlobais.current.progresso) };
          novosDadosProgresso.totalPomodorosFocoCompletos = (novosDadosProgresso.totalPomodorosFocoCompletos || 0) + 1;
          return { ...prevDados, progresso: novosDadosProgresso };
        });
        
        toast.success("💪 Sessão de Foco Concluída!", { description: "Hora de uma pausa." });
        if (novosCiclos > 0 && novosCiclos % confPomo.ciclosAtePausaLonga === 0) {
          setCicloAtualPomodoro('PAUSA_LONGA');
          setTempoRestantePomodoro(confPomo.duracaoPausaLongaMin * 60);
        } else {
          setCicloAtualPomodoro('PAUSA_CURTA');
          setTempoRestantePomodoro(confPomo.duracaoPausaCurtaMin * 60);
        }
      } else { 
        toast.info("🧘 Pausa Concluída!", { description: "De volta ao foco!" });
        setCicloAtualPomodoro('FOCO');
        setTempoRestantePomodoro(confPomo.duracaoFocoMin * 60);
      }
    }
    return () => {
      if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
    };
  }, [pomodoroAtivo, tempoRestantePomodoro, cicloAtualPomodoro, ciclosCompletos, getConfigPomodoro, tocarSom, dadosIniciaisGlobais]);

  const iniciarOuPausarPomodoro = useCallback((): void => {
    const confPomo = getConfigPomodoro();
    if (tempoRestantePomodoro === 0 && !pomodoroAtivo) {
        if (cicloAtualPomodoro === 'FOCO') setTempoRestantePomodoro(confPomo.duracaoFocoMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_CURTA') setTempoRestantePomodoro(confPomo.duracaoPausaCurtaMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_LONGA') setTempoRestantePomodoro(confPomo.duracaoPausaLongaMin * 60);
    }
    setPomodoroAtivo(ativo => !ativo);
  }, [tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, getConfigPomodoro]);

  const resetarCicloPomodoro = useCallback((): void => {
    const confPomo = getConfigPomodoro();
    if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
    setPomodoroAtivo(false);
    if (cicloAtualPomodoro === 'FOCO') {
        setTempoRestantePomodoro(confPomo.duracaoFocoMin * 60);
    } else if (cicloAtualPomodoro === 'PAUSA_CURTA') {
        setTempoRestantePomodoro(confPomo.duracaoPausaCurtaMin * 60);
    } else if (cicloAtualPomodoro === 'PAUSA_LONGA') {
        setTempoRestantePomodoro(confPomo.duracaoPausaLongaMin * 60);
    }
    // Não reseta ciclosCompletos aqui
  }, [cicloAtualPomodoro, getConfigPomodoro]);

  const atualizarConfigPomodoro = useCallback((novasConfigs: Partial<ConfigPomodoro>): void => {
    setDados(prevDados => {
      const confExistente = prevDados.configPomodoro || getConfigPomodoro();
      const configPomodoroAtualizada = { ...confExistente, ...novasConfigs };
      if (!pomodoroAtivo) {
        if (cicloAtualPomodoro === 'FOCO') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoFocoMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_CURTA') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoPausaCurtaMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_LONGA') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoPausaLongaMin * 60);
      }
      return { ...prevDados, configPomodoro: configPomodoroAtualizada };
    });
    toast.success("Configurações do Pomodoro salvas!");
  }, [pomodoroAtivo, cicloAtualPomodoro, getConfigPomodoro]);
  
  const concluirTarefa = useCallback((tarefaParaConcluir: Tarefa): void => {
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      const { categoriaId } = tarefaParaConcluir;
      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) {
        const tarefasDaCategoria = novosDados.tarefas[categoriaId];
        const index = tarefasDaCategoria.findIndex(t => t.id === tarefaParaConcluir.id);
        if (index > -1) {
          const [tarefaRemovida] = tarefasDaCategoria.splice(index, 1);
          if (novosDados.progresso) {
            novosDados.progresso.totalTarefasConcluidas = (novosDados.progresso.totalTarefasConcluidas || 0) + 1;
            if (novosDados.progresso.tarefasConcluidasPorCategoria) {
                novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] = (novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] || 0) + 1;
            }
            novosDados.progresso.ultimaTarefaConcluida = new Date();
          }
          const tarefaConcluidaObj: TarefaConcluida = {
            id: tarefaRemovida.id, texto: tarefaRemovida.texto, categoriaId: tarefaRemovida.categoriaId, concluidaEm: new Date(), alarme: tarefaRemovida.alarme
          };
          novosDados.tarefasConcluidas = [...(novosDados.tarefasConcluidas || []), tarefaConcluidaObj];
        }
      }
      return novosDados;
    });
  }, []);

  const adicionarTarefa = useCallback((categoriaIdSelecionada: string, alarme?: string): void => {
    if (textoNovaTarefa.trim() === "") { toast.error("O texto da tarefa não pode estar vazio."); return; }
    if (!categoriaIdSelecionada || !dados.categorias || !dados.categorias[categoriaIdSelecionada]) { toast.error("Por favor, selecione uma categoria válida."); return; }
    const novaTarefa: Tarefa = {
      id: `tarefa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      texto: textoNovaTarefa, categoriaId: categoriaIdSelecionada, criadaEm: new Date(), completada: false,
      alarme: alarme ? new Date(alarme) : undefined, 
    };
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      novosDados.tarefas = { ...novosDados.tarefas }; 
      if (!novosDados.tarefas[novaTarefa.categoriaId]) { novosDados.tarefas[novaTarefa.categoriaId] = []; }
      novosDados.tarefas[novaTarefa.categoriaId]?.unshift(novaTarefa); 
      return novosDados;
    });
    const categoriaInfo = dados.categorias[categoriaIdSelecionada];
    toast.success(`Tarefa "${textoNovaTarefa}" adicionada na categoria ${categoriaInfo?.nome || categoriaIdSelecionada}!`);
    setTextoNovaTarefa(''); setAlarmeNovaTarefa('');
  }, [textoNovaTarefa, alarmeNovaTarefa, dados.categorias]);

  const editarTarefa = useCallback((
    tarefaId: string, 
    categoriaIdOriginal: string, 
    novosDadosTarefa: Partial<Omit<Tarefa, 'id' | 'criadaEm'>>
  ): void => {
    setDados(prevDados => {
      const dadosAtualizados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      const categoriaAlvoId = novosDadosTarefa.categoriaId || categoriaIdOriginal;

      let tarefaOriginal: Tarefa | undefined;
      // Procura em todas as categorias de tarefas ativas
      for (const catIdKey of Object.keys(dadosAtualizados.tarefas)) {
        const tarefasDaCat = dadosAtualizados.tarefas[catIdKey] || [];
        tarefaOriginal = tarefasDaCat.find(t => t.id === tarefaId);
        if (tarefaOriginal) break; 
      }
      
      if (!tarefaOriginal) {
        toast.error("Erro: Tarefa original não encontrada para editar.");
        console.error(`[editarTarefa] Tarefa com id ${tarefaId} não encontrada.`);
        return prevDados; 
      }

      // Se a categoria mudou, remover da lista antiga
      if (novosDadosTarefa.categoriaId && novosDadosTarefa.categoriaId !== categoriaIdOriginal) {
        if (dadosAtualizados.tarefas[categoriaIdOriginal]) {
          dadosAtualizados.tarefas[categoriaIdOriginal] = dadosAtualizados.tarefas[categoriaIdOriginal].filter(
            t => t.id !== tarefaId
          );
        }
      }

      const tarefaAtualizada: Tarefa = {
        ...tarefaOriginal, 
        ...novosDadosTarefa, 
        alarme: novosDadosTarefa.alarme ? new Date(novosDadosTarefa.alarme) : undefined,
      };
      
      if (!dadosAtualizados.tarefas[categoriaAlvoId]) {
        dadosAtualizados.tarefas[categoriaAlvoId] = [];
      }
      
      const indexNaCategoriaAlvo = dadosAtualizados.tarefas[categoriaAlvoId].findIndex(t => t.id === tarefaId);

      if (indexNaCategoriaAlvo > -1) { 
        dadosAtualizados.tarefas[categoriaAlvoId][indexNaCategoriaAlvo] = tarefaAtualizada;
      } else { 
        dadosAtualizados.tarefas[categoriaAlvoId].unshift(tarefaAtualizada);
      }
      
      toast.success("Tarefa atualizada com sucesso!");
      return dadosAtualizados;
    });
  }, []);

  const excluirTarefa = useCallback((tarefaId: string, categoriaIdDaTarefa: string): void => {
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

  const adicionarNovaCategoria = useCallback((nome: string, emoji: string, cor: string): void => {
    if (nome.trim() === "" ) { toast.error("O nome da categoria é obrigatório."); return; }
    const categoriasAtuais = dados.categorias ? Object.values(dados.categorias) : [];
    const nomeExistente = categoriasAtuais.find( (cat: Categoria) => cat.nome.toLowerCase() === nome.toLowerCase() );
    if (nomeExistente) { toast.error(`A categoria "${nome}" já existe.`); return; }

    const novoIdCategoria = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const novaCategoria: Categoria = { id: novoIdCategoria, nome, emoji: emoji || '📁', cor: cor || '#718096', };

    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      novosDados.categorias = { ...(novosDados.categorias || {}), [novoIdCategoria]: novaCategoria };
      if (novosDados.tarefas && novosDados.tarefas[novaCategoria.id] === undefined) {
          novosDados.tarefas[novaCategoria.id] = [];
      }
      return novosDados;
    });
    toast.success(`Categoria "${nome}" adicionada!`);
  }, [dados.categorias]);

  const excluirCategoria = useCallback((categoriaIdParaExcluir: string): void => {
    setDados(prevDados => {
      const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
      if (novosDados.categorias) { delete novosDados.categorias[categoriaIdParaExcluir]; }
      if (novosDados.tarefas) { delete novosDados.tarefas[categoriaIdParaExcluir]; }
      if (novosDados.tarefasConcluidas) {
        novosDados.tarefasConcluidas = (novosDados.tarefasConcluidas || []).filter( tc => tc.categoriaId !== categoriaIdParaExcluir );
      }
      if (novosDados.progresso && novosDados.progresso.tarefasConcluidasPorCategoria) {
        delete novosDados.progresso.tarefasConcluidasPorCategoria[categoriaIdParaExcluir];
      }
      return novosDados;
    });
    toast.error("Categoria e suas tarefas foram excluídas!");
  }, []);
  
  const resetarGeral = useCallback((): void => { 
    const dadosIniciaisReset = resetarDados(); 
    setDados(dadosIniciaisReset);
    if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
    setPomodoroAtivo(false);
    setCicloAtualPomodoro('FOCO');
    const configPomoReset = dadosIniciaisReset.configPomodoro || getConfigPomodoro();
    setTempoRestantePomodoro(configPomoReset.duracaoFocoMin * 60);
    setCiclosCompletos(0);
  }, [getConfigPomodoro]); // Adicionada dependência

  const obterTotalTarefas = useCallback((): number => {
    if (!dados || !dados.tarefas || typeof dados.tarefas !== 'object') return 0;
    return (Object.keys(dados.tarefas) as string[]).reduce((total, key) => {
        const tarefasDaCategoria = dados.tarefas[key]; // Acessa diretamente
        return total + (Array.isArray(tarefasDaCategoria) ? tarefasDaCategoria.length : 0);
    }, 0);
  }, [dados.tarefas]);

  const obterTarefasHoje = useCallback((): TarefaConcluida[] => {
    const hoje = new Date();
    if (!dados || !Array.isArray(dados.tarefasConcluidas)) return [];
    return dados.tarefasConcluidas.filter(tarefa => {
      if (!tarefa.concluidaEm) return false;
      const dataTarefa = new Date(tarefa.concluidaEm);
      return hoje.toDateString() === dataTarefa.toDateString();
    });
  }, [dados.tarefasConcluidas]);

  const jaConcluidoHoje = useCallback((): boolean => {
    return obterTarefasHoje().length > 0;
  }, [obterTarefasHoje]);

  return {
    dados, carregando, concluirTarefa, adicionarTarefa, excluirTarefa,
    editarTarefa, adicionarNovaCategoria, excluirCategoria, 
    resetar: resetarGeral, 
    obterTotalTarefas, obterTarefasHoje, jaConcluidoHoje, 
    textoNovaTarefa, setTextoNovaTarefa, alarmeNovaTarefa, setAlarmeNovaTarefa,
    tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, 
    ciclosCompletos, 
    iniciarOuPausarPomodoro, 
    resetarPomodoro: resetarCicloPomodoro, 
    atualizarConfigPomodoro,
    configPomodoro: getConfigPomodoro(),
  };
}