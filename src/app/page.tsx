'use client';

import { useState } from 'react';
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
import { RefreshCw, PlusCircle, Trash2, Edit3, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { usePainel } from "@/lib/use-painel";
import PainelTarefa from "@/components/painel-tarefa";
import { Estatisticas } from "@/components/estatisticas";
import { Parabens } from "@/components/parabens";
import { TimerPomodoro } from "@/components/timer-pomodoro";
import type { Tarefa, Categoria as CategoriaInfo, ConfigPomodoro } from "@/lib/types"; 

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMOJIS_SUGERIDOS = ['📁', '🏠', '🎓', '💼', '💪', '❤️', '🎉', '💡', '💰', '✈️', '🍽️', '📚', '🛠️', '✨', '🎯', '🤔', '😊', '🔥'];

export default function PaginaPrincipal() {
  const { setTheme, theme } = useTheme();
  const {
    dados, carregando, concluirTarefa, resetar: resetarGeralDoHook, obterTotalTarefas,
    jaConcluidoHoje, textoNovaTarefa, setTextoNovaTarefa, adicionarTarefa,
    excluirTarefa, editarTarefa, adicionarNovaCategoria, excluirCategoria,
    alarmeNovaTarefa, setAlarmeNovaTarefa, tempoRestantePomodoro, pomodoroAtivo,
    cicloAtualPomodoro, ciclosCompletos, iniciarOuPausarPomodoro,
    resetarPomodoro: resetarCicloPomodoro, atualizarConfigPomodoro, configPomodoro
  } = usePainel();

  const [tarefaConcluidaTexto, setTarefaConcluidaTexto] = useState<string>('');
  const [mostrarParabensIndividual, setMostrarParabensIndividual] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(''); 
  const [nomeNovaCat, setNomeNovaCat] = useState('');
  const [emojiNovaCat, setEmojiNovaCat] = useState(EMOJIS_SUGERIDOS[0]);
  const [corNovaCat, setCorNovaCat] = useState('#718096');

  const [tarefaParaEditar, setTarefaParaEditar] = useState<Tarefa | null>(null);
  const [textoEdicaoTarefa, setTextoEdicaoTarefa] = useState('');
  const [categoriaEdicaoTarefa, setCategoriaEdicaoTarefa] = useState<string>('');
  const [alarmeEdicaoTarefa, setAlarmeEdicaoTarefa] = useState<string>('');
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);

  const totalTarefasAtivas = obterTotalTarefas();
  const todasTarefasDoPainelConcluidas = totalTarefasAtivas === 0 && !carregando && dados.categorias && Object.keys(dados.categorias).length > 0; 
  const venceuPeloMenosUmaHoje = jaConcluidoHoje();

  const handleAbrirModalEditarTarefa = (tarefa: Tarefa) => {
    setTarefaParaEditar(tarefa);
    setTextoEdicaoTarefa(tarefa.texto);
    setCategoriaEdicaoTarefa(tarefa.categoriaId);
    if (tarefa.alarme) {
        const dataAlarme = new Date(tarefa.alarme);
        if (!isNaN(dataAlarme.getTime())) { // Verifica se a data é válida
            const offset = dataAlarme.getTimezoneOffset() * 60000;
            const dataLocal = new Date(dataAlarme.getTime() - offset);
            setAlarmeEdicaoTarefa(dataLocal.toISOString().slice(0, 16));
        } else {
            setAlarmeEdicaoTarefa(''); 
        }
    } else {
        setAlarmeEdicaoTarefa('');
    }
    setMostrarModalEdicao(true);
  };

  const handleSalvarEdicaoTarefa = () => {
    if (!tarefaParaEditar) return;
    if (textoEdicaoTarefa.trim() === "") { toast.error("O texto da tarefa não pode ser vazio."); return; }
    if (!categoriaEdicaoTarefa) { toast.error("Por favor, selecione uma categoria."); return; }

    editarTarefa(tarefaParaEditar.id, tarefaParaEditar.categoriaId, {
      texto: textoEdicaoTarefa,
      categoriaId: categoriaEdicaoTarefa,
      alarme: alarmeEdicaoTarefa || undefined,
    });
    setMostrarModalEdicao(false);
    setTarefaParaEditar(null);
  };

  const handleConcluirTarefa = (tarefa: Tarefa): void => {
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
  };

  const handleResetPainel = (): void => { 
    resetarGeralDoHook(); 
    toast.success("Painel resetado!", { 
      description: "Todas as tarefas e categorias foram restauradas para o estado padrão.",
    });
  }; 

  const handleAdicionarComCategoria = (): void => {
    if (textoNovaTarefa.trim() === "") { toast.error("O texto da tarefa não pode estar vazio."); return; }
    if (categoriaSelecionada) {
      adicionarTarefa(categoriaSelecionada, alarmeNovaTarefa || undefined);
      setTextoNovaTarefa(''); 
      setAlarmeNovaTarefa(''); 
    } else {
      toast.error("Por favor, selecione uma categoria.");
    }
  };

  const handleCriarNovaCategoria = (): void => {
    if (nomeNovaCat.trim()) {
      adicionarNovaCategoria(nomeNovaCat, emojiNovaCat || '📁', corNovaCat || '#718096');
      setNomeNovaCat('');
      setEmojiNovaCat(EMOJIS_SUGERIDOS[0]);
      setCorNovaCat('#718096');
    } else {
      toast.error("O nome da categoria é obrigatório.");
    }
  };

  const tarefasComNumeros: { tarefa: Tarefa; numero: number; categoria: CategoriaInfo }[] = [];
  let contador = 1;

  if (dados && dados.tarefas && dados.categorias) {
    Object.keys(dados.tarefas).forEach(categoriaId => { 
      const categoriaInfo = dados.categorias[categoriaId];
      const tarefasDaCategoria = dados.tarefas[categoriaId] || [];
      if (categoriaInfo) { 
        for (const tarefa of tarefasDaCategoria) {
          if (tarefa.categoriaId === categoriaId) { 
            tarefasComNumeros.push({
              tarefa,
              numero: contador++,
              categoria: categoriaInfo
            });
          }
        }
      }
    });
  }
  
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
        <div className="flex justify-end mb-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Mudar tema"
                className="border-border"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Mudar tema</span>
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
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Gerenciar Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-md font-semibold mb-2">Criar Nova Categoria</h3>
              <div className="space-y-3 p-1">
                <Input
                  type="text"
                  placeholder="Nome da Categoria (ex: Estudos)"
                  value={nomeNovaCat}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeNovaCat(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Label htmlFor="emoji-select-cat" className="text-xs font-medium mb-1 block">Emoji</Label>
                    <Select value={emojiNovaCat} onValueChange={setEmojiNovaCat}>
                      <SelectTrigger id="emoji-select-cat">
                        <SelectValue placeholder="Ícone" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOJIS_SUGERIDOS.map(emoji => (
                          <SelectItem key={emoji} value={emoji} className="text-lg">
                            {emoji}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="color-picker-cat" className="text-xs font-medium mb-1 block">Cor</Label>
                    <Input
                      id="color-picker-cat"
                      type="color"
                      value={corNovaCat}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCorNovaCat(e.target.value)}
                      className="w-full h-10 p-1 cursor-pointer rounded-md border-input"
                      title="Selecione uma cor"
                    />
                  </div>
                </div>
                <Button onClick={handleCriarNovaCategoria} className="w-full bg-sky-600 hover:bg-sky-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Categoria
                </Button>
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-md font-semibold mb-2">Minhas Categorias</h3>
              {(!dados.categorias || Object.keys(dados.categorias).length === 0) ? (
                <p className="text-sm text-center text-muted-foreground py-4">Nenhuma categoria criada ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.values(dados.categorias).map((cat: CategoriaInfo) => (
                    <li 
                      key={cat.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-card-foreground/5"
                      style={{ borderLeft: `5px solid ${cat.cor}`}}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{cat.emoji}</span>
                        <span className="font-medium">{cat.nome}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a categoria "{cat.nome}"? Todas as tarefas (ativas e concluídas) associadas a ela também serão excluídas. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => excluirCategoria(cat.id)}
                              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Adicionar Nova Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="text"
              placeholder="O que você precisa fazer hoje?"
              value={textoNovaTarefa}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextoNovaTarefa(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && categoriaSelecionada) {
                  handleAdicionarComCategoria();
                }
              }}
              disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}
            />
            <div className="space-y-1">
                <Label htmlFor="categoria-tarefa" className="text-xs font-medium">
                    Categoria da Tarefa
                </Label>
                <Select
                  value={categoriaSelecionada}
                  onValueChange={(value: string) => setCategoriaSelecionada(value)}
                  disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}
                >
                  <SelectTrigger id="categoria-tarefa">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {dados.categorias && Object.keys(dados.categorias).map((categoriaId) => {
                      const cat = dados.categorias[categoriaId];
                      if (!cat) return null; 
                      return (
                        <SelectItem key={cat.id} value={cat.id}> 
                          {cat.emoji} {cat.nome}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="alarme-tarefa" className="text-xs font-medium">
                Definir Alarme (Opcional)
              </Label>
              <Input
                id="alarme-tarefa"
                type="datetime-local"
                value={alarmeNovaTarefa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlarmeNovaTarefa(e.target.value)}
                disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}
              />
            </div>
            <Button 
              onClick={handleAdicionarComCategoria} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!dados.categorias || Object.keys(dados.categorias).length === 0}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Tarefa
            </Button>
             {(!dados.categorias || Object.keys(dados.categorias).length === 0) && (
                <p className="text-xs text-muted-foreground text-center pt-2">Crie uma categoria primeiro para adicionar tarefas.</p>
            )}
          </CardContent>
        </Card>

        {(mostrarParabensIndividual && !todasTarefasDoPainelConcluidas) && (
         <div className="mb-6">
            <Parabens
              tarefaConcluida={tarefaConcluidaTexto}
            />
          </div>
        )}
        
        {todasTarefasDoPainelConcluidas && !carregando && (
             <div className="mb-6">
             <Parabens
               todasConcluidas={true}
               onReset={handleResetPainel}
             />
           </div>
        )}

        {(!todasTarefasDoPainelConcluidas && tarefasComNumeros.length > 0) && (
          <Card className="mb-6 shadow-lg bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <span>Suas Tarefas Disponíveis</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-border">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resetar Painel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background text-foreground border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resetar Painel</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá restaurar todas as tarefas e categorias para o estado padrão e apagar seu progresso. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetPainel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Confirmar Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tarefasComNumeros.map(({ tarefa, numero, categoria }) => (
                  <PainelTarefa
                    key={tarefa.id}
                    tarefa={tarefa}
                    numero={numero}
                    categoria={categoria} 
                    onConcluir={handleConcluirTarefa}
                    onExcluir={() => excluirTarefa(tarefa.id, tarefa.categoriaId)} 
                    onEditar={handleAbrirModalEditarTarefa}
                  />
              ))}
            </CardContent>
          </Card>
        )}
        {/* Mensagens de "Nenhuma tarefa" */}
        {(!carregando && (!dados.categorias || Object.keys(dados.categorias).length === 0)) && (
             <p className="text-center text-muted-foreground py-8 mb-6">
                Comece criando uma categoria para organizar suas tarefas!
             </p>
        )}
        {(!carregando && dados.categorias && Object.keys(dados.categorias).length > 0 && tarefasComNumeros.length === 0 && !todasTarefasDoPainelConcluidas) && (
             <p className="text-center text-muted-foreground py-8 mb-6">
                Nenhuma tarefa disponível para as categorias existentes. Adicione algumas!
             </p>
        )}

        {/* Histórico Recente */}
        {dados && dados.tarefasConcluidas && dados.tarefasConcluidas.length > 0 && ( 
          <Card className="shadow-lg bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {dados.tarefasConcluidas
                  .slice(-10) 
                  .reverse()  
                  .map((tarefa) => {
                    const categoriaInfo = dados.categorias ? dados.categorias[tarefa.categoriaId] : undefined; 
                    return (
                      <div
                        key={`${tarefa.id}-${tarefa.concluidaEm ? new Date(tarefa.concluidaEm).getTime() : Date.now()}`}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 dark:text-green-400">✅</span>
                          <div>
                            <p className="text-sm font-medium">{tarefa.texto}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoriaInfo?.emoji} {categoriaInfo?.nome || tarefa.categoriaId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tarefa.concluidaEm ? new Date(tarefa.concluidaEm).toLocaleDateString('pt-BR') : 'Data indisponível'}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MODAL/DIALOG PARA EDITAR TAREFA */}
        {tarefaParaEditar && (
          <Dialog open={mostrarModalEdicao} onOpenChange={(aberto) => {
            setMostrarModalEdicao(aberto);
            if (!aberto) setTarefaParaEditar(null);
          }}>
            <DialogContent className="bg-background text-foreground border-border sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Editar Tarefa</DialogTitle>
                <DialogDescription>
                  Faça as alterações na sua tarefa e clique em salvar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="textoEdicao" className="text-right">
                    Texto
                  </Label>
                  <Input
                    id="textoEdicao"
                    value={textoEdicaoTarefa}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextoEdicaoTarefa(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoriaEdicao" className="text-right">
                    Categoria
                  </Label>
                  <Select
                    value={categoriaEdicaoTarefa}
                    onValueChange={(value: string) => setCategoriaEdicaoTarefa(value)}
                  >
                    <SelectTrigger id="categoriaEdicao" className="col-span-3">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {dados.categorias && Object.keys(dados.categorias).map((categoriaId) => {
                        const cat = dados.categorias[categoriaId];
                        if(!cat) return null;
                        return (
                          <SelectItem key={cat.id} value={cat.id}> 
                            {cat.emoji} {cat.nome}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alarmeEdicao" className="text-right">
                    Alarme
                  </Label>
                  <Input
                    id="alarmeEdicao"
                    type="datetime-local"
                    value={alarmeEdicaoTarefa}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlarmeEdicaoTarefa(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSalvarEdicaoTarefa}>Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}