'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { DadosApp, Tarefa, TarefaConcluida, Categoria, ConfigPomodoro, SubTarefa } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';

type TipoCicloPomodoro = 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';

const DURACAO_FOCO_PADRAO = 25;
const DURACAO_PAUSA_CURTA_PADRAO = 5;
const DURACAO_PAUSA_LONGA_PADRAO = 15;
const CICLOS_ATE_PAUSA_LONGA_PADRAO = 4;


export function usePainel() {
  const dadosIniciaisGlobais = useRef(obterDadosIniciais());
  const [dados, setDados] = useState<DadosApp>(() => carregarDados());
  const [carregando, setCarregando] = useState(true);
  const [textoNovaTarefa, setTextoNovaTarefa] = useState('');
  const [alarmeNovaTarefa, setAlarmeNovaTarefa] = useState<string>('');

  const getConfigPomodoro = useCallback((): ConfigPomodoro => {
    return dados.configPomodoro || dadosIniciaisGlobais.current.configPomodoro;
  }, [dados.configPomodoro]);

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
  }, []); 

  useEffect(() => { 
    if (!carregando) { 
      salvarDados(dados); 
    } 
  }, [dados, carregando]);
  
  const tocarSom = useCallback((audioElement: HTMLAudioElement | null, nomeSom: string): void => {
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(e => console.warn(`Som ${nomeSom} bloqueado: ${(e as Error).message}`));
    }
  },[]);

  useEffect(() => { 
    if (carregando || typeof window === 'undefined' || !dados.tarefas) return;
    const verificarAlarmes = ():void => {
        const agora = new Date();
        let algumaNotificacaoMostradaParaToast = false;
        if (dados.tarefas && typeof dados.tarefas === 'object') {
            Object.values(dados.tarefas).flat().forEach(tarefa => {
              if (tarefa.alarme && !tarefa.completada) {
                const dataAlarme = new Date(tarefa.alarme);
                const diffTempo = agora.getTime() - dataAlarme.getTime();
                if (dataAlarme <= agora && diffTempo < 60000 && diffTempo >= 0) {
                  if (Notification.permission === "granted") {
                    new Notification("Alarme de Tarefa!", { body: `Hora de fazer: ${tarefa.texto}`, icon: "/icon-192x192.png", tag: tarefa.id });
                    tocarSom(audioRefAlarmeTarefa.current, "Alarme de Tarefa");
                    if (!algumaNotificacaoMostradaParaToast) { toast.info(`🔔 Alarme: ${tarefa.texto}`); algumaNotificacaoMostradaParaToast = true; }
                  } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                      if (permission === "granted") { 
                        new Notification("Alarme de Tarefa!", { body: `Hora de fazer: ${tarefa.texto}`, icon: "/icon-192x192.png", tag: tarefa.id });
                        tocarSom(audioRefAlarmeTarefa.current, "Alarme de Tarefa");
                        if (!algumaNotificacaoMostradaParaToast) { toast.info(`🔔 Alarme: ${tarefa.texto}`); algumaNotificacaoMostradaParaToast = true; }
                       }
                    });
                  }
                }
              }
            });
        }
      };
      if (typeof Notification !== 'undefined' && Notification.permission === "default") { Notification.requestPermission(); }
      const intervalId = setInterval(verificarAlarmes, 30000); 
      return () => clearInterval(intervalId);
  }, [dados.tarefas, carregando, tocarSom]);

  useEffect(() => { 
    const confPomo = getConfigPomodoro();
    if (pomodoroAtivo && tempoRestantePomodoro > 0) {
      intervalRefPomodoro.current = setInterval(() => { setTempoRestantePomodoro(tempo => Math.max(0, tempo - 1)); }, 1000);
    } else if (pomodoroAtivo && tempoRestantePomodoro === 0) {
      if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
      setPomodoroAtivo(false); 
      tocarSom(audioRefPomodoro.current, "Fim do Pomodoro");
      if (cicloAtualPomodoro === 'FOCO') {
        const novosCiclos = ciclosCompletos + 1;
        setCiclosCompletos(novosCiclos);
        setDados(prev => {
          const dProgresso = prev.progresso || dadosIniciaisGlobais.current.progresso;
          const novosDadosProgresso = { ...dProgresso };
          novosDadosProgresso.totalPomodorosFocoCompletos = (novosDadosProgresso.totalPomodorosFocoCompletos || 0) + 1;
          return { ...prev, progresso: novosDadosProgresso };
        });
        toast.success("💪 Sessão de Foco Concluída!", { description: "Hora de uma pausa." });
        if (novosCiclos > 0 && novosCiclos % confPomo.ciclosAtePausaLonga === 0) {
          setCicloAtualPomodoro('PAUSA_LONGA'); setTempoRestantePomodoro(confPomo.duracaoPausaLongaMin * 60);
        } else {
          setCicloAtualPomodoro('PAUSA_CURTA'); setTempoRestantePomodoro(confPomo.duracaoPausaCurtaMin * 60);
        }
      } else { 
        toast.info("🧘 Pausa Concluída!", { description: "De volta ao foco!" });
        setCicloAtualPomodoro('FOCO'); setTempoRestantePomodoro(confPomo.duracaoFocoMin * 60);
      }
    }
    return () => { if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current); };
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
    if (cicloAtualPomodoro === 'FOCO') setTempoRestantePomodoro(confPomo.duracaoFocoMin * 60);
    else if (cicloAtualPomodoro === 'PAUSA_CURTA') setTempoRestantePomodoro(confPomo.duracaoPausaCurtaMin * 60);
    else if (cicloAtualPomodoro === 'PAUSA_LONGA') setTempoRestantePomodoro(confPomo.duracaoPausaLongaMin * 60);
    setCiclosCompletos(0); // Reseta o contador de ciclos da sessão
  }, [cicloAtualPomodoro, getConfigPomodoro]);

  const atualizarConfigPomodoro = useCallback((novasConfigs: Partial<ConfigPomodoro>): void => {
    setDados(prev => {
      const confExistente = prev.configPomodoro || getConfigPomodoro();
      const configPomodoroAtualizada = { ...confExistente, ...novasConfigs };
      if (!pomodoroAtivo) {
        if (cicloAtualPomodoro === 'FOCO') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoFocoMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_CURTA') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoPausaCurtaMin * 60);
        else if (cicloAtualPomodoro === 'PAUSA_LONGA') setTempoRestantePomodoro(configPomodoroAtualizada.duracaoPausaLongaMin * 60);
      }
      return { ...prev, configPomodoro: configPomodoroAtualizada };
    });
    toast.success("Configurações do Pomodoro salvas!");
  }, [pomodoroAtivo, cicloAtualPomodoro, getConfigPomodoro]);
  
  const concluirTarefa = useCallback((tarefaParaConcluir: Tarefa): void => {
    const todasSubTarefasConcluidas = tarefaParaConcluir.subTarefas?.every(st => st.completada) ?? true;
    if (!todasSubTarefasConcluidas && (tarefaParaConcluir.subTarefas?.length || 0) > 0) {
        toast.error("Conclua todas as sub-tarefas primeiro.", {
            description: "Ou remova as sub-tarefas pendentes para concluir a tarefa principal."
        });
        return;
    }
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const { categoriaId } = tarefaParaConcluir;
      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) { // Garante que tarefas[categoriaId] existe
        const index = novosDados.tarefas[categoriaId].findIndex(t => t.id === tarefaParaConcluir.id);
        if (index > -1) {
          const [tarefaRemovida] = novosDados.tarefas[categoriaId].splice(index, 1);
          if (novosDados.progresso) {
            novosDados.progresso.totalTarefasConcluidas = (novosDados.progresso.totalTarefasConcluidas || 0) + 1;
            if (novosDados.progresso.tarefasConcluidasPorCategoria && typeof novosDados.progresso.tarefasConcluidasPorCategoria === 'object') {
                novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] = (novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] || 0) + 1;
            } else if (novosDados.progresso) { // Garante que tarefasConcluidasPorCategoria existe
                novosDados.progresso.tarefasConcluidasPorCategoria = { [categoriaId]: 1 };
            }
            novosDados.progresso.ultimaTarefaConcluida = new Date();
          }
          if(tarefaRemovida){
            const tarefaConcluidaObj: TarefaConcluida = { ...tarefaRemovida, concluidaEm: new Date() };
            novosDados.tarefasConcluidas = [...(novosDados.tarefasConcluidas || []), tarefaConcluidaObj];
          }
        }
      }
      return novosDados;
    });
  }, []);

  const adicionarTarefa = useCallback((categoriaIdSelecionada: string, alarme?: string, textoParam?: string, subTarefasIniciais?: SubTarefa[]): string | undefined => {
    const textoFinalDaTarefa = textoParam || textoNovaTarefa;
    if (textoFinalDaTarefa.trim() === "") { if(!textoParam) toast.error("O texto da tarefa não pode estar vazio."); return undefined; }
    if (!categoriaIdSelecionada || !dados.categorias || !dados.categorias[categoriaIdSelecionada]) { if(!textoParam) toast.error("Por favor, selecione uma categoria válida."); return undefined; }
    const novaTarefa: Tarefa = {
      id: `tarefa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      texto: textoFinalDaTarefa, categoriaId: categoriaIdSelecionada, criadaEm: new Date(), completada: false,
      alarme: alarme ? new Date(alarme) : undefined, 
      subTarefas: subTarefasIniciais || [],
    };
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (!novosDados.tarefas[novaTarefa.categoriaId] || !Array.isArray(novosDados.tarefas[novaTarefa.categoriaId])) { 
        novosDados.tarefas[novaTarefa.categoriaId] = []; 
      }
      novosDados.tarefas[novaTarefa.categoriaId]?.unshift(novaTarefa); 
      return novosDados;
    });
    const categoriaInfo = dados.categorias[categoriaIdSelecionada];
    if(!textoParam){ 
        toast.success(`Tarefa "${textoFinalDaTarefa}" adicionada na categoria ${categoriaInfo?.nome || categoriaIdSelecionada}!`);
        setTextoNovaTarefa(''); setAlarmeNovaTarefa('');
    }
    return novaTarefa.id;
  }, [textoNovaTarefa, alarmeNovaTarefa, dados.categorias, setTextoNovaTarefa, setAlarmeNovaTarefa]);

  const editarTarefa = useCallback((tarefaId: string, categoriaIdOriginal: string, novosDadosTarefa: Partial<Omit<Tarefa, 'id' | 'criadaEm'>>): void => {
    setDados(prev => {
      const dadosAtualizados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      let categoriaOriginalReal = categoriaIdOriginal; 
      const categoriaAlvoId = novosDadosTarefa.categoriaId || categoriaOriginalReal;
      let tarefaOriginal: Tarefa | undefined;
      let indexOriginal = -1;
      let listaDaCategoriaOriginalReal = dadosAtualizados.tarefas[categoriaOriginalReal];

      if (listaDaCategoriaOriginalReal) {
        indexOriginal = listaDaCategoriaOriginalReal.findIndex(t => t.id === tarefaId);
        if (indexOriginal > -1) { tarefaOriginal = listaDaCategoriaOriginalReal[indexOriginal]; }
      }
      if (!tarefaOriginal) {
        for (const catId of Object.keys(dadosAtualizados.tarefas)) {
            if (catId === categoriaOriginalReal && listaDaCategoriaOriginalReal && indexOriginal > -1) continue; 
            const tarefasDaCat = dadosAtualizados.tarefas[catId] || [];
            const idx = tarefasDaCat.findIndex(t => t.id === tarefaId);
            if (idx > -1) {
                tarefaOriginal = tarefasDaCat[idx]; categoriaOriginalReal = catId; 
                listaDaCategoriaOriginalReal = tarefasDaCat; indexOriginal = idx;
                break;
            }
        }
      }
      if (!tarefaOriginal) { toast.error("Erro: Tarefa não encontrada para editar."); return prev; }

      if (novosDadosTarefa.categoriaId && novosDadosTarefa.categoriaId !== categoriaOriginalReal) {
        if(listaDaCategoriaOriginalReal && indexOriginal > -1) { 
            listaDaCategoriaOriginalReal.splice(indexOriginal, 1); 
        } else if (dadosAtualizados.tarefas[categoriaOriginalReal]) {
             dadosAtualizados.tarefas[categoriaOriginalReal] = (dadosAtualizados.tarefas[categoriaOriginalReal] || []).filter(t => t.id !== tarefaId);
        }
      }
      const tarefaAtualizada: Tarefa = {
        ...tarefaOriginal, ...novosDadosTarefa, 
        alarme: novosDadosTarefa.alarme ? new Date(novosDadosTarefa.alarme) : undefined,
        subTarefas: Array.isArray(novosDadosTarefa.subTarefas) ? novosDadosTarefa.subTarefas : (tarefaOriginal.subTarefas || []),
      };
      if (!dadosAtualizados.tarefas[categoriaAlvoId]) { dadosAtualizados.tarefas[categoriaAlvoId] = []; }
      const indexNaCategoriaAlvo = dadosAtualizados.tarefas[categoriaAlvoId].findIndex(t => t.id === tarefaId);
      if (indexNaCategoriaAlvo > -1) { 
        dadosAtualizados.tarefas[categoriaAlvoId][indexNaCategoriaAlvo] = tarefaAtualizada;
      } else { 
        if (categoriaAlvoId === categoriaOriginalReal && indexNaCategoriaAlvo === -1 && dadosAtualizados.tarefas[categoriaOriginalReal]) {
             dadosAtualizados.tarefas[categoriaOriginalReal] = dadosAtualizados.tarefas[categoriaOriginalReal].filter(t => t.id !== tarefaId);
        }
        dadosAtualizados.tarefas[categoriaAlvoId].unshift(tarefaAtualizada);
      }
      toast.success("Tarefa atualizada!");
      return dadosAtualizados;
    });
  }, []);

  const excluirTarefa = useCallback((tarefaId: string, categoriaIdDaTarefa: string): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (novosDados.tarefas && novosDados.tarefas[categoriaIdDaTarefa]) {
        novosDados.tarefas[categoriaIdDaTarefa] = (novosDados.tarefas[categoriaIdDaTarefa] || []).filter(t => t.id !== tarefaId);
      }
      return novosDados;
    });
    toast.error("Tarefa excluída!");
  }, []);

  const adicionarNovaCategoria = useCallback((nome: string, emoji: string, cor: string): string | undefined => {
    if (nome.trim() === "" ) { toast.error("O nome da categoria é obrigatório."); return undefined; }
    const categoriasAtuais = dados.categorias ? Object.values(dados.categorias) : [];
    const nomeExistente = categoriasAtuais.find( (cat: Categoria) => cat.nome.toLowerCase() === nome.toLowerCase() );
    if (nomeExistente) { toast.info(`Categoria "${nome}" já existe, usando a existente.`); return nomeExistente.id; }
    const novoIdCategoria = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const novaCategoria: Categoria = { id: novoIdCategoria, nome, emoji: emoji || '📁', cor: cor || '#718096', };
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      novosDados.categorias = { ...(novosDados.categorias || {}), [novoIdCategoria]: novaCategoria };
      if (novosDados.tarefas && typeof novosDados.tarefas === 'object' && novosDados.tarefas[novaCategoria.id] === undefined) {
          novosDados.tarefas[novaCategoria.id] = [];
      }
      return novosDados;
    });
    toast.success(`Categoria "${nome}" adicionada!`);
    return novoIdCategoria;
  }, [dados.categorias]);

  const editarCategoria = useCallback((categoriaId: string, novosDetalhes: Partial<Omit<Categoria, 'id'>>): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (novosDados.categorias && novosDados.categorias[categoriaId]) {
        if (novosDetalhes.nome && novosDetalhes.nome.trim() !== "") {
            const nomeExistenteEmOutra = Object.values(novosDados.categorias).find(
                cat => cat.id !== categoriaId && cat.nome.toLowerCase() === novosDetalhes.nome!.toLowerCase()
            );
            if (nomeExistenteEmOutra) {
                toast.error(`O nome de categoria "${novosDetalhes.nome}" já está em uso.`);
                return prev; 
            }
        }
        novosDados.categorias[categoriaId] = { ...novosDados.categorias[categoriaId], ...novosDetalhes, };
        toast.success(`Categoria "${novosDados.categorias[categoriaId].nome}" atualizada!`);
      } else { toast.error("Categoria não encontrada para edição."); }
      return novosDados;
    });
  }, []);

  const excluirCategoria = useCallback((categoriaIdParaExcluir: string): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      novosDados.progresso = prev.progresso || { ...dadosIniciaisGlobais.current.progresso };
      novosDados.progresso.tarefasConcluidasPorCategoria = novosDados.progresso.tarefasConcluidasPorCategoria || {};
      if (novosDados.categorias) { delete novosDados.categorias[categoriaIdParaExcluir]; }
      if (novosDados.tarefas) { delete novosDados.tarefas[categoriaIdParaExcluir]; }
      if (novosDados.tarefasConcluidas) {
        novosDados.tarefasConcluidas = (novosDados.tarefasConcluidas || []).filter( tc => tc.categoriaId !== categoriaIdParaExcluir );
      }
      if (novosDados.progresso.tarefasConcluidasPorCategoria) {
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
  }, [getConfigPomodoro]);

  const obterTotalTarefas = useCallback((): number => {
    if (!dados || !dados.tarefas || typeof dados.tarefas !== 'object') return 0;
    return (Object.keys(dados.tarefas)).reduce((total, key) => {
        const tarefasDaCategoria = dados.tarefas[key];
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

  const adicionarSubTarefa = useCallback((tarefaPaiId: string, categoriaId: string, textoSubTarefa: string): void => {
    if (textoSubTarefa.trim() === "") { toast.error("Sub-tarefa não pode ser vazia."); return; }
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) {
        const tarefaPaiIndex = novosDados.tarefas[categoriaId].findIndex(t => t.id === tarefaPaiId);
        if (tarefaPaiIndex > -1) {
          const tarefaPai = novosDados.tarefas[categoriaId][tarefaPaiIndex];
          const novaSub: SubTarefa = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            texto: textoSubTarefa, completada: false,
          };
          tarefaPai.subTarefas = [...(tarefaPai.subTarefas || []), novaSub];
          // toast.success("Sub-tarefa adicionada!"); // Removido para não poluir com muitos toasts em lote
        } else { console.error("Tarefa pai não encontrada para adicionar sub-tarefa"); }
      }
      return novosDados;
    });
  }, []);

  const alternarCompletarSubTarefa = useCallback((tarefaPaiId: string, categoriaId: string, subTarefaId: string): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) {
        const tarefaPaiIndex = novosDados.tarefas[categoriaId].findIndex(t => t.id === tarefaPaiId);
        if (tarefaPaiIndex > -1 && novosDados.tarefas[categoriaId][tarefaPaiIndex].subTarefas) {
          const subTarefas = novosDados.tarefas[categoriaId][tarefaPaiIndex].subTarefas!;
          const subTarefaIndex = subTarefas.findIndex(st => st.id === subTarefaId);
          if (subTarefaIndex > -1) {
            subTarefas[subTarefaIndex].completada = !subTarefas[subTarefaIndex].completada;
          }
        }
      }
      return novosDados;
    });
  }, []);

  const excluirSubTarefa = useCallback((tarefaPaiId: string, categoriaId: string, subTarefaId: string): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      if (novosDados.tarefas && novosDados.tarefas[categoriaId]) {
        const tarefaPaiIndex = novosDados.tarefas[categoriaId].findIndex(t => t.id === tarefaPaiId);
        if (tarefaPaiIndex > -1 && novosDados.tarefas[categoriaId][tarefaPaiIndex].subTarefas) {
          novosDados.tarefas[categoriaId][tarefaPaiIndex].subTarefas = 
            (novosDados.tarefas[categoriaId][tarefaPaiIndex].subTarefas || []).filter(st => st.id !== subTarefaId);
          toast.error("Sub-tarefa excluída.");
        }
      }
      return novosDados;
    });
  }, []);

  return {
    dados, carregando, concluirTarefa, adicionarTarefa, excluirTarefa, editarTarefa,
    adicionarNovaCategoria, excluirCategoria, editarCategoria, 
    resetar: resetarGeral, 
    obterTotalTarefas, obterTarefasHoje, jaConcluidoHoje, 
    textoNovaTarefa, setTextoNovaTarefa, alarmeNovaTarefa, setAlarmeNovaTarefa,
    tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, ciclosCompletos, 
    iniciarOuPausarPomodoro, resetarPomodoro: resetarCicloPomodoro, 
    atualizarConfigPomodoro, configPomodoro: getConfigPomodoro(),
    adicionarSubTarefa, alternarCompletarSubTarefa, excluirSubTarefa,
  };
}