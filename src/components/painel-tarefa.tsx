'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import type { Tarefa } from "@/lib/types";

interface PainelTarefaProps {
  tarefa: Tarefa;
  numero: number;
  onConcluir: (tarefa: Tarefa) => void;
  categoria: {
    nome: string;
    emoji: string;
    cor: string;
  };
}

export function PainelTarefa({ tarefa, numero, onConcluir, categoria }: PainelTarefaProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4"
          style={{ borderLeftColor: categoria.cor.replace('bg-', '') === 'blue-500' ? '#3b82f6' :
                                     categoria.cor.replace('bg-', '') === 'green-500' ? '#10b981' : '#a855f7' }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Badge
            variant="secondary"
            className="text-lg font-bold min-w-[2.5rem] h-8 flex items-center justify-center"
          >
            {numero}
          </Badge>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoria.emoji}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {categoria.nome}
              </span>
            </div>

            <p className="text-sm leading-relaxed">
              {tarefa.texto}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Só precisa fazer uma vez!</span>
              </div>

              <Button
                onClick={() => onConcluir(tarefa)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Concluir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
