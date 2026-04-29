'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, PartyPopper } from "lucide-react"; // PartyPopper para "Todas Concluídas"

interface ParabensProps {
  tarefaConcluida?: string; // Opcional: nome da tarefa individual concluída
  todasConcluidas?: boolean; // Opcional: indica se todas as tarefas do dia/painel foram concluídas
  onReset?: () => void;     // Opcional: função para resetar o painel (só faz sentido se todasConcluidas for true)
}

export function Parabens({ tarefaConcluida, todasConcluidas, onReset }: ParabensProps) {
  // Cenário 1: Todas as tarefas foram concluídas
  if (todasConcluidas && onReset) { 
    return (
      <Card className="bg-green-50 dark:bg-green-900/30 border-2 border-dashed border-green-300 dark:border-green-600/50 shadow-xl animate-in fade-in-50 zoom-in-90 duration-500">
        <CardHeader className="items-center text-center pt-6 pb-4"> {/* Ajustado padding */}
          <PartyPopper className="w-16 h-16 text-green-500 dark:text-green-400 mb-3" strokeWidth={1.5} />
          <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
            TUDO FEITO POR HOJE!
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400 text-base mt-1 px-4"> {/* Adicionado padding horizontal */}
            Você zerou suas tarefas com maestria. Que dia produtivo! Hora de relaxar e recarregar as energias.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-center justify-center pb-6 pt-2 space-y-3"> {/* Ajustado padding e espaçamento */}
          <p className="text-3xl">🎉🏆🚀</p>
          <Button 
            variant="outline" 
            onClick={onReset} 
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 dark:text-slate-900 dark:border-green-500 gap-2 shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            Resetar Painel para Amanhã
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Cenário 2: Uma tarefa individual foi concluída
  // (e não são todas as tarefas, pois o bloco acima não foi acionado)
  if (tarefaConcluida) {
    return (
      <Card className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/40 animate-in fade-in-50 duration-300">
        <CardHeader className="items-center text-center py-4"> {/* Ajustado padding */}
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2" />
          <CardTitle className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Mandou Bem!</CardTitle>
          {tarefaConcluida && (
            <CardDescription className="text-emerald-600 dark:text-emerald-400 px-2"> {/* Adicionado padding horizontal */}
              Você concluiu: "{tarefaConcluida}"
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    );
  }
  
  // Se nenhuma das condições acima for atendida, não renderiza nada
  return null; 
}