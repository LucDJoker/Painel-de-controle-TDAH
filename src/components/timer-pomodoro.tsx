// src/components/timer-pomodoro.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Settings2, Save } from "lucide-react";
import type { ConfigPomodoro } from '@/lib/types';
import { toast } from "sonner"; // <--- ADICIONAR ESTE IMPORT

interface TimerPomodoroProps {
  tempoRestante: number;
  ativo: boolean;
  cicloAtual: 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';
  ciclosCompletos: number;
  configAtual: ConfigPomodoro;
  onIniciarPausar: () => void;
  onResetarCiclo: () => void;
  onAtualizarConfig: (novasConfigs: Partial<ConfigPomodoro>) => void;
}

const formatarTempo = (segundos: number): string => {
  const minutos = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function TimerPomodoro({
  tempoRestante,
  ativo,
  cicloAtual,
  ciclosCompletos,
  configAtual,
  onIniciarPausar,
  onResetarCiclo,
  onAtualizarConfig,
}: TimerPomodoroProps) {
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [focoInput, setFocoInput] = useState<string>(configAtual.duracaoFocoMin.toString());
  const [pausaCurtaInput, setPausaCurtaInput] = useState<string>(configAtual.duracaoPausaCurtaMin.toString());
  const [pausaLongaInput, setPausaLongaInput] = useState<string>(configAtual.duracaoPausaLongaMin.toString());
  const [ciclosPausaLongaInput, setCiclosPausaLongaInput] = useState<string>(configAtual.ciclosAtePausaLonga.toString());

  useEffect(() => {
    setFocoInput(configAtual.duracaoFocoMin.toString());
    setPausaCurtaInput(configAtual.duracaoPausaCurtaMin.toString());
    setPausaLongaInput(configAtual.duracaoPausaLongaMin.toString());
    setCiclosPausaLongaInput(configAtual.ciclosAtePausaLonga.toString());
  }, [configAtual]);

  const handleSalvarConfig = () => {
    const novasConfigs: Partial<ConfigPomodoro> = {
      duracaoFocoMin: parseInt(focoInput, 10) || configAtual.duracaoFocoMin,
      duracaoPausaCurtaMin: parseInt(pausaCurtaInput, 10) || configAtual.duracaoPausaCurtaMin,
      duracaoPausaLongaMin: parseInt(pausaLongaInput, 10) || configAtual.duracaoPausaLongaMin,
      ciclosAtePausaLonga: parseInt(ciclosPausaLongaInput, 10) || configAtual.ciclosAtePausaLonga,
    };
    if (novasConfigs.duracaoFocoMin! <= 0 || novasConfigs.duracaoPausaCurtaMin! <= 0 || novasConfigs.duracaoPausaLongaMin! <= 0 || novasConfigs.ciclosAtePausaLonga! <= 0) {
        toast.error("As durações e ciclos devem ser maiores que zero."); // toast aqui
        return;
    }
    onAtualizarConfig(novasConfigs);
    setMostrarConfig(false);
  };
  
  const getCicloTexto = (): string => {
    switch(cicloAtual) {
      case 'FOCO': return 'FOCO';
      case 'PAUSA_CURTA': return 'PAUSA CURTA';
      case 'PAUSA_LONGA': return 'PAUSA LONGA';
      default: return '';
    }
  };

  const getCorCiclo = (): string => {
    switch(cicloAtual) {
      case 'FOCO': return 'text-red-500 dark:text-red-400';
      case 'PAUSA_CURTA': return 'text-green-500 dark:text-green-400';
      case 'PAUSA_LONGA': return 'text-blue-500 dark:text-blue-400';
      default: return 'text-slate-700 dark:text-slate-300';
    }
  };

  let textoBotaoPrincipal = 'Iniciar';
  if (ativo) {
    textoBotaoPrincipal = 'Pausar';
  } else if (tempoRestante === 0) {
    if (cicloAtual === 'FOCO') {
      textoBotaoPrincipal = 'Iniciar Pausa';
    } else {
      textoBotaoPrincipal = 'Iniciar Foco';
    }
  }

  const PRESETS_POMODORO = [
    { nome: "Padrão (25/5)", foco: 25, pausaC: 5, pausaL: 15, ciclos: 4 },
    { nome: "Foco Longo (50/10)", foco: 50, pausaC: 10, pausaL: 20, ciclos: 4 },
    { nome: "Teste Rápido (1/1)", foco: 1, pausaC: 1, pausaL: 2, ciclos: 2 },
  ];

  const aplicarPreset = (preset: typeof PRESETS_POMODORO[0]) => {
    onAtualizarConfig({
        duracaoFocoMin: preset.foco,
        duracaoPausaCurtaMin: preset.pausaC,
        duracaoPausaLongaMin: preset.pausaL,
        ciclosAtePausaLonga: preset.ciclos
    });
    setFocoInput(preset.foco.toString());
    setPausaCurtaInput(preset.pausaC.toString());
    setPausaLongaInput(preset.pausaL.toString());
    setCiclosPausaLongaInput(preset.ciclos.toString());
  };

  return (
    <Card className="mb-6 shadow-lg dark:bg-slate-800/70 dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Timer Pomodoro</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setMostrarConfig(s => !s)} aria-label="Configurações do Pomodoro">
          <Settings2 className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4 pt-2">
        {mostrarConfig ? (
          <div className="w-full p-1 space-y-4">
            <h4 className="text-md font-medium text-center mb-3 text-slate-700 dark:text-slate-300">Configurações do Timer</h4>
            <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Presets:</p>
                <div className="flex flex-wrap gap-2">
                    {PRESETS_POMODORO.map(preset => (
                        <Button key={preset.nome} variant="outline" size="sm" onClick={() => aplicarPreset(preset)} className="dark:bg-slate-700 dark:hover:bg-slate-600">
                            {preset.nome}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <Label htmlFor="focoMin" className="text-xs text-slate-600 dark:text-slate-400">Foco (min)</Label>
                <Input id="focoMin" type="number" value={focoInput} onChange={(e) => setFocoInput(e.target.value)} className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
              <div>
                <Label htmlFor="pausaCurtaMin" className="text-xs text-slate-600 dark:text-slate-400">Pausa Curta (min)</Label>
                <Input id="pausaCurtaMin" type="number" value={pausaCurtaInput} onChange={(e) => setPausaCurtaInput(e.target.value)} className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
              <div>
                <Label htmlFor="pausaLongaMin" className="text-xs text-slate-600 dark:text-slate-400">Pausa Longa (min)</Label>
                <Input id="pausaLongaMin" type="number" value={pausaLongaInput} onChange={(e) => setPausaLongaInput(e.target.value)} className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
              <div>
                <Label htmlFor="ciclosPausaLonga" className="text-xs text-slate-600 dark:text-slate-400">Ciclos p/ P. Longa</Label>
                <Input id="ciclosPausaLonga" type="number" value={ciclosPausaLongaInput} onChange={(e) => setCiclosPausaLongaInput(e.target.value)} className="dark:bg-slate-700 dark:border-slate-600" />
              </div>
            </div>
            <Button onClick={handleSalvarConfig} size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              <Save className="w-4 h-4 mr-2" /> Salvar Configurações
            </Button>
          </div>
        ) : (
          <>
            <div 
              className={`text-7xl font-bold p-4 rounded-lg ${getCorCiclo()}`}
              style={{ fontFamily: 'monospace' }}
            >
              {formatarTempo(tempoRestante)}
            </div>
            <div className={`text-lg font-medium ${getCorCiclo()}`}>
              {getCicloTexto()} {cicloAtual === 'FOCO' && `(${ciclosCompletos + 1}º)`}
            </div>
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={onIniciarPausar} 
                size="lg" 
                className={`
                  ${ativo ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700" 
                         : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"}
                  text-white px-6 py-3 text-base
                `}
              >
                {ativo ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {textoBotaoPrincipal}
              </Button>
              <Button 
                onClick={onResetarCiclo} 
                variant="outline" 
                size="lg" 
                className="dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:border-slate-600 px-6 py-3 text-base"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Resetar Ciclo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground dark:text-slate-400 pt-2">Ciclos de foco completados: {ciclosCompletos}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}