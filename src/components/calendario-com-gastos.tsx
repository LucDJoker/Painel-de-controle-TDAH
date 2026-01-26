'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarioTarefas, type CalendarEvent } from '@/components/calendario-tarefas';
import { obterFeriados } from '@/lib/feriados';
import { estadosCidades } from '@/lib/cidades';
import { ModalGastos } from '@/components/modal-gastos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Gasto, Tarefa, Categoria } from '@/lib/types';
import { DollarSign, Trash2, X } from 'lucide-react';
import type { View, NavigateAction } from 'react-big-calendar';

interface CalendarioComGastosProps {
  tarefas: CalendarEvent[];
  gastos: Gasto[];
  onAdicionarGasto: (gasto: Gasto) => void;
  onRemoverGasto: (id: string) => void;
  currentDate: Date;
  currentView: string;
  onNavigate: (newDate: Date, view: View, action: NavigateAction) => void;
  onView: (view: View) => void;
}

const CATEGORIAS_GASTOS = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Diversão',
  'Moradia',
  'Utilidades',
  'Trabalho',
  'Outro',
];

const CORES_CATEGORIAS: Record<string, string> = {
  'Alimentação': '#FF6B6B',
  'Transporte': '#4ECDC4',
  'Saúde': '#45B7D1',
  'Educação': '#FFA07A',
  'Diversão': '#98D8C8',
  'Moradia': '#F7DC6F',
  'Utilidades': '#BB8FCE',
  'Trabalho': '#85C1E2',
  'Outro': '#BDC3C7',
};

export function CalendarioComGastos({
  tarefas,
  gastos,
  onAdicionarGasto,
  onRemoverGasto,
  currentDate,
  currentView,
  onNavigate,
  onView,
}: CalendarioComGastosProps) {
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [showDetalhesGastos, setShowDetalhesGastos] = useState(false);
  const [feriadosEventos, setFeriadosEventos] = useState<CalendarEvent[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState<string | null>(() => {
    try { return localStorage.getItem('user_state') || null; } catch { return null; }
  });
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(() => {
    try { return localStorage.getItem('user_city') || null; } catch { return null; }
  });

  // Calcula resumo do mês
  const gastosDoMes = useMemo(() => {
    const inicio = startOfMonth(currentDate);
    const fim = endOfMonth(currentDate);
    return gastos.filter((g) => {
      const dataGasto = new Date(g.data);
      return dataGasto >= inicio && dataGasto <= fim;
    });
  }, [gastos, currentDate]);

  const totalMensal = useMemo(
    () => gastosDoMes.reduce((sum, g) => sum + g.valor, 0),
    [gastosDoMes]
  );

  const gastossPorCategoria = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const g of gastosDoMes) {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.valor;
    }
    return acc;
  }, [gastosDoMes]);

  // Calcula gastos do dia selecionado
  const gastosDiaAtual = useMemo(() => {
    if (!dataSelecionada) return [];
    return gastos.filter((g) =>
      isSameDay(new Date(g.data), dataSelecionada)
    );
  }, [gastos, dataSelecionada]);

  // Lista simples de UFs brasileiras para seleção
  const UFS: { code: string; name: string }[] = [
    { code: 'AC', name: 'Acre' },{ code: 'AL', name: 'Alagoas' },{ code: 'AP', name: 'Amapá' },{ code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },{ code: 'CE', name: 'Ceará' },{ code: 'DF', name: 'Distrito Federal' },{ code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },{ code: 'MA', name: 'Maranhão' },{ code: 'MT', name: 'Mato Grosso' },{ code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },{ code: 'PA', name: 'Pará' },{ code: 'PB', name: 'Paraíba' },{ code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },{ code: 'PI', name: 'Piauí' },{ code: 'RJ', name: 'Rio de Janeiro' },{ code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },{ code: 'RO', name: 'Rondônia' },{ code: 'RR', name: 'Roraima' },{ code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },{ code: 'SE', name: 'Sergipe' },{ code: 'TO', name: 'Tocantins' }
  ];

  const cidadesDoEstado = ufSelecionada ? estadosCidades[ufSelecionada]?.cidades || [] : [];

  useEffect(() => {
    let mounted = true;
    const ano = currentDate.getFullYear();
    obterFeriados(ano, 'BR', ufSelecionada || undefined).then((list) => {
      if (!mounted) return;
      const evs: CalendarEvent[] = list.map((f: { localName?: string; name: string; date: string }) => ({
        title: `Feriado: ${f.localName || f.name}`,
        start: new Date(f.date),
        end: new Date(f.date),
        allDay: true,
      }));
      setFeriadosEventos(evs);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [currentDate, ufSelecionada]);

  const totalDiario = useMemo(
    () => gastosDiaAtual.reduce((sum, g) => sum + g.valor, 0),
    [gastosDiaAtual]
  );

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots?: Date[] | string[]; action?: 'select' | 'click' | 'doubleClick' }) => {
    setDataSelecionada(slotInfo.start);
    setShowModalGasto(true);
  };

  return (
    <div className="space-y-4">
      {/* Seletor de UF e Cidade para feriados locais */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm font-medium">📍 Feriados de:</div>
        <select
          value={ufSelecionada || ''}
          onChange={(e) => { 
            const v = e.target.value || null; 
            setUfSelecionada(v); 
            setCidadeSelecionada(null);
            try { 
              if (v) localStorage.setItem('user_state', v); 
              else localStorage.removeItem('user_state');
              localStorage.removeItem('user_city');
            } catch {} 
          }}
          className="px-3 py-2 border rounded bg-white dark:bg-slate-800 text-sm font-medium"
        >
          <option value="">🇧🇷 Apenas feriados nacionais</option>
          {UFS.map((u) => (
            <option key={u.code} value={u.code}>{u.code} - {u.name}</option>
          ))}
        </select>
        
        {ufSelecionada && cidadesDoEstado.length > 0 && (
          <select
            value={cidadeSelecionada || ''}
            onChange={(e) => { 
              const v = e.target.value || null; 
              setCidadeSelecionada(v); 
              try { 
                if (v) localStorage.setItem('user_city', v); 
                else localStorage.removeItem('user_city');
              } catch {} 
            }}
            className="px-3 py-2 border rounded bg-white dark:bg-slate-800 text-sm font-medium"
          >
            <option value="">📍 {estadosCidades[ufSelecionada]?.name}</option>
            {cidadesDoEstado.map((cidade) => (
              <option key={cidade} value={cidade}>{cidade}</option>
            ))}
          </select>
        )}
      </div>

      {/* Calendário Principal */}
      <CalendarioTarefas
        events={[...tarefas, ...feriadosEventos]}
        currentDate={currentDate}
        currentView={currentView as 'month' | 'week' | 'day' | 'agenda'}
        onNavigate={onNavigate}
        onView={onView}
        onSelectSlot={handleSelectSlot}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resumo Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Gastos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-green-600">
              R$ {totalMensal.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {gastosDoMes.length} transação(ões)
            </div>

            {Object.keys(gastossPorCategoria).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Por categoria:</div>
                <div className="space-y-1">
                  {Object.entries(gastossPorCategoria).map(([cat, valor]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-medium">R$ {valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowDetalhesGastos(true)}
              variant="outline"
              className="w-full"
            >
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>

        {/* Gastos do Dia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Gastos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-blue-600">
              R$ {gastosDiaAtual.filter(g => isSameDay(new Date(g.data), new Date())).reduce((s, g) => s + g.valor, 0).toFixed(2)}
            </div>

            {gastosDiaAtual.filter(g => isSameDay(new Date(g.data), new Date())).length > 0 && (
              <div className="space-y-2">
                {gastosDiaAtual
                  .filter(g => isSameDay(new Date(g.data), new Date()))
                  .map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{g.descricao}</div>
                        <div className="text-xs text-gray-500">{g.categoria}</div>
                      </div>
                      <div className="font-semibold">R$ {g.valor.toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            )}

            <Button
              onClick={() => {
                setDataSelecionada(new Date());
                setShowModalGasto(true);
              }}
              className="w-full"
            >
              + Adicionar Gasto Hoje
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Adicionar Gasto */}
      {dataSelecionada && (
        <ModalGastos
          open={showModalGasto}
          onOpenChange={setShowModalGasto}
          data={dataSelecionada}
          onAdicionarGasto={onAdicionarGasto}
          categorias={CATEGORIAS_GASTOS}
        />
      )}

      {/* Dialog de Detalhes de Gastos do Mês */}
      <Dialog open={showDetalhesGastos} onOpenChange={setShowDetalhesGastos}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gastos de {format(currentDate, 'MMMM/yyyy', { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo por Categoria */}
            <div className="space-y-2">
              <h3 className="font-semibold">Resumo por Categoria:</h3>
              <div className="space-y-2">
                {Object.entries(gastossPorCategoria).map(([cat, valor]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: CORES_CATEGORIAS[cat] }}
                      />
                      <span className="font-medium">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">R$ {valor.toFixed(2)}</span>
                      <span className="text-sm text-gray-600">
                        ({((valor / totalMensal) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr />

            {/* Lista de Gastos */}
            <div className="space-y-2">
              <h3 className="font-semibold">
                Todos os gastos ({gastosDoMes.length}):
              </h3>
              <div className="space-y-2">
                {gastosDoMes
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{g.descricao}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(g.data), 'dd/MM/yyyy', { locale: ptBR })} •{' '}
                          {g.categoria}
                        </div>
                        {g.anotacoes && (
                          <div className="text-sm text-gray-500 italic">
                            {g.anotacoes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">R$ {g.valor.toFixed(2)}</div>
                        <button
                          onClick={() => onRemoverGasto(g.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total do Mês:</span>
                <span className="text-green-600">R$ {totalMensal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
