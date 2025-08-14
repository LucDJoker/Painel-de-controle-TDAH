'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RefreshCw, PlusCircle, Trash2, Edit3, Sun, Moon, Sparkles, X, Plus, SmilePlus } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme, SkinTones } from 'emoji-picker-react';

import { usePainel } from "@/lib/use-painel";
import { apiClient } from "@/lib/api-client";
import PainelTarefa from "@/components/painel-tarefa";
import { Estatisticas } from "@/components/estatisticas";
import { Parabens } from "@/components/parabens";
import { TimerPomodoro } from "@/components/timer-pomodoro";
import { CalendarioTarefas, type CalendarEvent } from "@/components/calendario-tarefas";
import type { Tarefa, Categoria as CategoriaInfo, ConfigPomodoro, SubTarefa } from "@/lib/types"; 

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Views, type View, type NavigateAction } from 'react-big-calendar';


const EMOJIS_SUGERIDOS = ['📁', '🏠', '🎓', '💼', '💪', '❤️', '🎉', '💡', '💰', '✈️', '🍽️', '📚', '🛠️', '✨', '🎯', '🤔', '😊', '🔥'];

interface IaParsedTask {
  textoTarefa: string;
  dataHora?: string | null; 
  subTarefas?: string[]; // Tornando opcional, e a IA deve retornar array vazio se não houver
}
interface IaParsedCategory {
  nomeCategoria: string;
  tarefas: IaParsedTask[];
}
type IaApiResponse = IaParsedCategory[] | { categorias?: IaParsedCategory[] };

export default function PaginaPrincipal() {
  const { setTheme, theme: currentTheme } = useTheme();
  const {
    dados, carregando, concluirTarefa, resetar: resetarGeralDoHook, obterTotalTarefas,
    jaConcluidoHoje, textoNovaTarefa, setTextoNovaTarefa, adicionarTarefa,
    excluirTarefa, editarTarefa, adicionarNovaCategoria, excluirCategoria, editarCategoria,
    alarmeNovaTarefa, setAlarmeNovaTarefa, tempoRestantePomodoro, pomodoroAtivo,
    cicloAtualPomodoro, ciclosCompletos, iniciarOuPausarPomodoro,
    resetarPomodoro: resetarCicloPomodoro, atualizarConfigPomodoro, configPomodoro,
    adicionarSubTarefa, alternarCompletarSubTarefa, excluirSubTarefa,
    adicionarLoteDeDadosIA // Adicionando para usar a função do hook
  } = usePainel();

  const [tarefaConcluidaTexto, setTarefaConcluidaTexto] = useState<string>('');
  const [mostrarParabensIndividual, setMostrarParabensIndividual] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(''); 
  
  const [nomeNovaCat, setNomeNovaCat] = useState('');
  const [emojiNovaCat, setEmojiNovaCat] = useState(EMOJIS_SUGERIDOS[0]);
  const [corNovaCat, setCorNovaCat] = useState('#718096');
  const [openEmojiPickerNovaCat, setOpenEmojiPickerNovaCat] = useState(false);

  const [tarefaParaEditar, setTarefaParaEditar] = useState<Tarefa | null>(null);
  const [textoEdicaoTarefa, setTextoEdicaoTarefa] = useState('');
  const [categoriaEdicaoTarefa, setCategoriaEdicaoTarefa] = useState<string>('');
  const [alarmeEdicaoTarefa, setAlarmeEdicaoTarefa] = useState<string>('');
  const [subTarefasEdicao, setSubTarefasEdicao] = useState<SubTarefa[]>([]); 
  const [textoNovaSubTarefaEdicao, setTextoNovaSubTarefaEdicao] = useState('');
  const [mostrarModalEdicaoTarefa, setMostrarModalEdicaoTarefa] = useState(false);

  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaInfo | null>(null);
  const [nomeEdicaoCat, setNomeEdicaoCat] = useState('');
  const [emojiEdicaoCat, setEmojiEdicaoCat] = useState('');
  const [corEdicaoCat, setCorEdicaoCat] = useState('#718096');
  const [mostrarModalEdicaoCategoria, setMostrarModalEdicaoCategoria] = useState(false);
  const [openEmojiPickerEdicaoCat, setOpenEmojiPickerEdicaoCat] = useState(false);

  const [textoEmLoteParaIA, setTextoEmLoteParaIA] = useState<string>('');
  const [processandoLoteComIA, setProcessandoLoteComIA] = useState(false);
  
  const [dataAtualCalendario, setDataAtualCalendario] = useState(new Date());
  const [visualizacaoAtualCalendario, setVisualizacaoAtualCalendario] = useState<View>(Views.MONTH);


  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!dados || !dados.tarefas || typeof dados.tarefas !== 'object' || !dados.categorias) return [];
    const events: CalendarEvent[] = [];
    for (const categoriaId of Object.keys(dados.tarefas)) {
      const tarefasDaCategoria = dados.tarefas[categoriaId] || [];
      for (const tarefa of tarefasDaCategoria) {
        if (tarefa.alarme) {
          const startDate = new Date(tarefa.alarme);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
            const categoriaInfo = dados.categorias[tarefa.categoriaId];
            events.push({ 
              title: tarefa.texto, 
              start: startDate, 
              end: endDate, 
              resource: { ...tarefa, categoriaInfo: categoriaInfo } 
            });
          }
        }
      }
    }
    return events;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.tarefas, dados.categorias]); 

  const totalTarefasAtivas = obterTotalTarefas();
  const venceuPeloMenosUmaHoje = jaConcluidoHoje();
  const todasTarefasDoPainelConcluidas = !carregando && totalTarefasAtivas === 0 && dados.categorias && Object.keys(dados.categorias).length > 0 && (dados.progresso?.totalTarefasConcluidas || 0) > 0;
  
  const handleAbrirModalEditarTarefa = useCallback((tarefa: Tarefa):void => {
    setTarefaParaEditar(tarefa);
    setTextoEdicaoTarefa(tarefa.texto);
    setCategoriaEdicaoTarefa(tarefa.categoriaId);
    setSubTarefasEdicao(tarefa.subTarefas ? [...tarefa.subTarefas] : []);
    if (tarefa.alarme) {
        const dataAlarme = new Date(tarefa.alarme);
        if (!isNaN(dataAlarme.getTime())) {
            const offset = dataAlarme.getTimezoneOffset() * 60000;
            const dataLocal = new Date(dataAlarme.getTime() - offset);
            setAlarmeEdicaoTarefa(dataLocal.toISOString().slice(0, 16));
        } else { setAlarmeEdicaoTarefa(''); }
    } else { setAlarmeEdicaoTarefa(''); }
    setMostrarModalEdicaoTarefa(true);
  }, []);

  const handleSalvarEdicaoTarefa = useCallback((): void => {
    if (!tarefaParaEditar) return;
    if (textoEdicaoTarefa.trim() === "") { toast.error("O texto da tarefa não pode ser vazio."); return; }
    if (!categoriaEdicaoTarefa) { toast.error("Por favor, selecione uma categoria."); return; }
    editarTarefa(tarefaParaEditar.id, tarefaParaEditar.categoriaId, {
      texto: textoEdicaoTarefa,
      categoriaId: categoriaEdicaoTarefa,
      alarme: alarmeEdicaoTarefa || undefined,
      subTarefas: subTarefasEdicao, 
    });
    setMostrarModalEdicaoTarefa(false); setTarefaParaEditar(null); setTextoNovaSubTarefaEdicao('');
  }, [tarefaParaEditar, textoEdicaoTarefa, categoriaEdicaoTarefa, alarmeEdicaoTarefa, subTarefasEdicao, editarTarefa]);
  
  const handleAdicionarSubTarefaEdicao = useCallback(():void => {
    if (!tarefaParaEditar || textoNovaSubTarefaEdicao.trim() === '') return;
    const novaSub: SubTarefa = { id: `sub_edit_${Date.now()}`, texto: textoNovaSubTarefaEdicao, completada: false };
    setSubTarefasEdicao(prev => [...prev, novaSub]);
    setTextoNovaSubTarefaEdicao('');
  }, [tarefaParaEditar, textoNovaSubTarefaEdicao]);

  const handleToggleSubTarefaEdicao = useCallback((subId: string):void => {
    setSubTarefasEdicao(prev => prev.map(sub => sub.id === subId ? {...sub, completada: !sub.completada} : sub));
  }, []);

  const handleExcluirSubTarefaEdicao = useCallback((subId: string):void => {
    setSubTarefasEdicao(prev => prev.filter(sub => sub.id !== subId));
  }, []);

  const handleAbrirModalEditarCategoria = useCallback((categoria: CategoriaInfo):void => {
    setCategoriaParaEditar(categoria);
    setNomeEdicaoCat(categoria.nome);
    setEmojiEdicaoCat(categoria.emoji);
    setCorEdicaoCat(categoria.cor);
    setMostrarModalEdicaoCategoria(true);
  }, []);

  const handleSalvarEdicaoCategoria = useCallback((): void => {
    if (!categoriaParaEditar) return;
    if (nomeEdicaoCat.trim() === "") { toast.error("O nome da categoria não pode ser vazio."); return; }
    editarCategoria(categoriaParaEditar.id, {
      nome: nomeEdicaoCat,
      emoji: emojiEdicaoCat || '📁',
      cor: corEdicaoCat || '#718096',
    });
    setMostrarModalEdicaoCategoria(false);
    setCategoriaParaEditar(null);
  }, [categoriaParaEditar, nomeEdicaoCat, emojiEdicaoCat, corEdicaoCat, editarCategoria]);

  const handleConcluirTarefa = useCallback((tarefa: Tarefa): void => {
    concluirTarefa(tarefa);
    setTarefaConcluidaTexto(tarefa.texto);
    setMostrarParabensIndividual(true);
    toast.success("🎉 Parabéns! Tarefa concluída!", {
      description: `"${tarefa.texto}" foi marcada como concluída!`,
      duration: 3000,
    });
    setTimeout(() => {
      setMostrarParabensIndividual(false);
      setTarefaConcluidaTexto('');
    }, 3000);
  }, [concluirTarefa]);

  const handleResetPainel = useCallback((): void => { 
    resetarGeralDoHook(); 
    toast.success("Painel resetado!", { 
      description: "Todas as tarefas e categorias foram restauradas para o estado padrão.",
    });
  }, [resetarGeralDoHook]); 

  const handleAdicionarComCategoria = useCallback((): void => {
    if (textoNovaTarefa.trim() === "") { toast.error("O texto da tarefa não pode estar vazio."); return; }
    if (categoriaSelecionada) {
      adicionarTarefa(categoriaSelecionada, alarmeNovaTarefa || undefined, textoNovaTarefa);
      setTextoNovaTarefa(''); 
      setAlarmeNovaTarefa(''); 
    } else {
      toast.error("Por favor, selecione uma categoria.");
    }
  }, [adicionarTarefa, textoNovaTarefa, categoriaSelecionada, alarmeNovaTarefa, setTextoNovaTarefa, setAlarmeNovaTarefa]);

  const handleCriarNovaCategoria = useCallback((): void => {
    if (nomeNovaCat.trim()) {
      adicionarNovaCategoria(nomeNovaCat, emojiNovaCat || '📁', corNovaCat || '#718096');
      setNomeNovaCat('');
      setEmojiNovaCat(EMOJIS_SUGERIDOS[0]); 
      setCorNovaCat('#718096');
    } else {
      toast.error("O nome da categoria é obrigatório.");
    }
  }, [adicionarNovaCategoria, nomeNovaCat, emojiNovaCat, corNovaCat]);
  
  const onEmojiClickNovaCat = useCallback((emojiData: EmojiClickData) => {
    setEmojiNovaCat(emojiData.emoji);
    setOpenEmojiPickerNovaCat(false);
  }, []);

  const onEmojiClickEdicaoCat = useCallback((emojiData: EmojiClickData) => {
    setEmojiEdicaoCat(emojiData.emoji);
    setOpenEmojiPickerEdicaoCat(false);
  }, []);

  const isValidIaTask = (task: unknown): task is IaParsedTask => {
    if (typeof task !== 'object' || task === null) return false;
    const t = task as Partial<IaParsedTask>;
    return typeof t.textoTarefa === 'string' &&
           (t.subTarefas === undefined || t.subTarefas === null || (Array.isArray(t.subTarefas) && t.subTarefas.every((s: unknown) => typeof s === 'string'))) &&
           (t.dataHora === undefined || t.dataHora === null || typeof t.dataHora === 'string');
  };

  const isValidIaCategory = (item: unknown): item is IaParsedCategory => {
    if (typeof item !== 'object' || item === null) return false;
    const cat = item as Partial<IaParsedCategory>;
    return typeof cat.nomeCategoria === 'string' &&
           Array.isArray(cat.tarefas) &&
           cat.tarefas.every(isValidIaTask);
  };

  const handleAdicionarTarefasEmLoteComIA = useCallback(async (): Promise<void> => {
    if (!textoEmLoteParaIA.trim()) {
      toast.error("Cole o texto do seu plano de estudos ou lista de tarefas.");
      return;
    }
    setProcessandoLoteComIA(true);
    const processingToastId = toast.loading("Processando seu texto com a IA...");

    try {
      const resultadoIA = await apiClient.processarTextoIA(textoEmLoteParaIA);
      
      toast.dismiss(processingToastId);
      
      console.log("### DEBUG: Resposta COMPLETA da API Route (resultadoIA):", JSON.stringify(resultadoIA, null, 2));
      
      let categoriasDaIA: IaParsedCategory[] = [];
      
      // A API agora retorna diretamente o array de categorias
      if (Array.isArray(resultadoIA) && resultadoIA.every(isValidIaCategory)) {
        categoriasDaIA = resultadoIA;
        console.log("### DEBUG: Categorias válidas extraídas:", categoriasDaIA);
      } else {
        console.error("Resposta da IA não está no formato esperado (após validação):", resultadoIA);
        console.error("Tipo de resultadoIA:", typeof resultadoIA);
        console.error("É array?", Array.isArray(resultadoIA));
        if (Array.isArray(resultadoIA)) {
          console.error("Validação de cada item:", resultadoIA.map((item, index) => ({ index, isValid: isValidIaCategory(item), item })));
        }
        toast.error("A IA retornou um formato de dados inválido ou inesperado. Verifique os logs.");
        setProcessandoLoteComIA(false);
        return;
      }
      
      if (categoriasDaIA.length === 0 && textoEmLoteParaIA.trim() !== "") {
        console.error("Não foi possível extrair categorias válidas da resposta da IA (array vazio):", resultadoIA);
        toast.info("Nenhuma categoria válida foi encontrada na resposta da IA. Verifique o texto ou o log do servidor.");
        setProcessandoLoteComIA(false);
        return;
      }
      
      // Chama a função do hook para adicionar o lote
      const contadores = adicionarLoteDeDadosIA(categoriasDaIA);
      
      if (contadores.tarefas > 0) {
        let message = `${contadores.tarefas} tarefas principais`;
        if (contadores.subtarefas > 0) { message += ` e ${contadores.subtarefas} sub-tarefas`; }
        message += " foram adicionadas";
        if (contadores.categorias > 0) { message += ` em ${contadores.categorias} nova(s) categoria(s).`;}
        else { message += " em categorias existentes."}
        
        toast.success(message);
      } else {
        toast.info("Nenhuma tarefa principal foi extraída pela IA. Verifique o formato do texto ou o log do servidor.");
      }
      setTextoEmLoteParaIA('');

    } catch (error: unknown) {
      console.error("Erro na função handleAdicionarTarefasEmLoteComIA:", error);
      toast.dismiss(processingToastId);
      toast.error("Falha ao processar o texto com a IA.", {description: error instanceof Error ? error.message : "Erro desconhecido"});
      setProcessandoLoteComIA(false);
      return;
    } finally {
      setProcessandoLoteComIA(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoEmLoteParaIA, adicionarLoteDeDadosIA]); // Removido dados.categorias e outras funções que agora são chamadas dentro do hook

  const handleNavigateCalendario = useCallback((newDate: Date, view: View, action: NavigateAction): void => {
    setDataAtualCalendario(newDate);
    setVisualizacaoAtualCalendario(view);
  }, []);

  const handleViewCalendario = useCallback((view: View): void => {
    setVisualizacaoAtualCalendario(view);
  }, []);
  
  const handleSelectSlotCalendario = useCallback((slotInfo: { start: Date, end: Date, slots: Date[] | string[], action: 'select' | 'click' | 'doubleClick' }): void => {
    if (slotInfo.action === 'click' || slotInfo.action === 'select') {
        const dataAlarmeFormatada = new Date(slotInfo.start.getTime() - (slotInfo.start.getTimezoneOffset() * 60000 )).toISOString().slice(0,16);
        setAlarmeNovaTarefa(dataAlarmeFormatada);
        toast.info("Alarme pré-preenchido em 'Adicionar Tarefa'.");
        document.getElementById('categoria-tarefa')?.focus();
    }
  }, [setAlarmeNovaTarefa]);

  const handleSelectEventCalendario = useCallback((event: CalendarEvent): void => {
    if(event.resource && typeof handleAbrirModalEditarTarefa === 'function') { 
      handleAbrirModalEditarTarefa(event.resource as Tarefa); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removida handleAbrirModalEditarTarefa das dependências, ela é estável por ser useCallback

  const tarefasComNumeros: { tarefa: Tarefa; numero: number; categoria: CategoriaInfo }[] = useMemo(() => {
    if (!dados || !dados.tarefas || !dados.categorias) return [];
    let contadorLocal = 1; // Usar variável local para o contador
    const resultado: { tarefa: Tarefa; numero: number; categoria: CategoriaInfo }[] = [];
    Object.keys(dados.categorias).forEach(catId => {
        const categoriaInfo = dados.categorias[catId];
        if (categoriaInfo && dados.tarefas[catId]) {
            (dados.tarefas[catId] || []).forEach(tarefa => {
                resultado.push({ tarefa, numero: contadorLocal++, categoria: categoriaInfo });
            });
        }
    });
    return resultado;
  }, [dados]); // Depende de 'dados' para recalcular
  
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <div className="flex justify-end mb-4 print:hidden">
            <Button variant="outline" size="icon" onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")} aria-label="Mudar tema" className="border-border">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
            Meu Painel de Controle TDAH
          </h1>
          <p className="text-md sm:text-lg text-muted-foreground max-w-xl mx-auto">
            O objetivo é fazer <strong>UMA</strong> coisa por dia. Só uma.
            {venceuPeloMenosUmaHoje && todasTarefasDoPainelConcluidas ? (
              <span className="text-green-600 font-semibold block mt-1"> ✅ Você zerou o dia! Incrível!</span>
            ) : venceuPeloMenosUmaHoje ? (
              <span className="text-green-500 font-semibold block mt-1"> 👍 Boa! Uma já foi! Continue assim!</span>
            ) : (
              <span className="block mt-1"> Se fizer, você venceu.</span>
            )}
          </p>
        </div>

        {dados.progresso && <Estatisticas
          progresso={dados.progresso}
          totalTarefasDisponiveis={totalTarefasAtivas + (dados.progresso?.totalTarefasConcluidas || 0)}
          concluidoHoje={venceuPeloMenosUmaHoje}
        />}

        {configPomodoro && (
            <TimerPomodoro
                tempoRestante={tempoRestantePomodoro}
                ativo={pomodoroAtivo}
                cicloAtual={cicloAtualPomodoro}
                ciclosCompletos={ciclosCompletos}
                configAtual={configPomodoro}
                onIniciarPausar={iniciarOuPausarPomodoro}
                onResetarCiclo={resetarCicloPomodoro}
                onAtualizarConfig={atualizarConfigPomodoro}
            />
        )}

        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader><CardTitle className="text-xl font-semibold">Gerenciar Categorias</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-md font-semibold mb-2">Criar Nova Categoria</h3>
              <div className="space-y-3 p-1">
                <Input type="text" placeholder="Nome da Categoria (ex: Estudos)" value={nomeNovaCat} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeNovaCat(e.target.value)} />
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Label htmlFor="emoji-nova-cat-btn" className="text-xs font-medium mb-1 block">Emoji</Label>
                    <Popover open={openEmojiPickerNovaCat} onOpenChange={setOpenEmojiPickerNovaCat}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" id="emoji-nova-cat-btn" className="w-full justify-start text-left font-normal">
                          {emojiNovaCat ? <span className="text-lg mr-2">{emojiNovaCat}</span> : "Selecione"}
                          <SmilePlus className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <EmojiPicker 
                            onEmojiClick={onEmojiClickNovaCat} 
                            autoFocusSearch={false}
                            theme={currentTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                            lazyLoadEmojis={true}
                            defaultSkinTone={SkinTones.NEUTRAL}
                            height={350}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="color-picker-cat" className="text-xs font-medium mb-1 block">Cor</Label>
                    <Input id="color-picker-cat" type="color" value={corNovaCat} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCorNovaCat(e.target.value)} className="w-full h-10 p-1 cursor-pointer"/>
                  </div>
                </div>
                <Button onClick={handleCriarNovaCategoria} className="w-full bg-sky-600 hover:bg-sky-700"><PlusCircle className="w-4 h-4 mr-2" />Criar Categoria</Button>
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-md font-semibold mb-2">Minhas Categorias</h3>
              {(!dados.categorias || Object.keys(dados.categorias).length === 0) ? ( <p className="text-sm text-center text-muted-foreground py-4">Nenhuma categoria criada ainda.</p> ) : (
                <ul className="space-y-2">
                  {Object.values(dados.categorias).map((cat: CategoriaInfo) => (
                    <li key={cat.id} className="flex items-center justify-between p-3 border rounded-lg bg-card-foreground/5" style={{ borderLeft: `5px solid ${cat.cor}`}}>
                      <div className="flex items-center"><span className="text-2xl mr-3">{cat.emoji}</span><span className="font-medium">{cat.nome}</span></div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700" onClick={() => handleAbrirModalEditarCategoria(cat)}><Edit3 className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent className="bg-background text-foreground border-border"><AlertDialogHeader><AlertDialogTitle>Excluir Categoria</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a categoria "{cat.nome}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => excluirCategoria(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader><CardTitle className="text-xl font-semibold">Adicionar Nova Tarefa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input type="text" placeholder="O que você precisa fazer hoje?" value={textoNovaTarefa} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextoNovaTarefa(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && categoriaSelecionada) { handleAdicionarComCategoria(); }}} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0} />
            <div className="space-y-1"><Label htmlFor="categoria-tarefa" className="text-xs font-medium">Categoria</Label>
                <Select value={categoriaSelecionada} onValueChange={(value: string) => setCategoriaSelecionada(value)} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}>
                    <SelectTrigger id="categoria-tarefa"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{dados.categorias && Object.keys(dados.categorias).map(catId => { const c=dados.categorias[catId]; if(!c) return null; return (<SelectItem key={c.id} value={c.id}>{c.emoji} {c.nome}</SelectItem>);})}</SelectContent>
                </Select>
            </div>
            <div className="space-y-1"><Label htmlFor="alarme-tarefa" className="text-xs font-medium">Alarme (Opcional)</Label><Input id="alarme-tarefa" type="datetime-local" value={alarmeNovaTarefa} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlarmeNovaTarefa(e.target.value)} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}/></div>
            <Button onClick={handleAdicionarComCategoria} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}><PlusCircle className="w-4 h-4 mr-2" />Adicionar Tarefa</Button>
            {(!dados.categorias || Object.keys(dados.categorias).length === 0) && (<p className="text-xs text-muted-foreground text-center pt-2">Crie uma categoria para adicionar tarefas.</p>)}
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader><CardTitle className="text-xl font-semibold">Adicionar Plano de Estudos/Tarefas (com IA ✨)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label htmlFor="texto-lote-ia" className="text-xs font-medium">Cole seu plano de estudos ou lista de tarefas aqui:</Label><Textarea id="texto-lote-ia" value={textoEmLoteParaIA} onChange={(e) => setTextoEmLoteParaIA(e.target.value)} placeholder={"Exemplo:\nCategoria: Meus Estudos\nTarefa: Ler capítulo 1\n- Fazer resumo\n- Anotar dúvidas"} className="mt-1 w-full h-48 p-2 border rounded-md"/></div>
            <p className="text-xs text-muted-foreground mt-1">Dica: Use "Categoria:", "Tarefa:", "Sub-tarefa:" ou "- " / "* " para ajudar a IA.</p>
            <Button onClick={handleAdicionarTarefasEmLoteComIA} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" disabled={processandoLoteComIA || !textoEmLoteParaIA.trim()}>
              {processandoLoteComIA ? "Processando com IA..." : <> <Sparkles className="w-4 h-4 mr-2" /> Processar com IA </> }
            </Button>
          </CardContent>
        </Card>
        
        {(mostrarParabensIndividual && !todasTarefasDoPainelConcluidas) && ( <div className="mb-6"><Parabens tarefaConcluida={tarefaConcluidaTexto}/></div>)}
        {todasTarefasDoPainelConcluidas && !carregando && ( <div className="mb-6"><Parabens todasConcluidas={true} onReset={handleResetPainel}/></div>)}

        {(!todasTarefasDoPainelConcluidas && tarefasComNumeros.length > 0) && (
          <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
            <CardHeader><CardTitle className="text-xl font-semibold flex items-center justify-between"><span>Suas Tarefas</span><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="border-border"><RefreshCw className="w-4 h-4 mr-2" />Resetar Painel</Button></AlertDialogTrigger><AlertDialogContent className="bg-background text-foreground border-border"><AlertDialogHeader><AlertDialogTitle>Resetar Painel</AlertDialogTitle><AlertDialogDescription>Isso restaurará tudo para o padrão e apagará seu progresso.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleResetPainel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tarefasComNumeros.map(({ tarefa, numero, categoria }) => (
                  <PainelTarefa key={tarefa.id} tarefa={tarefa} numero={numero} categoria={categoria} onConcluir={handleConcluirTarefa} onExcluir={() => excluirTarefa(tarefa.id, tarefa.categoriaId)} onEditar={handleAbrirModalEditarTarefa}
                    onAdicionarSubTarefa={adicionarSubTarefa}
                    onAlternarCompletarSubTarefa={alternarCompletarSubTarefa}
                    onExcluirSubTarefa={excluirSubTarefa}
                  />
              ))}
            </CardContent>
          </Card>
        )}
        {(!carregando && (!dados.categorias || Object.keys(dados.categorias).length === 0)) && ( <p className="text-center text-muted-foreground py-8 mb-6">Comece criando uma categoria!</p> )}
        {(!carregando && dados.categorias && Object.keys(dados.categorias).length > 0 && tarefasComNumeros.length === 0 && !todasTarefasDoPainelConcluidas) && ( <p className="text-center text-muted-foreground py-8 mb-6">Nenhuma tarefa. Adicione algumas!</p> )}
        
        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader><CardTitle className="text-xl font-semibold">Calendário de Tarefas</CardTitle></CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && 
                <CalendarioTarefas 
                    events={calendarEvents} 
                    currentDate={dataAtualCalendario}
                    currentView={visualizacaoAtualCalendario}
                    onNavigate={handleNavigateCalendario}
                    onView={handleViewCalendario}
                    onSelectEvent={handleSelectEventCalendario}
                    onSelectSlot={handleSelectSlotCalendario}
                /> 
            }
          </CardContent>
        </Card>

        {dados && dados.tarefasConcluidas && dados.tarefasConcluidas.length > 0 && ( 
          <Card className="shadow-lg bg-card text-card-foreground border-border">
            <CardHeader><CardTitle className="text-xl font-semibold">Histórico Recente</CardTitle></CardHeader>
            <CardContent><div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {dados.tarefasConcluidas.slice(-10).reverse().map((tarefa) => {
                    const categoriaInfo = dados.categorias ? dados.categorias[tarefa.categoriaId] : undefined; 
                    return ( <div key={`${tarefa.id}-${tarefa.concluidaEm ? new Date(tarefa.concluidaEm).getTime() : Date.now()}`} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700/40">
                        <div className="flex items-center gap-3"><span className="text-green-600 dark:text-green-400">✅</span><div><p className="text-sm font-medium">{tarefa.texto}</p><p className="text-xs text-muted-foreground">{categoriaInfo?.emoji} {categoriaInfo?.nome || tarefa.categoriaId}</p></div></div>
                        <span className="text-xs text-muted-foreground">{tarefa.concluidaEm ? new Date(tarefa.concluidaEm).toLocaleDateString('pt-BR') : 'Data indisponível'}</span>
                      </div> )
                  })}
            </div></CardContent>
          </Card>
        )}

        {/* MODAL/DIALOG PARA EDITAR TAREFA */}
        {tarefaParaEditar && (
          <Dialog open={mostrarModalEdicaoTarefa} onOpenChange={(aberto) => { setMostrarModalEdicaoTarefa(aberto); if (!aberto) setTarefaParaEditar(null); }}>
            <DialogContent className="bg-background text-foreground border-border sm:max-w-md">
              <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle><DialogDescription>Faça as alterações e clique em salvar.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="textoEdicao" className="text-right">Texto</Label><Input id="textoEdicao" value={textoEdicaoTarefa} onChange={(e) => setTextoEdicaoTarefa(e.target.value)} className="col-span-3"/></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoriaEdicao" className="text-right">Categoria</Label>
                  <Select value={categoriaEdicaoTarefa} onValueChange={(value: string) => setCategoriaEdicaoTarefa(value)}>
                    <SelectTrigger id="categoriaEdicao" className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>{dados.categorias && Object.keys(dados.categorias).map(catId => { const c=dados.categorias[catId]; if(!c) return null; return (<SelectItem key={c.id} value={c.id}>{c.emoji} {c.nome}</SelectItem>);})}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="alarmeEdicao" className="text-right">Alarme</Label><Input id="alarmeEdicao" type="datetime-local" value={alarmeEdicaoTarefa} onChange={(e) => setAlarmeEdicaoTarefa(e.target.value)} className="col-span-3"/></div>
                <div className="col-span-4 space-y-2 mt-2 pt-2 border-t border-border">
                  <h4 className="text-sm font-semibold">Sub-tarefas da Edição</h4>
                  {subTarefasEdicao.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between gap-2 ml-2">
                      <div className="flex items-center gap-2 flex-grow">
                        <Checkbox id={`edit-modal-sub-${sub.id}`} checked={sub.completada} onCheckedChange={() => handleToggleSubTarefaEdicao(sub.id)} />
                        <Label htmlFor={`edit-modal-sub-${sub.id}`} className={`flex-grow ${sub.completada ? "line-through text-muted-foreground" : ""}`}>{sub.texto}</Label>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80" onClick={() => handleExcluirSubTarefaEdicao(sub.id)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2 ml-2">
                    <Input placeholder="Nova sub-tarefa para edição" value={textoNovaSubTarefaEdicao} onChange={(e) => setTextoNovaSubTarefaEdicao(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') handleAdicionarSubTarefaEdicao();}} className="h-8 text-sm"/>
                    <Button onClick={handleAdicionarSubTarefaEdicao} size="icon" variant="outline" className="h-8 w-8"><Plus className="w-4 h-4"/></Button>
                  </div>
                </div>
              </div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleSalvarEdicaoTarefa}>Salvar Alterações</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* MODAL/DIALOG PARA EDITAR CATEGORIA */}
        {categoriaParaEditar && (
          <Dialog open={mostrarModalEdicaoCategoria} onOpenChange={(aberto) => { setMostrarModalEdicaoCategoria(aberto); if (!aberto) setCategoriaParaEditar(null); }}>
            <DialogContent className="bg-background text-foreground border-border sm:max-w-[450px]">
              <DialogHeader><DialogTitle>Editar Categoria</DialogTitle><DialogDescription>Altere o nome, emoji ou cor.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="nomeEdicaoCatModal" className="text-right">Nome</Label><Input id="nomeEdicaoCatModal" value={nomeEdicaoCat} onChange={(e) => setNomeEdicaoCat(e.target.value)} className="col-span-3"/></div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emojiEdicaoCatModal" className="text-right">Emoji</Label>
                    <Popover open={openEmojiPickerEdicaoCat} onOpenChange={setOpenEmojiPickerEdicaoCat}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" id="emojiEdicaoCatModal" className="col-span-3 justify-start text-left font-normal">
                                {emojiEdicaoCat ? <span className="text-lg mr-2">{emojiEdicaoCat}</span> : "Selecione"}
                                <SmilePlus className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <EmojiPicker 
                                onEmojiClick={onEmojiClickEdicaoCat} 
                                autoFocusSearch={false}
                                theme={currentTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                lazyLoadEmojis={true}
                                defaultSkinTone={SkinTones.NEUTRAL}
                                height={350}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="corEdicaoCatModal" className="text-right">Cor</Label><Input id="corEdicaoCatModal" type="color" value={corEdicaoCat} onChange={(e) => setCorEdicaoCat(e.target.value)} className="col-span-3 h-10 p-1 cursor-pointer"/></div>
              </div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleSalvarEdicaoCategoria}>Salvar Categoria</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}