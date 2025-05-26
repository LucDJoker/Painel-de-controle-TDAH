'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Importei o Badge que você usou
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, Calendar } from "lucide-react";
import type { ProgressoUsuario } from "@/lib/types";

interface EstatisticasProps {
  progresso: ProgressoUsuario | undefined; // Progresso pode ser undefined inicialmente
  totalTarefasDisponiveis: number; // Total de tarefas (ativas + já concluídas que existiram)
  concluidoHoje: boolean;
}

export function Estatisticas({ progresso, totalTarefasDisponiveis, concluidoHoje }: EstatisticasProps) {
  // Garante que temos valores numéricos para o progresso, ou 0 se undefined
  const streakAtual = progresso?.streakAtual || 0;
  const maiorStreak = progresso?.maiorStreak || 0;
  const totalTarefasConcluidas = progresso?.totalTarefasConcluidas || 0;
  
  // Calcula o percentual de tarefas QUE FORAM CONCLUÍDAS
  // totalTarefasDisponiveis = (tarefas ativas atuais) + (total de tarefas já concluídas)
  // Se não há tarefas disponíveis (nem ativas, nem concluídas), o progresso é 0.
  const percentualProgresso = 
    totalTarefasDisponiveis > 0 
      ? Math.round((totalTarefasConcluidas / totalTarefasDisponiveis) * 100) 
      : 0;
  
  // Calcula quantas tarefas ainda faltam (ativas)
  const tarefasRestantes = Math.max(0, totalTarefasDisponiveis - totalTarefasConcluidas);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"> {/* Aumentei o mb e ajustei para sm */}
      {/* Streak Atual */}
      <Card className="bg-gradient-to-br from-orange-100 via-red-50 to-red-100 dark:from-orange-900/30 dark:via-red-900/20 dark:to-red-900/30 border-orange-300 dark:border-orange-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"> {/* Ajustado para alinhar título e ícone */}
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Sequência Atual
          </CardTitle>
          <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Reduzido padding top */}
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {streakAtual}
            <span className="text-base font-normal text-orange-600 dark:text-orange-400 ml-1">
              {streakAtual === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          {concluidoHoje && (
            <Badge variant="outline" className="mt-2 bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-600">
              ✅ Concluído hoje!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Maior Streak */}
      <Card className="bg-gradient-to-br from-yellow-100 via-amber-50 to-amber-100 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Melhor Sequência
          </CardTitle>
          <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
            {maiorStreak}
            <span className="text-base font-normal text-yellow-600 dark:text-yellow-400 ml-1">
              {maiorStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Concluído */}
      <Card className="bg-gradient-to-br from-green-100 via-emerald-50 to-emerald-100 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-emerald-900/30 border-green-300 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Concluído
          </CardTitle>
          <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
            {totalTarefasConcluidas}
            <span className="text-base font-normal text-green-600 dark:text-green-400 ml-1">
              {totalTarefasConcluidas === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Geral */}
      <Card className="bg-gradient-to-br from-blue-100 via-indigo-50 to-indigo-100 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-indigo-900/30 border-blue-300 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Progresso Geral
          </CardTitle>
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1"> {/* Diminuído space-y */}
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {percentualProgresso}% {/* Usando o percentual de concluídas */}
            </div>
            <Progress value={percentualProgresso} className="h-2 [&>div]:bg-blue-500" /> {/* Cor da barra */}
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {tarefasRestantes} {tarefasRestantes === 1 ? 'restante' : 'restantes'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}