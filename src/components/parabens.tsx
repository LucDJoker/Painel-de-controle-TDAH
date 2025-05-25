'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartyPopper, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface ParabensProps {
  tarefaConcluida?: string;
  onReset: () => void;
  todasConcluidas: boolean;
}

export function Parabens({ tarefaConcluida, onReset, todasConcluidas }: ParabensProps) {
  const [mostrarConfetti, setMostrarConfetti] = useState(false);

  useEffect(() => {
    if (tarefaConcluida) {
      setMostrarConfetti(true);
      const timer = setTimeout(() => setMostrarConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [tarefaConcluida]);

  if (todasConcluidas) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-800">
            PARABÉNS! Você completou todas as tarefas!
          </h2>
          <p className="text-green-700 text-lg">
            Você é incrível. O Painel está limpo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={onReset}
              size="lg"
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Recomeçar com Lista Padrão
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tarefaConcluida) {
    return (
      <Card className={`border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 ${
        mostrarConfetti ? 'animate-pulse' : ''
      }`}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={`confetti-top-${Math.random()}-${i}`}
                className={`text-2xl ${mostrarConfetti ? 'animate-bounce' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ✅
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-green-800">
                PARABÉNS!
              </h2>
              <PartyPopper className="w-6 h-6 text-green-600" />
            </div>

            <p className="text-green-700 font-medium">
              Você completou: "{tarefaConcluida}"
            </p>

            <p className="text-2xl font-bold text-green-800 mt-2">
              VOCÊ VENCEU O DIA!
            </p>
          </div>

          <div className="flex justify-center space-x-2 pt-2">
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={`confetti-bottom-${Math.random()}-${i}`}
                className={`text-2xl ${mostrarConfetti ? 'animate-bounce' : ''}`}
                style={{ animationDelay: `${(i + 20) * 0.1}s` }}
              >
                ✅
              </span>
            ))}
          </div>

          <p className="text-sm text-green-600 pt-4">
            O painel será atualizado automaticamente...
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
