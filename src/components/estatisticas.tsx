'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, Calendar } from "lucide-react";
import type { ProgressoUsuario } from "@/lib/types";

interface EstatisticasProps {
  progresso: ProgressoUsuario;
  totalTarefasDisponiveis: number;
  concluidoHoje: boolean;
}

export function Estatisticas({ progresso, totalTarefasDisponiveis, concluidoHoje }: EstatisticasProps) {
  const percentualConcluido = totalTarefasDisponiveis > 0
    ? ((totalTarefasDisponiveis - progresso.totalTarefasConcluidas) / totalTarefasDisponiveis) * 100
    : 0;

  const progressoAtual = Math.max(0, 100 - percentualConcluido);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Streak Atual */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Sequência Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700">
            {progresso.streakAtual}
            <span className="text-sm font-normal text-orange-600 ml-1">
              {progresso.streakAtual === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          {concluidoHoje && (
            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
              ✅ Concluído hoje!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Maior Streak */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            Melhor Sequência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-700">
            {progresso.maiorStreak}
            <span className="text-sm font-normal text-yellow-600 ml-1">
              {progresso.maiorStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Concluído */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            Total Concluído
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {progresso.totalTarefasConcluidas}
            <span className="text-sm font-normal text-green-600 ml-1">
              {progresso.totalTarefasConcluidas === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Geral */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(progressoAtual)}%
            </div>
            <Progress value={progressoAtual} className="h-2" />
            <p className="text-xs text-blue-600">
              {totalTarefasDisponiveis - progresso.totalTarefasConcluidas} restantes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
