'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, Calendar, Brain } from "lucide-react"; // Adicionado Brain para Pomodoros
import type { ProgressoUsuario } from "@/lib/types";

interface EstatisticasProps {
  progresso: ProgressoUsuario | undefined; // Permite que progresso seja undefined
  totalTarefasDisponiveis: number; // Total de tarefas (ativas + já concluídas que existiram)
  concluidoHoje: boolean;
}

export function Estatisticas({ progresso, totalTarefasDisponiveis, concluidoHoje }: EstatisticasProps) {
  // Valores padrão caso progresso seja undefined ou alguma propriedade não exista
  const streakAtual = progresso?.streakAtual || 0;
  const maiorStreak = progresso?.maiorStreak || 0;
  const totalTarefasConcluidas = progresso?.totalTarefasConcluidas || 0;
  const totalPomodorosFoco = progresso?.totalPomodorosFocoCompletos || 0; // Novo

  // Cálculo do percentual de tarefas CONCLUÍDAS
  const percentualProgresso = 
    totalTarefasDisponiveis > 0 
      ? Math.round((totalTarefasConcluidas / totalTarefasDisponiveis) * 100) 
      : 0;
  
  const tarefasRestantes = Math.max(0, totalTarefasDisponiveis - totalTarefasConcluidas);

  return (
    // Ajustado o grid para tentar acomodar 5 cards.
    // Em telas menores (sm), 2 colunas. Em médias (md), 3 colunas. Em grandes (lg), 5 colunas.
    // Se preferir sempre 4 e o último quebrar, pode voltar para lg:grid-cols-4.
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 text-center md:text-left">
      {/* Streak Atual */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/30 dark:via-red-900/20 dark:to-red-900/30 dark:border-orange-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-col items-center md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
            Sequência Atual
          </CardTitle>
          <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-300">
            {streakAtual}
            <span className="text-sm sm:text-base font-normal text-orange-600 dark:text-orange-400 ml-1">
              {streakAtual === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          {concluidoHoje && (
            <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-600">
              ✅ Concluído hoje!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Maior Streak */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-amber-900/30 dark:border-yellow-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-col items-center md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
            Melhor Sequência
          </CardTitle>
          <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-700 dark:text-yellow-300">
            {maiorStreak}
            <span className="text-sm sm:text-base font-normal text-yellow-600 dark:text-yellow-400 ml-1">
              {maiorStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Concluído (Tarefas) */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-emerald-900/30 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-col items-center md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
            Tarefas Concluídas
          </CardTitle>
          <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300">
            {totalTarefasConcluidas}
            <span className="text-sm sm:text-base font-normal text-green-600 dark:text-green-400 ml-1">
              {totalTarefasConcluidas === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* NOVO CARD: Total de Pomodoros de Foco */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-pink-900/30 dark:border-purple-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-col items-center md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
            Pomodoros (Foco)
          </CardTitle>
          <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">
            {totalPomodorosFoco}
            <span className="text-sm sm:text-base font-normal text-purple-600 dark:text-purple-400 ml-1">
              {totalPomodorosFoco === 1 ? 'ciclo' : 'ciclos'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Geral */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-indigo-900/30 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-col items-center md:flex-row md:items-center md:justify-between space-y-1 md:space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
            Progresso Geral
          </CardTitle>
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1"> {/* Diminuído space-y para caber melhor */}
            <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
              {percentualProgresso}%
            </div>
            <Progress value={percentualProgresso} className="h-2 [&>div]:bg-blue-500" />
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {tarefasRestantes} {tarefasRestantes === 1 ? 'restante' : 'restantes'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}