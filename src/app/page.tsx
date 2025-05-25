'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RefreshCw, Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePainel } from "@/lib/use-painel";
import { PainelTarefa } from "@/components/painel-tarefa";
import { Estatisticas } from "@/components/estatisticas";
import { Parabens } from "@/components/parabens";
import type { Tarefa } from "@/lib/types";

export default function PaginaPrincipal() {
  const {
    dados,
    carregando,
    concluirTarefa,
    resetar,
    obterTotalTarefas,
    jaConcluidoHoje
  } = usePainel();

  const [tarefaConcluida, setTarefaConcluida] = useState<string>('');
  const [mostrarParabens, setMostrarParabens] = useState(false);

  const totalTarefas = obterTotalTarefas();
  const todasConcluidas = totalTarefas === 0;
  const concluidoHoje = jaConcluidoHoje();

  const handleConcluirTarefa = (tarefa: Tarefa) => {
    concluirTarefa(tarefa);
    setTarefaConcluida(tarefa.texto);
    setMostrarParabens(true);

    toast.success("🎉 Parabéns! Tarefa concluída!", {
      description: `"${tarefa.texto}" foi marcada como concluída!`,
      duration: 5000,
    });

    // Esconder parabéns após 5 segundos
    setTimeout(() => {
      setMostrarParabens(false);
      setTarefaConcluida('');
    }, 5000);
  };

  const handleReset = () => {
    resetar();
    toast.success("Painel resetado!", {
      description: "Todas as tarefas foram restauradas para o estado inicial.",
    });
  };

  // Organizar tarefas por categoria com numeração global
  const tarefasComNumeros: { tarefa: Tarefa; numero: number; categoria: typeof dados.categorias[string] }[] = [];
  let contador = 1;

  for (const [categoriaKey, tarefas] of Object.entries(dados.tarefas)) {
    const categoria = dados.categorias[categoriaKey];
    for (const tarefa of tarefas) {
      tarefasComNumeros.push({
        tarefa,
        numero: contador++,
        categoria
      });
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            MEU PAINEL DE CONTROLE
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O objetivo é fazer <strong>UMA</strong> coisa por dia. Só uma.
            {concluidoHoje ? (
              <span className="text-green-600 font-semibold"> ✅ Você já venceu hoje!</span>
            ) : (
              <span> Se fizer, você venceu.</span>
            )}
          </p>
        </div>

        {/* Estatísticas */}
        <Estatisticas
          progresso={dados.progresso}
          totalTarefasDisponiveis={totalTarefas + dados.progresso.totalTarefasConcluidas}
          concluidoHoje={concluidoHoje}
        />

        {/* Parabéns */}
        {(mostrarParabens || todasConcluidas) && (
          <div className="mb-6">
            <Parabens
              tarefaConcluida={mostrarParabens ? tarefaConcluida : undefined}
              onReset={handleReset}
              todasConcluidas={todasConcluidas}
            />
          </div>
        )}

        {/* Lista de Tarefas */}
        {!todasConcluidas && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Suas Tarefas Disponíveis</span>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resetar Painel</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso irá restaurar todas as tarefas para o estado inicial e apagar seu progresso. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>
                          Confirmar Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tarefasComNumeros.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma tarefa disponível no momento.
                </p>
              ) : (
                tarefasComNumeros.map(({ tarefa, numero, categoria }) => (
                  <PainelTarefa
                    key={tarefa.id}
                    tarefa={tarefa}
                    numero={numero}
                    categoria={categoria}
                    onConcluir={handleConcluirTarefa}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Histórico Recente */}
        {dados.tarefasConcluidas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dados.tarefasConcluidas
                  .slice(-10)
                  .reverse()
                  .map((tarefa) => (
                    <div
                      key={`${tarefa.id}-${tarefa.concluidaEm.getTime()}`}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-green-600">✅</span>
                        <div>
                          <p className="text-sm font-medium">{tarefa.texto}</p>
                          <p className="text-xs text-muted-foreground">
                            {dados.categorias[tarefa.categoria]?.nome || tarefa.categoria}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tarefa.concluidaEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
