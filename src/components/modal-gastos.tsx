'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import type { Gasto } from '@/lib/types';

interface ModalGastosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Date;
  onAdicionarGasto: (gasto: Gasto) => void;
  categorias?: string[];
}

const categoriasDefault = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Diversão',
  'Moradia',
  'Utilidades',
  'Outro',
];

export function ModalGastos({
  open,
  onOpenChange,
  data,
  onAdicionarGasto,
  categorias = categoriasDefault,
}: ModalGastosProps) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Outro');
  const [anotacoes, setAnotacoes] = useState('');
  const [fixo, setFixo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const v = Number.parseFloat(valor.replace(',', '.')) || 0;
    if (v <= 0 || !descricao.trim()) {
      alert('Preencha descrição e valor válido');
      return;
    }

    const novoGasto: Gasto = {
      id: `gasto-${Date.now()}`,
      descricao: descricao.trim(),
      valor: v,
      categoria,
      data: data.toISOString(),
      anotacoes: anotacoes.trim() || undefined,
      fixo: fixo || undefined,
    };

    onAdicionarGasto(novoGasto);

    // Limpar formulário
    setDescricao('');
    setValor('');
    setCategoria('Outro');
    setAnotacoes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Adicionar Gasto - {data.toLocaleDateString('pt-BR')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Ex: Almoço no restaurante"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                placeholder="0,00"
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anotacoes">Anotações (opcional)</Label>
            <Textarea
              id="anotacoes"
              placeholder="Observações adicionais..."
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={fixo} onCheckedChange={(v) => setFixo(Boolean(v))} id="fixo" />
            <Label htmlFor="fixo">Gasto fixo (recorrente)</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar Gasto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
