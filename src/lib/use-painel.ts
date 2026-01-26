// src/lib/use-painel.ts
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type { DadosApp, Tarefa, TarefaConcluida, Categoria, ConfigPomodoro, SubTarefa, Gasto, Receita, CategoriaGasto } from './types';
import { carregarDados, salvarDados, resetarDados } from './armazenamento';
import { obterDadosIniciais } from './dados-iniciais';
import { authService } from './auth';
import WidgetSync from './widget-sync';
import { agendarNotificacao, cancelarNotificacao } from './notifications';
import { criarEventoCalendario } from './calendar';

// Tipos da IA, agora o hook também entende eles
export interface IaParsedTask {
  textoTarefa: string;
  dataHora?: string | null;
  subTarefas?: string[];
}
export interface IaParsedCategory {
  nomeCategoria: string;
  tarefas: IaParsedTask[];
}

// Emojis sugeridos para categorias criadas automaticamente pela IA
const EMOJIS_SUGERIDOS = [
  "📚", "📝", "💼", "🏠", "🛒", "🎯", "🧹", "💡", "📅", "🕒", "🧑‍💻", "📈", "🛠️", "🎓", "🏃‍♂️", "🍎", "🎵", "🧘", "🚀", "🌟"
];

type TipoCicloPomodoro = 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';

export function usePainel() {
  const dadosIniciaisGlobais = useRef(obterDadosIniciais());
  const [dados, setDados] = useState<DadosApp>(() => carregarDados());
  const [carregando, setCarregando] = useState(false); // Mudado para false
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
    if (typeof window !== 'undefined') {
        audioRefPomodoro.current = new Audio('/pomodoro_fim.mp3');
        audioRefAlarmeTarefa.current = new Audio('/alarme.mp3');
    }
  }, []); 

  useEffect(() => { 
    if (!carregando) { 
      salvarDados(dados); 
      // Sincronizar com o widget Android
      if (typeof window !== 'undefined') {
        WidgetSync.getInstance().updateWidget(Object.values(dados.tarefas || {}).flat());
      }
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
                  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                    new Notification("Alarme de Tarefa!", { body: `Hora de fazer: ${tarefa.texto}`, icon: "/icon-192x192.png", tag: tarefa.id });
                    tocarSom(audioRefAlarmeTarefa.current, "Alarme de Tarefa");
                    if (!algumaNotificacaoMostradaParaToast) { toast.info(`🔔 Alarme: ${tarefa.texto}`); algumaNotificacaoMostradaParaToast = true; }
                  } else if (typeof Notification !== 'undefined' && Notification.permission !== "denied") {
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
    setCiclosCompletos(0);
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
        toast.error("Conclua todas as sub-tarefas primeiro.", { description: "Ou remova as sub-tarefas pendentes para concluir a tarefa principal." });
        return;
    }
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const { categoriaId } = tarefaParaConcluir;
      if (novosDados.tarefas[categoriaId]) {
        const index = novosDados.tarefas[categoriaId].findIndex(t => t.id === tarefaParaConcluir.id);
        if (index > -1) {
          const [tarefaRemovida] = novosDados.tarefas[categoriaId].splice(index, 1);
          if (novosDados.progresso) {
            novosDados.progresso.totalTarefasConcluidas = (novosDados.progresso.totalTarefasConcluidas || 0) + 1;
            if (novosDados.progresso.tarefasConcluidasPorCategoria && typeof novosDados.progresso.tarefasConcluidasPorCategoria === 'object') {
                novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] = (novosDados.progresso.tarefasConcluidasPorCategoria[categoriaId] || 0) + 1;
            } else if (novosDados.progresso) {
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
    // Agendar notificação no Android via Capacitor
    if (novaTarefa.alarme) {
      const numId = Math.abs([...novaTarefa.id].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)) % 2147483647;
      agendarNotificacao(numId, 'Alarme de Tarefa', `Hora de fazer: ${novaTarefa.texto}`, new Date(novaTarefa.alarme));
      criarEventoCalendario(novaTarefa.texto, undefined, 'Tarefa do Painel', new Date(novaTarefa.alarme));
    }
    const categoriaInfo = dados.categorias[categoriaIdSelecionada];
    if(!textoParam){ 
        toast.success(`Tarefa "${textoFinalDaTarefa}" adicionada na categoria ${categoriaInfo?.nome || categoriaIdSelecionada}!`);
        setTextoNovaTarefa(''); setAlarmeNovaTarefa('');
    }
    return novaTarefa.id;
  }, [textoNovaTarefa, dados.categorias, setTextoNovaTarefa, setAlarmeNovaTarefa]);

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
      if (!tarefaOriginal) { toast.error("Erro: Tarefa não encontrada."); return prev; }

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
      // Atualizar notificação se alarme mudou
      const numId = Math.abs([...tarefaId].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)) % 2147483647;
      cancelarNotificacao(numId);
      if (tarefaAtualizada.alarme) {
        agendarNotificacao(numId, 'Alarme de Tarefa', `Hora de fazer: ${tarefaAtualizada.texto}`, new Date(tarefaAtualizada.alarme));
        criarEventoCalendario(tarefaAtualizada.texto, undefined, 'Tarefa do Painel (atualizada)', new Date(tarefaAtualizada.alarme));
      }
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
    // Limpa tarefas e categorias, MAS preserva progresso/XP e configurações
    setDados(prev => {
      const progresso = prev.progresso || dadosIniciaisGlobais.current.progresso;
      const config = prev.configPomodoro || dadosIniciaisGlobais.current.configPomodoro;
      const dadosReset: DadosApp = {
        categorias: {},
        tarefas: {},
        tarefasConcluidas: prev.tarefasConcluidas || [],
        progresso,
        configPomodoro: config,
      };
      return dadosReset;
    });
    if (intervalRefPomodoro.current) clearInterval(intervalRefPomodoro.current);
    setPomodoroAtivo(false);
    setCicloAtualPomodoro('FOCO');
    const configPomoReset = getConfigPomodoro();
    setTempoRestantePomodoro(configPomoReset.duracaoFocoMin * 60);
    setCiclosCompletos(0);
    toast.success("Painel resetado!", { description: "Tarefas e categorias limpas. XP e progresso preservados." });
  }, [getConfigPomodoro]);

  const obterTotalTarefas = useCallback((): number => {
    if (!dados || !dados.tarefas || typeof dados.tarefas !== 'object') return 0;
    return (Object.values(dados.tarefas)).reduce((total, tarefasDaCategoria) => total + (Array.isArray(tarefasDaCategoria) ? tarefasDaCategoria.length : 0), 0);
  }, [dados]);

  const obterTarefasHoje = useCallback((): TarefaConcluida[] => {
    const hoje = new Date();
    if (!dados || !Array.isArray(dados.tarefasConcluidas)) return [];
    return dados.tarefasConcluidas.filter(tarefa => {
      if (!tarefa.concluidaEm) return false;
      const dataTarefa = new Date(tarefa.concluidaEm);
      return hoje.toDateString() === dataTarefa.toDateString();
    });
  }, [dados]);

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
        } else { console.error("Tarefa pai não encontrada para adicionar sub-tarefa", {tarefaPaiId, categoriaId}); }
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
            const novoEstado = !subTarefas[subTarefaIndex].completada;
            subTarefas[subTarefaIndex].completada = novoEstado;
            // Atualiza progresso de subtarefas concluídas para XP
            const prog = novosDados.progresso || dadosIniciaisGlobais.current.progresso;
            const atual = prog.totalSubTarefasConcluidas || 0;
            prog.totalSubTarefasConcluidas = novoEstado ? atual + 1 : Math.max(0, atual - 1);
            novosDados.progresso = prog;
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
  
  // --- NOVA FUNÇÃO ATÔMICA PARA PROCESSAR O LOTE DA IA ---
  const adicionarLoteDeDadosIA = useCallback((lote: IaParsedCategory[]): { tarefas: number, subtarefas: number, categorias: number } => {
    const contadores = { tarefas: 0, subtarefas: 0, categorias: 0 };

    setDados(prevDados => {
        const novosDados = JSON.parse(JSON.stringify(prevDados)) as DadosApp;
        // Garante que categorias e tarefas existam
        novosDados.categorias = novosDados.categorias || {};
        novosDados.tarefas = novosDados.tarefas || {};

        const categoriasExistentesPorNome = Object.values(novosDados.categorias).reduce((acc, cat) => {
            acc[cat.nome.toLowerCase()] = cat;
            return acc;
        }, {} as Record<string, Categoria>);

        for (const itemCategoria of lote) {
            let categoriaFinal: Categoria | undefined;
            const nomeCategoriaLimpo = itemCategoria.nomeCategoria.trim();
            
            categoriaFinal = categoriasExistentesPorNome[nomeCategoriaLimpo.toLowerCase()];

            if (!categoriaFinal) {
                contadores.categorias++;
                const emojiPadraoCat = EMOJIS_SUGERIDOS[Math.floor(Math.random() * EMOJIS_SUGERIDOS.length)];
                const corPadraoCat = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                const novoIdCategoria = `cat_ia_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                categoriaFinal = { 
                    id: novoIdCategoria, 
                    nome: nomeCategoriaLimpo, 
                    emoji: emojiPadraoCat, 
                    cor: corPadraoCat 
                };
                novosDados.categorias[categoriaFinal.id] = categoriaFinal;
                categoriasExistentesPorNome[nomeCategoriaLimpo.toLowerCase()] = categoriaFinal; // Atualiza o lookup
                novosDados.tarefas[categoriaFinal.id] = [];
            }

            if (categoriaFinal) { // Garante que categoriaFinal foi definida
                for (const tarefaIA of itemCategoria.tarefas) {
                    if (tarefaIA.textoTarefa && typeof tarefaIA.textoTarefa === 'string' && tarefaIA.textoTarefa.trim() !== "") {
                        contadores.tarefas++;
                        const subTarefasParaCriar: SubTarefa[] = (tarefaIA.subTarefas || []).map(textoSub => {
                            contadores.subtarefas++;
                            return {
                                id: `sub_ia_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                                texto: textoSub.trim(),
                                completada: false,
                            };
                        }).filter(st => st.texto !== "");

                        const novaTarefa: Tarefa = {
                            id: `tarefa_ia_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                            texto: tarefaIA.textoTarefa.trim(),
                            alarme: tarefaIA.dataHora ? new Date(tarefaIA.dataHora) : undefined,
                            completada: false,
                            categoriaId: categoriaFinal.id,
                            criadaEm: new Date(),
                            subTarefas: subTarefasParaCriar,
                        };
                        // Adiciona no início da lista para aparecer no topo
                        novosDados.tarefas[categoriaFinal.id] = [novaTarefa, ...(novosDados.tarefas[categoriaFinal.id] || [])];
                    }
                }
            } else {
                console.warn(`Não foi possível processar a categoria: ${nomeCategoriaLimpo} da IA.`);
            }
        }
        return novosDados;
    });
    return contadores;
  }, []); // Removidas dependências que não são do hook (como 'dados')

  // ========== FUNÇÕES DE GASTOS ==========
  const adicionarGasto = useCallback((gasto: Gasto): void => {
    setDados((prev) => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [] };
      if (!financas.gastos) financas.gastos = [];
      (financas.gastos as Gasto[]).push(gasto);
      (novosDados as unknown as Record<string, unknown>).financas = financas;
      return novosDados;
    });
    toast.success('Gasto adicionado!', {
      description: `${gasto.descricao} - R$ ${gasto.valor.toFixed(2)}`,
    });
  }, []);

  const removerGasto = useCallback((gastoId: string): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [] };
      if (!financas.gastos) financas.gastos = [];
      const index = (financas.gastos as Gasto[]).findIndex((g: Gasto) => g.id === gastoId);
      if (index > -1) {
        (financas.gastos as Gasto[]).splice(index, 1);
        (novosDados as unknown as Record<string, unknown>).financas = financas;
        toast.success('Gasto removido!');
      }
      return novosDados;
    });
  }, []);

  const atualizarGasto = useCallback((gastoAtualizado: Gasto): void => {
    setDados(prev => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [] };
      if (!financas.gastos) financas.gastos = [];
      const index = (financas.gastos as Gasto[]).findIndex((g: Gasto) => g.id === gastoAtualizado.id);
      if (index > -1) {
        (financas.gastos as Gasto[])[index] = { ...(financas.gastos as Gasto[])[index], ...gastoAtualizado };
      } else {
        (financas.gastos as Gasto[]).push(gastoAtualizado);
      }
      (novosDados as unknown as Record<string, unknown>).financas = financas;
      return novosDados;
    });
    toast.success('Gasto atualizado!');
  }, []);

  const obterGastos = useCallback((): Gasto[] => {
    const financas = (dados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [] };
    return (financas.gastos as Gasto[]) || [];
  }, [dados]);

  // ========== FUNÇÕES DE RECEITA ==========
  const adicionarReceita = useCallback((receita: Receita): void => {
    setDados((prev) => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [], receitas: [] };
      if (!financas.receitas) financas.receitas = [];
      (financas.receitas as Receita[]).push(receita);
      (novosDados as unknown as Record<string, unknown>).financas = financas;
      return novosDados;
    });
    toast.success('Receita adicionada!', {
      description: `${receita.descricao} - R$ ${receita.valor.toFixed(2)}`,
    });
  }, []);

  const removerReceita = useCallback((receitaId: string): void => {
    setDados((prev) => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [], receitas: [] };
      if (!financas.receitas) financas.receitas = [];
      const index = (financas.receitas as Receita[]).findIndex((r: Receita) => r.id === receitaId);
      if (index > -1) {
        (financas.receitas as Receita[]).splice(index, 1);
        (novosDados as unknown as Record<string, unknown>).financas = financas;
        toast.success('Receita removida!');
      }
      return novosDados;
    });
  }, []);

  const obterReceitas = useCallback((): Receita[] => {
    const financas = (dados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], receitas: [] };
    return (financas.receitas as Receita[]) || [];
  }, [dados]);

  // ========== FUNÇÕES DE CATEGORIAS DE GASTOS ==========
  const CATEGORIAS_PADRAO_GASTOS: CategoriaGasto[] = useMemo(() => ([
    { id: 'cat_alim', nome: 'Alimentação', emoji: '🍕', cor: '#FF6B6B', tipo: 'gasto' },
    { id: 'cat_transp', nome: 'Transporte', emoji: '🚗', cor: '#4ECDC4', tipo: 'gasto' },
    { id: 'cat_saude', nome: 'Saúde', emoji: '⚕️', cor: '#45B7D1', tipo: 'gasto' },
    { id: 'cat_edu', nome: 'Educação', emoji: '📚', cor: '#FFA07A', tipo: 'gasto' },
    { id: 'cat_div', nome: 'Diversão', emoji: '🎮', cor: '#98D8C8', tipo: 'gasto' },
    { id: 'cat_morad', nome: 'Moradia', emoji: '🏠', cor: '#F7DC6F', tipo: 'gasto' },
    { id: 'cat_util', nome: 'Utilidades', emoji: '💡', cor: '#BB8FCE', tipo: 'gasto' },
    { id: 'cat_trab', nome: 'Trabalho', emoji: '💼', cor: '#85C1E2', tipo: 'gasto' },
    { id: 'cat_rec_salario', nome: 'Salário', emoji: '💰', cor: '#00B894', tipo: 'receita' },
    { id: 'cat_rec_freelance', nome: 'Freelance', emoji: '💻', cor: '#00D2D3', tipo: 'receita' },
    { id: 'cat_rec_investimento', nome: 'Investimento', emoji: '📈', cor: '#A29BFE', tipo: 'receita' },
  ]), []);

  const obterCategoriasGastos = useCallback((): CategoriaGasto[] => {
    const financas = (dados as unknown as Record<string, unknown>).financas as Record<string, unknown> || {};
    if (financas.categoriasGastos && Array.isArray(financas.categoriasGastos)) {
      return financas.categoriasGastos as CategoriaGasto[];
    }
    return CATEGORIAS_PADRAO_GASTOS;
  }, [dados, CATEGORIAS_PADRAO_GASTOS]);

  const adicionarCategoriaGasto = useCallback((categoria: CategoriaGasto): void => {
    setDados((prev) => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || { transacoes: [], gastos: [], receitas: [], categoriasGastos: [] };
      if (!financas.categoriasGastos) financas.categoriasGastos = [];
      
      // Não adicionar duplicada
      if ((financas.categoriasGastos as CategoriaGasto[]).some((c: CategoriaGasto) => c.nome.toLowerCase() === categoria.nome.toLowerCase())) {
        toast.error('Categoria já existe!');
        return prev;
      }
      
      (financas.categoriasGastos as CategoriaGasto[]).push(categoria);
      (novosDados as unknown as Record<string, unknown>).financas = financas;
      return novosDados;
    });
    toast.success('Categoria adicionada!', {
      description: `${categoria.emoji} ${categoria.nome}`,
    });
  }, []);

  const removerCategoriaGasto = useCallback((categoriaId: string): void => {
    setDados((prev) => {
      const novosDados = JSON.parse(JSON.stringify(prev)) as DadosApp;
      const financas = (novosDados as unknown as Record<string, unknown>).financas as Record<string, unknown> || {};
      if (!financas.categoriasGastos) financas.categoriasGastos = [];
      
      const index = (financas.categoriasGastos as CategoriaGasto[]).findIndex((c: CategoriaGasto) => c.id === categoriaId);
      if (index > -1 && !CATEGORIAS_PADRAO_GASTOS.some(cp => cp.id === categoriaId)) {
        (financas.categoriasGastos as CategoriaGasto[]).splice(index, 1);
        (novosDados as unknown as Record<string, unknown>).financas = financas;
        toast.success('Categoria removida!');
      } else {
        toast.error('Não pode remover categorias padrão!');
      }
      return novosDados;
    });
  }, [CATEGORIAS_PADRAO_GASTOS]);

  return {
    dados, carregando, usuario: authService.obterUsuarioLogado(), concluirTarefa, adicionarTarefa, excluirTarefa, editarTarefa,
    adicionarNovaCategoria, excluirCategoria, editarCategoria, 
    resetarGeralDoHook: resetarGeral, 
    obterTotalTarefas, obterTarefasHoje, jaConcluidoHoje, 
    textoNovaTarefa, setTextoNovaTarefa, alarmeNovaTarefa, setAlarmeNovaTarefa,
    tempoRestantePomodoro, pomodoroAtivo, cicloAtualPomodoro, ciclosCompletos, 
    iniciarOuPausarPomodoro, resetarCicloPomodoro: resetarCicloPomodoro, 
    atualizarConfigPomodoro, configPomodoro: getConfigPomodoro(),
    adicionarSubTarefa, alternarCompletarSubTarefa, excluirSubTarefa,
    adicionarLoteDeDadosIA,
    adicionarGasto,
    removerGasto,
    atualizarGasto,
    obterGastos,
    adicionarReceita,
    removerReceita,
    obterReceitas,
    obterCategoriasGastos,
    adicionarCategoriaGasto,
    removerCategoriaGasto,
    handleLogout: () => authService.logout()
  };
}