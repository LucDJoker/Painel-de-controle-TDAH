'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import { View, Views } from 'react-big-calendar';
import { User, Sun, Moon, LogOut, RefreshCw, Edit3, Trash2, PlusCircle, Sparkles } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

import { AuthForm } from "@/components/auth-form";
import { Parabens } from "@/components/parabens";
import PainelTarefa from "@/components/painel-tarefa";
import { Estatisticas } from "@/components/estatisticas";
import { CalendarioComGastos } from "@/components/calendario-com-gastos";
import { FinanceTabs } from "@/components/finance-tabs";
import { TimerPomodoro } from "@/components/timer-pomodoro";
import type { CalendarEvent } from "@/components/calendario-tarefas";
import { usePainel, type IaParsedCategory, type IaParsedTask } from "@/lib/use-painel";
import type { Tarefa, SubTarefa, Categoria as CategoriaInfo } from "@/lib/types";
import { authService } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

// Emojis sugeridos para novas categorias
const EMOJIS_SUGERIDOS = [
  "📚", "📝", "💼", "🏠", "🛒", "🎯", "🧹", "💡", "📅", "🕒",
  "🧑‍💻", "📈", "🛠️", "🎓", "🏃‍♂️", "🍎", "🎵", "🧘", "🚀", "🌟"
];

// Parser local robusto para colar textos no formato:
// Categoria:, Tarefa:, Sub-tarefa:, Objetivo:
const parseTextoLocal = (texto: string): IaParsedCategory[] => {
  const linhas = texto.split("\n");
  const categorias: IaParsedCategory[] = [];
  let categoriaAtual: IaParsedCategory | null = null;
  let tarefaAtual: IaParsedTask | null = null;

  const limpa = (t: string) => t.replace(/^.*?:\s*/i, "").trim();

  const pushTarefa = () => {
    if (tarefaAtual) {
      if (!categoriaAtual) categoriaAtual = { nomeCategoria: "Geral", tarefas: [] };
      categoriaAtual.tarefas.push(tarefaAtual);
      tarefaAtual = null;
    }
  };

  const pushCategoria = () => {
    if (categoriaAtual && categoriaAtual.tarefas.length > 0) {
      categorias.push(categoriaAtual);
    }
    categoriaAtual = null;
  };

  for (const lRaw of linhas) {
    const l = lRaw.trim();
    if (!l) continue;

    if (/^categoria:\s*/i.test(l)) {
      pushTarefa();
      pushCategoria();
      categoriaAtual = { nomeCategoria: limpa(l), tarefas: [] };
      continue;
    }

    if (/^tarefa:\s*/i.test(l)) {
      pushTarefa();
      if (!categoriaAtual) categoriaAtual = { nomeCategoria: "Geral", tarefas: [] };
      tarefaAtual = { textoTarefa: limpa(l), dataHora: null, subTarefas: [] };
      continue;
    }

    if (/^sub-?tarefa:\s*/i.test(l)) {
      if (!tarefaAtual) {
        // Se aparecer sub-tarefa antes de tarefa, cria uma tarefa genérica
        if (!categoriaAtual) categoriaAtual = { nomeCategoria: "Geral", tarefas: [] };
        tarefaAtual = { textoTarefa: "Tarefa", dataHora: null, subTarefas: [] };
      }
      tarefaAtual.subTarefas = tarefaAtual.subTarefas || [];
      tarefaAtual.subTarefas.push(limpa(l));
      continue;
    }

    if (/^objetivo:\s*/i.test(l)) {
      if (!tarefaAtual) {
        if (!categoriaAtual) categoriaAtual = { nomeCategoria: "Geral", tarefas: [] };
        tarefaAtual = { textoTarefa: "Tarefa", dataHora: null, subTarefas: [] };
      }
      tarefaAtual.subTarefas = tarefaAtual.subTarefas || [];
      tarefaAtual.subTarefas.push(`Objetivo: ${limpa(l)}`);
      continue;
    }
  }

  // Finaliza restos
  pushTarefa();
  pushCategoria();

  return categorias;
};

export default function MainApp() {
  const { setTheme, theme: currentTheme } = useTheme();
  const {
    dados, carregando, concluirTarefa, resetarGeralDoHook, obterTotalTarefas,
    jaConcluidoHoje, textoNovaTarefa, setTextoNovaTarefa, adicionarTarefa,
    excluirTarefa, editarTarefa, adicionarNovaCategoria, excluirCategoria, editarCategoria,
    alarmeNovaTarefa, setAlarmeNovaTarefa, tempoRestantePomodoro, pomodoroAtivo,
    cicloAtualPomodoro, ciclosCompletos, iniciarOuPausarPomodoro,
    resetarCicloPomodoro, atualizarConfigPomodoro, configPomodoro,
    adicionarSubTarefa, alternarCompletarSubTarefa, excluirSubTarefa,
    adicionarLoteDeDadosIA,
    adicionarGasto, removerGasto, obterGastos,
    adicionarReceita, removerReceita, obterReceitas,
    obterCategoriasGastos, adicionarCategoriaGasto, removerCategoriaGasto,
  } = usePainel();
  
  const [usuario] = useState(() => authService.obterUsuarioLogado());
  const [tarefaConcluidaTexto, setTarefaConcluidaTexto] = useState<string>('');
  const [mostrarParabensIndividual, setMostrarParabensIndividual] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  
  // Limpar localStorage corrompido na primeira montagem
  useEffect(() => {
    const versaoApp = '1.3';
    const versaoSalva = localStorage.getItem('_app_version');
    if (versaoSalva !== versaoApp) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('_app_version', versaoApp);
    }
  }, []);
  
  const [modoVisao, setModoVisao] = useState<'tarefas' | 'categorias' | 'adicionar' | 'ia' | 'calendario' | 'financeiro'>('tarefas');
  
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

  const [expandHistorico, setExpandHistorico] = useState(false);

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const totalTarefasAtivas = obterTotalTarefas();
  const venceuPeloMenosUmaHoje = jaConcluidoHoje();
  const todasTarefasDoPainelConcluidas = !carregando && totalTarefasAtivas === 0 && dados.categorias && Object.keys(dados.categorias).length > 0 && (dados.progresso?.totalTarefasConcluidas || 0) > 0;
  
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

  const handleProcessarLoteComIA = useCallback(async (): Promise<void> => {
    if (!textoEmLoteParaIA.trim()) { toast.error("Escreva algo para processar."); return; }
    setProcessandoLoteComIA(true);
    try {
      console.log("📝 Iniciando processamento com IA...");
      const resposta = await apiClient.processarTextoIA(textoEmLoteParaIA);
      console.log("📋 Resposta da IA (completa, tipo:", typeof resposta, "):", resposta);
      
      // Se for resposta de erro da API
      if (resposta && typeof resposta === 'object' && 'error' in resposta) {
        const errMsg = (resposta as { error: string }).error;
        console.error("❌ Erro da API:", errMsg);
        toast.error(`Erro da IA: ${errMsg}`);
        return;
      }
      
      if (!resposta) { 
        toast.error("Erro ao processar com IA - resposta vazia."); 
        return; 
      }
      
      let categoriasParsed: IaParsedCategory[] = [];
      
      // Tenta vários formatos
      if (Array.isArray(resposta)) { 
        console.log("✅ Formato 1: Resposta é um array direto, tamanho:", resposta.length);
        categoriasParsed = resposta; 
      } 
      else if (resposta.categorias && Array.isArray(resposta.categorias)) { 
        console.log("✅ Formato 2: Resposta tem propriedade .categorias");
        categoriasParsed = resposta.categorias; 
      }
      else if (resposta.data && Array.isArray(resposta.data)) {
        console.log("✅ Formato 3: Resposta tem propriedade .data");
        categoriasParsed = resposta.data;
      }
      else if (typeof resposta === 'object' && resposta !== null) {
        // Tenta extrair array das primeiras 10 chaves
        console.log("🔍 Procurando array nas propriedades do objeto...");
        for (const key of Object.keys(resposta).slice(0, 10)) {
          const valor = resposta[key as keyof typeof resposta];
          if (Array.isArray(valor)) {
            console.log(`✅ Formato 4: Encontrado array na chave '${key}'`);
            categoriasParsed = valor;
            break;
          }
        }
      }
      
      console.log("🔎 Total de categorias após parsing:", categoriasParsed.length);
      
      // Se a IA não devolveu nada útil, usa o parser local do texto
      if (categoriasParsed.length === 0) {
        console.warn("⚠️ IA não retornou categorias. Tentando parser local...");
        categoriasParsed = parseTextoLocal(textoEmLoteParaIA);
      }
      
      // Fallback final se ainda vazio
      if (categoriasParsed.length === 0) {
        console.error("❌ Nenhuma categoria encontrada. Resposta completa:", JSON.stringify(resposta));
        toast.error("Não foi possível extrair tarefas. Verifique o texto e tente de novo.");
        return;
      }
      
      console.log(`✅ Categorias parseadas (${categoriasParsed.length}):`, categoriasParsed);
      
      const contadores = adicionarLoteDeDadosIA(categoriasParsed);
      console.log("📊 Contadores finais:", contadores);
      
      if (contadores.tarefas === 0) {
        toast.warning("Nenhuma tarefa foi adicionada. Verifique o formato do texto.");
        return;
      }
      
      toast.success("✅ Tarefas adicionadas!", { 
        description: `${contadores.categorias} categorias, ${contadores.tarefas} tarefas, ${contadores.subtarefas} subtarefas.` 
      });
    } catch (error) {
      console.error("❌ Erro ao processar IA:", error);
      // Fallback local: usa o parser robusto quando API falha
      const categoriasLocal = parseTextoLocal(textoEmLoteParaIA);
      if (categoriasLocal.length > 0) {
        const cont = adicionarLoteDeDadosIA(categoriasLocal);
        toast.success("✅ Tarefas adicionadas (fallback local)!", { 
          description: `${cont.categorias} categorias, ${cont.tarefas} tarefas, ${cont.subtarefas} subtarefas.` 
        });
      } else {
        toast.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      // Sempre limpar o campo após processar (sucesso ou erro)
      setTextoEmLoteParaIA('');
      setProcessandoLoteComIA(false);
    }
  }, [textoEmLoteParaIA, adicionarLoteDeDadosIA]);

  const eventosDoCalendario: CalendarEvent[] = useMemo(() => {
    if (!dados || !dados.tarefas || !dados.categorias) return [];
    const eventos: CalendarEvent[] = [];
    Object.keys(dados.categorias).forEach(catId => {
      const categoriaInfo = dados.categorias[catId];
      if (categoriaInfo && dados.tarefas[catId]) {
        (dados.tarefas[catId] || []).forEach(tarefa => {
          if (tarefa.alarme) {
            eventos.push({
              title: tarefa.texto,
              start: new Date(tarefa.alarme),
              end: new Date(tarefa.alarme),
              allDay: false,
              resource: { ...tarefa, categoriaInfo }
            });
          }
        });
      }
    });
    return eventos;
  }, [dados]);

  const tarefasComNumeros: { tarefa: Tarefa; numero: number; categoria: CategoriaInfo }[] = useMemo(() => {
    if (!dados || !dados.tarefas || !dados.categorias) return [];
    let contadorLocal = 1;
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
  }, [dados]);
  
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

  // Gate de autenticação: se não estiver logado, mostra tela de login/registro
  if (!usuario) {
    return (
      <AuthForm onLogin={() => {
        // Recarrega para hidratar dados e sessão
        window.location.reload();
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-4 print:hidden">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Olá, {usuario?.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")} aria-label="Mudar tema" className="border-border">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Sair" className="border-border">
                  <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
            Focus ERP
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

        {(mostrarParabensIndividual && !todasTarefasDoPainelConcluidas) && ( <div className="mb-6"><Parabens tarefaConcluida={tarefaConcluidaTexto}/></div>)}
        {todasTarefasDoPainelConcluidas && !carregando && ( <div className="mb-6"><Parabens todasConcluidas={true} onReset={handleResetPainel}/></div>)}

        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">Painel Principal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Abas */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setModoVisao('tarefas')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'tarefas'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✅ Tarefas
                </button>
                <button
                  onClick={() => setModoVisao('categorias')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'categorias'
                      ? 'border-b-2 border-purple-500 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📁 Categorias
                </button>
                <button
                  onClick={() => setModoVisao('adicionar')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'adicionar'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ➕ Adicionar
                </button>
                <button
                  onClick={() => setModoVisao('ia')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'ia'
                      ? 'border-b-2 border-pink-500 text-pink-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✨ IA
                </button>
                <button
                  onClick={() => setModoVisao('calendario')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'calendario'
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📅 Calendário
                </button>
                <button
                  onClick={() => setModoVisao('financeiro')}
                  className={`px-4 py-2 font-semibold transition ${
                    modoVisao === 'financeiro'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💰 Finanças
                </button>
              </div>

              {/* Conteúdo */}
              {modoVisao === 'tarefas' ? (
                <div className="space-y-4">
                  {(!todasTarefasDoPainelConcluidas && tarefasComNumeros.length > 0) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Suas Tarefas</h3>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border">
                              <RefreshCw className="w-4 h-4 mr-2" />Resetar Painel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background text-foreground border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Resetar Painel</AlertDialogTitle>
                              <AlertDialogDescription>Isso restaurará tudo para o padrão e apagará seu progresso.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetPainel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Reset</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {tarefasComNumeros.map(({ tarefa, numero, categoria }) => (
                        <PainelTarefa key={tarefa.id} tarefa={tarefa} numero={numero} categoria={categoria} onConcluir={handleConcluirTarefa} onExcluir={() => excluirTarefa(tarefa.id, tarefa.categoriaId)} onEditar={() => {}}
                          onAdicionarSubTarefa={adicionarSubTarefa}
                          onAlternarCompletarSubTarefa={alternarCompletarSubTarefa}
                          onExcluirSubTarefa={excluirSubTarefa}
                        />
                      ))}
                    </div>
                  )}
                  {(!carregando && (!dados.categorias || Object.keys(dados.categorias).length === 0)) && ( <p className="text-center text-muted-foreground py-8">Comece criando uma categoria!</p> )}
                  {(!carregando && dados.categorias && Object.keys(dados.categorias).length > 0 && tarefasComNumeros.length === 0 && !todasTarefasDoPainelConcluidas) && ( <p className="text-center text-muted-foreground py-8">Nenhuma tarefa. Adicione algumas!</p> )}
                </div>
              ) : modoVisao === 'adicionar' ? (
                <div className="space-y-3">
                  <Input type="text" placeholder="O que você precisa fazer hoje?" value={textoNovaTarefa} onChange={(e) => setTextoNovaTarefa(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && categoriaSelecionada) { handleAdicionarComCategoria(); }}} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0} />
                  <div className="space-y-1"><Label htmlFor="categoria-tarefa" className="text-xs font-medium">Categoria</Label>
                      <Select value={categoriaSelecionada} onValueChange={(value: string) => setCategoriaSelecionada(value)} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}>
                          <SelectTrigger id="categoria-tarefa"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{dados.categorias && Object.keys(dados.categorias).map(catId => { const c=dados.categorias[catId]; if(!c) return null; return (<SelectItem key={c.id} value={c.id}>{c.emoji} {c.nome}</SelectItem>);})}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1"><Label htmlFor="alarme-tarefa" className="text-xs font-medium">Alarme (Opcional)</Label><Input id="alarme-tarefa" type="datetime-local" value={alarmeNovaTarefa} onChange={(e) => setAlarmeNovaTarefa(e.target.value)} disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}/></div>
                  <Button onClick={handleAdicionarComCategoria} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}><PlusCircle className="w-4 h-4 mr-2" />Adicionar Tarefa</Button>
                  {(!dados.categorias || Object.keys(dados.categorias).length === 0) && (<p className="text-xs text-muted-foreground text-center pt-2">Crie uma categoria para adicionar tarefas.</p>)}
                </div>
              ) : modoVisao === 'categorias' ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Criar Nova Categoria</h3>
                    <Input type="text" placeholder="Nome da categoria..." value={nomeNovaCat} onChange={(e) => setNomeNovaCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nomeNovaCat.trim()) { handleCriarNovaCategoria(); }}} />
                    <div className="flex gap-2">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Emoji</Label>
                        <Popover open={openEmojiPickerNovaCat} onOpenChange={setOpenEmojiPickerNovaCat}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">{emojiNovaCat} Escolher Emoji</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0"><EmojiPicker onEmojiClick={(data: EmojiClickData) => { setEmojiNovaCat(data.emoji); setOpenEmojiPickerNovaCat(false); }} theme={currentTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT} /></PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="cor-nova-cat" className="text-xs">Cor</Label>
                        <Input id="cor-nova-cat" type="color" value={corNovaCat} onChange={(e) => setCorNovaCat(e.target.value)} className="h-10" />
                      </div>
                    </div>
                    <Button onClick={handleCriarNovaCategoria} className="w-full"><PlusCircle className="w-4 h-4 mr-2" />Criar Categoria</Button>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Minhas Categorias</h3>
                    <div className="space-y-2">
                      {dados.categorias && Object.values(dados.categorias).map(cat => (
                        <Card key={cat.id} style={{ borderLeftColor: cat.cor, borderLeftWidth: '4px' }}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{cat.emoji}</span>
                              <span className="font-medium">{cat.nome}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setCategoriaParaEditar(cat); setNomeEdicaoCat(cat.nome); setEmojiEdicaoCat(cat.emoji); setCorEdicaoCat(cat.cor); setMostrarModalEdicaoCategoria(true); }}><Edit3 className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                                <AlertDialogContent className="bg-background text-foreground border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                                    <AlertDialogDescription>Isso excluirá a categoria "{cat.nome}" e todas as suas tarefas.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => excluirCategoria(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!dados.categorias || Object.keys(dados.categorias).length === 0) && <p className="text-center text-muted-foreground py-4">Nenhuma categoria ainda.</p>}
                    </div>
                  </div>
                </div>
              ) : modoVisao === 'ia' ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Adicionar Tarefas com IA ✨</h3>
                  <p className="text-sm text-muted-foreground">Cole um texto com suas tarefas e a IA organizará automaticamente em categorias</p>
                  <Textarea placeholder="Exemplo:&#10;Comprar pão (casa)&#10;Estudar React&#10;Academia às 18h" value={textoEmLoteParaIA} onChange={(e) => setTextoEmLoteParaIA(e.target.value)} rows={8} disabled={processandoLoteComIA} />
                  <Button onClick={handleProcessarLoteComIA} className="w-full" disabled={processandoLoteComIA || !textoEmLoteParaIA.trim()}><Sparkles className="w-4 h-4 mr-2" />{processandoLoteComIA ? 'Processando...' : 'Processar com IA'}</Button>
                </div>
              ) : modoVisao === 'calendario' ? (
                <div>
                  <CalendarioComGastos tarefas={eventosDoCalendario} gastos={obterGastos()} onAdicionarGasto={adicionarGasto} onRemoverGasto={removerGasto} currentDate={dataAtualCalendario} currentView={visualizacaoAtualCalendario} onNavigate={(newDate, view, action) => setDataAtualCalendario(newDate)} onView={(view) => setVisualizacaoAtualCalendario(view)} />
                </div>
              ) : modoVisao === 'financeiro' ? (
                <div>
                  <FinanceTabs gastos={obterGastos()} receitas={obterReceitas()} categoriasGastos={obterCategoriasGastos()} onAdicionarGasto={adicionarGasto} onRemoverGasto={removerGasto} onAdicionarReceita={adicionarReceita} onRemoverReceita={removerReceita} onAdicionarCategoria={adicionarCategoriaGasto} onRemoverCategoria={removerCategoriaGasto} dataAtual={new Date()} />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}