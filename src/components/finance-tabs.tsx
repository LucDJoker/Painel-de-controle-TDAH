'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Settings, Trash2, Plus, Pin, ChevronUp, HelpCircle, Wallet, CreditCard } from 'lucide-react';
import type { Gasto, Receita, CategoriaGasto } from '@/lib/types';

interface FinanceTabsProps {
  gastos: Gasto[];
  receitas: Receita[];
  categoriasGastos: CategoriaGasto[];
  onAdicionarGasto: (gasto: Gasto) => void;
  onRemoverGasto: (id: string) => void;
  onAtualizarGasto?: (gasto: Gasto) => void;
  onAdicionarReceita: (receita: Receita) => void;
  onRemoverReceita: (id: string) => void;
  onAdicionarCategoria: (categoria: CategoriaGasto) => void;
  onRemoverCategoria: (id: string) => void;
  dataAtual: Date;
}

type AbaSelecionada = 'gastos' | 'receitas' | 'categorias';

export function FinanceTabs({
  gastos,
  receitas,
  categoriasGastos,
  onAdicionarGasto,
  onRemoverGasto,
  onAdicionarReceita,
  onRemoverReceita,
  onAdicionarCategoria,
  onRemoverCategoria,
  dataAtual,
}: FinanceTabsProps) {
  // Estados para expandir/minimizar seções
  const [expandGastos, setExpandGastos] = useState(true);
  const [expandReceitas, setExpandReceitas] = useState(true);
  const [expandResumo, setExpandResumo] = useState(true);

  // Modal unificado para entrada e saída
  const [showModalTransacao, setShowModalTransacao] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<'gasto' | 'receita'>('gasto');
  const [showModalCategoria, setShowModalCategoria] = useState(false);

  // Form unificado
  const [descricaoTransacao, setDescricaoTransacao] = useState('');
  const [valorTransacao, setValorTransacao] = useState('');
  const [categoriaTransacao, setCategoriaTransacao] = useState('');
  const [anotacoesTransacao, setAnotacoesTransacao] = useState('');
  const [fixoTransacao, setFixoTransacao] = useState(false);

  // Form categoria
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [emojiCategoria, setEmojiCategoria] = useState('📝');
  const [corCategoria, setCorCategoria] = useState('#3b82f6');
  const [tipoCategoria, setTipoCategoria] = useState<'gasto' | 'receita'>('gasto');

  const gastosMes = useMemo(() => {
    const inicio = startOfMonth(dataAtual);
    const fim = endOfMonth(dataAtual);
    return gastos.filter((g) => {
      const dataGasto = new Date(g.data);
      return dataGasto >= inicio && dataGasto <= fim;
    });
  }, [gastos, dataAtual]);

  const receitasMes = useMemo(() => {
    const inicio = startOfMonth(dataAtual);
    const fim = endOfMonth(dataAtual);
    return receitas.filter((r) => {
      const dataReceita = new Date(r.data);
      return dataReceita >= inicio && dataReceita <= fim;
    });
  }, [receitas, dataAtual]);

  const totalGastos = useMemo(() => gastosMes.reduce((sum, g) => sum + g.valor, 0), [gastosMes]);
  const totalReceitas = useMemo(() => receitasMes.reduce((sum, r) => sum + r.valor, 0), [receitasMes]);
  const saldo = totalReceitas - totalGastos;

  const handleAdicionarCategoria = () => {
    if (!nomeCategoria.trim()) {
      alert('Digite um nome para a categoria');
      return;
    }
    const novaCategoria: CategoriaGasto = {
      id: `cat_${Date.now()}`,
      nome: nomeCategoria.trim(),
      emoji: emojiCategoria,
      cor: corCategoria,
      tipo: tipoCategoria,
    };
    onAdicionarCategoria(novaCategoria);
    setNomeCategoria('');
    setEmojiCategoria('📝');
    setCorCategoria('#3b82f6');
    setTipoCategoria('gasto');
    setShowModalCategoria(false);
  };

  const handleAdicionarTransacao = () => {
    const v = Number.parseFloat(valorTransacao.replace(',', '.')) || 0;
    if (v <= 0 || !descricaoTransacao.trim() || !categoriaTransacao) {
      alert('Preencha descrição, valor e categoria');
      return;
    }

    if (tipoTransacao === 'gasto') {
      const novoGasto: Gasto = {
        id: `gasto_${Date.now()}`,
        descricao: descricaoTransacao.trim(),
        valor: v,
        categoria: categoriaTransacao,
        data: new Date().toISOString(),
        anotacoes: anotacoesTransacao.trim() || undefined,
        fixo: fixoTransacao || undefined,
      };
      onAdicionarGasto(novoGasto);
    } else {
      const novaReceita: Receita = {
        id: `receita_${Date.now()}`,
        descricao: descricaoTransacao.trim(),
        valor: v,
        categoria: categoriaTransacao,
        data: new Date().toISOString(),
        anotacoes: anotacoesTransacao.trim() || undefined,
      };
      onAdicionarReceita(novaReceita);
    }

    // Limpar form
    setDescricaoTransacao('');
    setValorTransacao('');
    setCategoriaTransacao('');
    setAnotacoesTransacao('');
    setFixoTransacao(false);
    setShowModalTransacao(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho mais didático */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
          <Wallet className="w-6 h-6" />
          💰 Controle Financeiro
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Gerencie seus gastos e receitas de forma simples. Comece criando categorias e depois adicione suas transações.
        </p>
      </div>

      {/* Botões de ação principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button 
          onClick={() => { setTipoTransacao('gasto'); setShowModalTransacao(true); }} 
          className="bg-red-500 hover:bg-red-600 text-white h-12"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          📉 Registrar Gasto
        </Button>
        <Button 
          onClick={() => { setTipoTransacao('receita'); setShowModalTransacao(true); }} 
          className="bg-green-500 hover:bg-green-600 text-white h-12"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          📈 Registrar Receita
        </Button>
        <Button 
          onClick={() => setShowModalCategoria(true)} 
          variant="outline" 
          className="h-12 border-2 border-dashed border-gray-300 hover:border-blue-400"
        >
          <Settings className="w-5 h-5 mr-2" />
          📁 Nova Categoria
        </Button>
      </div>

      {/* Resumo Financeiro mais visual */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              📊 Resumo do Mês
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                ({format(dataAtual, 'MMMM yyyy', { locale: ptBR })})
              </span>
            </CardTitle>
            <button
              onClick={() => setExpandResumo(!expandResumo)}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition"
            >
              <ChevronUp 
                className={`w-5 h-5 transition-transform ${expandResumo ? 'rotate-0' : 'rotate-180'}`}
              />
            </button>
          </div>
        </CardHeader>
        {expandResumo && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <div className="text-3xl mb-2">📉</div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Total de Gastos</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {totalGastos.toFixed(2)}</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{gastosMes.length} transações</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalReceitas.toFixed(2)}</p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">{receitasMes.length} entradas</p>
            </div>
            <div className={`text-center p-4 rounded-lg border-2 ${saldo >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'}`}>
              <div className="text-3xl mb-2">{saldo >= 0 ? '💰' : '⚠️'}</div>
              <p className={`text-sm font-medium mb-1 ${saldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>Saldo Final</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                R$ {saldo.toFixed(2)}
              </p>
              <p className={`text-xs mt-1 ${saldo >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                {saldo >= 0 ? 'Positivo ✅' : 'Negativo ⚠️'}
              </p>
            </div>
          </div>
          {categoriasGastos.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium">💡 Dica:</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Comece criando algumas categorias (ex: Alimentação, Transporte, Salário) para organizar melhor suas finanças!
              </p>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Transações Recentes */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gastos */}
          <Card className="border-red-200 dark:border-red-700">
            <CardHeader className="pb-3 bg-red-50 dark:bg-red-900/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                  📉 Gastos Recentes
                </CardTitle>
                <button
                  onClick={() => setExpandGastos(!expandGastos)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition"
                >
                  <ChevronUp 
                    className={`w-5 h-5 transition-transform ${expandGastos ? 'rotate-0' : 'rotate-180'}`}
                  />
                </button>
              </div>
            </CardHeader>
            {expandGastos && (
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {gastosMes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhum gasto registrado ainda</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Clique em "Registrar Gasto" para começar</p>
                  </div>
                ) : (
                    gastosMes
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .slice(0, 10)
                      .map((g) => {
                        const cat = categoriasGastos.find((c) => c.nome === g.categoria);
                        return (
                          <div key={g.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="text-lg">{cat?.emoji || '💸'}</span>
                                {g.descricao}
                                {g.fixo && <span className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full">📌 Fixo</span>}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                📅 {format(new Date(g.data), 'dd/MM/yyyy', { locale: ptBR })} • 📁 {g.categoria}
                              </div>
                              {g.anotacoes && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                  💭 {g.anotacoes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600 dark:text-red-400 text-lg">-R$ {g.valor.toFixed(2)}</span>
                              <button
                                onClick={() => onRemoverGasto(g.id)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 p-2 rounded-full transition"
                                title="Excluir gasto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                )}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Receitas */}
          <Card className="border-green-200 dark:border-green-700">
            <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                  📈 Receitas Recentes
                </CardTitle>
                <button
                  onClick={() => setExpandReceitas(!expandReceitas)}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition"
                >
                  <ChevronUp 
                    className={`w-5 h-5 transition-transform ${expandReceitas ? 'rotate-0' : 'rotate-180'}`}
                  />
                </button>
              </div>
            </CardHeader>
            {expandReceitas && (
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {receitasMes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">💰</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhuma receita registrada ainda</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Clique em "Registrar Receita" para começar</p>
                  </div>
                ) : (
                  receitasMes
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .slice(0, 10)
                    .map((r) => {
                      const cat = categoriasGastos.find((c) => c.nome === r.categoria);
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              <span className="text-lg">{cat?.emoji || '💰'}</span>
                              {r.descricao}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              📅 {format(new Date(r.data), 'dd/MM/yyyy', { locale: ptBR })} • 📁 {r.categoria}
                            </div>
                            {r.anotacoes && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                💭 {r.anotacoes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-600 dark:text-green-400 text-lg">+R$ {r.valor.toFixed(2)}</span>
                            <button
                              onClick={() => onRemoverReceita(r.id)}
                              className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 p-2 rounded-full transition"
                              title="Excluir receita"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Transação mais didático */}
      <Dialog open={showModalTransacao} onOpenChange={setShowModalTransacao}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {tipoTransacao === 'gasto' ? '📉 Registrar Novo Gasto' : '📈 Registrar Nova Receita'}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {tipoTransacao === 'gasto' 
                ? 'Registre um dinheiro que você gastou (saída)' 
                : 'Registre um dinheiro que você recebeu (entrada)'
              }
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Seletor de Tipo mais visual */}
            <div>
              <Label className="text-sm font-semibold">🔄 Tipo de Transação</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setTipoTransacao('gasto')}
                  className={`p-3 rounded-lg border-2 transition ${
                    tipoTransacao === 'gasto'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📉</div>
                  <div className="font-medium">Gasto</div>
                  <div className="text-xs text-gray-500">Dinheiro que saiu</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoTransacao('receita')}
                  className={`p-3 rounded-lg border-2 transition ${
                    tipoTransacao === 'receita'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📈</div>
                  <div className="font-medium">Receita</div>
                  <div className="text-xs text-gray-500">Dinheiro que entrou</div>
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold flex items-center gap-1">
                📝 Descrição *
              </Label>
              <Input
                placeholder={tipoTransacao === 'gasto' ? 'Ex: Almoço no restaurante' : 'Ex: Salário do mês'}
                value={descricaoTransacao}
                onChange={(e) => setDescricaoTransacao(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1">
                  💰 Valor (R$) *
                </Label>
                <Input
                  placeholder="Ex: 25,50"
                  value={valorTransacao}
                  onChange={(e) => setValorTransacao(e.target.value)}
                  className="mt-1 text-lg font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1">
                  📁 Categoria *
                </Label>
                <Select value={categoriaTransacao} onValueChange={setCategoriaTransacao}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasGastos
                      .filter((c) => c.tipo === tipoTransacao)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.nome}>
                          {cat.emoji} {cat.nome}
                        </SelectItem>
                      ))}
                    {categoriasGastos.filter((c) => c.tipo === tipoTransacao).length === 0 && (
                      <SelectItem value="" disabled>
                        Nenhuma categoria encontrada
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {tipoTransacao === 'gasto' && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox 
                  id="fixo" 
                  checked={fixoTransacao} 
                  onCheckedChange={(checked) => setFixoTransacao(checked as boolean)}
                />
                <div>
                  <Label htmlFor="fixo" className="text-sm font-medium cursor-pointer">📌 Gasto fixo/recorrente</Label>
                  <p className="text-xs text-gray-600">Ex: aluguel, internet, plano de celular</p>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold flex items-center gap-1">
                💭 Anotações (opcional)
              </Label>
              <Textarea
                placeholder="Ex: Almoço com colegas de trabalho, dividido em 3 pessoas..."
                value={anotacoesTransacao}
                onChange={(e) => setAnotacoesTransacao(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModalTransacao(false)} className="flex-1">
              ❌ Cancelar
            </Button>
            <Button 
              onClick={handleAdicionarTransacao} 
              className={`flex-1 ${tipoTransacao === 'gasto' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={!descricaoTransacao.trim() || !valorTransacao || !categoriaTransacao}
            >
              {tipoTransacao === 'gasto' ? '📉 Registrar Gasto' : '📈 Registrar Receita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Categoria mais didático */}
      <Dialog open={showModalCategoria} onOpenChange={setShowModalCategoria}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              📁 Criar Nova Categoria
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Categorias ajudam a organizar seus gastos e receitas. Ex: Alimentação, Transporte, Salário.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-1">
                📝 Nome da Categoria *
              </Label>
              <Input
                placeholder="Ex: Alimentação, Transporte, Salário..."
                value={nomeCategoria}
                onChange={(e) => setNomeCategoria(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold flex items-center gap-1">
                🎯 Tipo da Categoria *
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setTipoCategoria('gasto')}
                  className={`p-3 rounded-lg border-2 transition ${
                    tipoCategoria === 'gasto'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📉</div>
                  <div className="font-medium">Para Gastos</div>
                  <div className="text-xs text-gray-500">Saídas de dinheiro</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCategoria('receita')}
                  className={`p-3 rounded-lg border-2 transition ${
                    tipoCategoria === 'receita'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📈</div>
                  <div className="font-medium">Para Receitas</div>
                  <div className="text-xs text-gray-500">Entradas de dinheiro</div>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1">
                  😊 Emoji
                </Label>
                <Input
                  placeholder="Ex: 🍔"
                  value={emojiCategoria}
                  onChange={(e) => setEmojiCategoria(e.target.value)}
                  maxLength={2}
                  className="mt-1 text-center text-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1">
                  🎨 Cor
                </Label>
                <Input
                  type="color"
                  value={corCategoria}
                  onChange={(e) => setCorCategoria(e.target.value)}
                  className="mt-1 h-10 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModalCategoria(false)} className="flex-1">
              ❌ Cancelar
            </Button>
            <Button 
              onClick={handleAdicionarCategoria} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!nomeCategoria.trim()}
            >
              📁 Criar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
