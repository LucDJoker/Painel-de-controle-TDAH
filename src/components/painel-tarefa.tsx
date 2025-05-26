'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { CheckCircle, Trash2, Edit3, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Tarefa, Categoria as CategoriaInfo, SubTarefa } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface PainelTarefaProps {
  tarefa: Tarefa;
  numero: number;
  categoria: CategoriaInfo;
  onConcluir: (tarefa: Tarefa) => void;
  onExcluir: (tarefaId: string, categoriaIdDaTarefa: string) => void; 
  onEditar: (tarefa: Tarefa) => void;
  onAdicionarSubTarefa: (tarefaPaiId: string, categoriaId: string, textoSubTarefa: string) => void;
  onAlternarCompletarSubTarefa: (tarefaPaiId: string, categoriaId: string, subTarefaId: string) => void;
  onExcluirSubTarefa: (tarefaPaiId: string, categoriaId: string, subTarefaId: string) => void;
}

export default function PainelTarefa({ 
  tarefa, numero, categoria, onConcluir, onExcluir, onEditar,
  onAdicionarSubTarefa, onAlternarCompletarSubTarefa, onExcluirSubTarefa 
}: PainelTarefaProps) {
  const corCategoria = categoria?.cor || '#718096';
  const [textoNovaSubtarefa, setTextoNovaSubtarefa] = useState('');
  const [mostrarSubtarefas, setMostrarSubtarefas] = useState(false);

  const handleAdicionarSubtarefaLocal = () => {
    if (textoNovaSubtarefa.trim()) {
      onAdicionarSubTarefa(tarefa.id, tarefa.categoriaId, textoNovaSubtarefa);
      setTextoNovaSubtarefa('');
    }
  };
  
  const subTarefasExistentes = tarefa.subTarefas || [];
  const subTarefasCompletas = subTarefasExistentes.filter(st => st.completada).length;
  const totalSubTarefas = subTarefasExistentes.length;
  const progressoSubTarefas = totalSubTarefas > 0 ? Math.round((subTarefasCompletas / totalSubTarefas) * 100) : 0;

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 rounded-lg"
      style={{ borderLeft: `4px solid ${corCategoria}` }}
    >
      <CardContent className="p-3 space-y-2"> 
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-grow min-w-0">
            <span 
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white mt-1"
              style={{ backgroundColor: corCategoria }}
            >
              {numero}
            </span>
            <div className="flex-grow min-w-0">
              <p className="text-md font-medium break-words dark:text-slate-100">{tarefa.texto}</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400" style={{ color: corCategoria }}>
                {categoria?.emoji || '📁'} {categoria?.nome || 'Sem Categoria'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={() => onEditar(tarefa)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-700/30 rounded-full w-9 h-9" aria-label="Editar tarefa"> <Edit3 className="w-4 h-4" /> </Button>
            <Button variant="ghost" size="icon" onClick={() => onConcluir(tarefa)} className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-700/30 rounded-full w-9 h-9" aria-label="Concluir tarefa"> <CheckCircle className="w-5 h-5" /> </Button>
            <AlertDialog>
              {/* CORREÇÃO AQUI: O Trigger é o ícone/div, não um Button aninhado */}
              <AlertDialogTrigger 
                asChild // Pode tentar com asChild se quiser que o div aja como o botão do shadcn
                className="inline-flex items-center justify-center rounded-full w-9 h-9 text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-0 cursor-pointer" // Estilos de botão
                aria-label="Excluir tarefa"
              >
                <div><Trash2 className="w-5 h-5" /></div>
              </AlertDialogTrigger>
              <AlertDialogContent className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                 <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription className="dark:text-slate-400">Tem certeza que deseja excluir a tarefa "{tarefa.texto}"?</AlertDialogDescription></AlertDialogHeader>
                 <AlertDialogFooter><AlertDialogCancel className="dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onExcluir(tarefa.id, tarefa.categoriaId)} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 dark:text-slate-50">Excluir</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="pl-10 space-y-2 mt-1">
            {(totalSubTarefas > 0 || mostrarSubtarefas) && (
                 <div className="flex items-center justify-between mb-2">
                    <Button variant="link" size="sm" onClick={() => setMostrarSubtarefas(!mostrarSubtarefas)} className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400">
                        {mostrarSubtarefas ? <ChevronUp className="w-3 h-3 mr-1"/> : <ChevronDown className="w-3 h-3 mr-1"/>}
                        Sub-tarefas ({subTarefasCompletas}/{totalSubTarefas})
                    </Button>
                    {totalSubTarefas > 0 && <div className="w-1/2"> <Progress value={progressoSubTarefas} className="h-1.5 [&>div]:bg-blue-500" /> </div>}
                </div>
            )}

            {mostrarSubtarefas && subTarefasExistentes.map(sub => (
              <div key={sub.id} className="flex items-center justify-between gap-2 text-sm ml-2 py-1 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`sub-${tarefa.id}-${sub.id}`}
                    checked={sub.completada}
                    onCheckedChange={() => onAlternarCompletarSubTarefa(tarefa.id, tarefa.categoriaId, sub.id)}
                    className="dark:border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-primary-foreground"
                  />
                  <label 
                    htmlFor={`sub-${tarefa.id}-${sub.id}`} 
                    className={`cursor-pointer ${sub.completada ? 'line-through text-muted-foreground dark:text-slate-500' : 'dark:text-slate-300'}`}
                  >
                    {sub.texto}
                  </label>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => onExcluirSubTarefa(tarefa.id, tarefa.categoriaId, sub.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          
            {/* Input para adicionar nova sub-tarefa */}
            {/* Condicional para mostrar o input de sub-tarefa apenas se mostrarSubtarefas for true */}
            {mostrarSubtarefas && (
                <div className="mt-2 flex gap-2 ml-2">
                    <Input 
                        type="text"
                        placeholder="Nova sub-tarefa..."
                        value={textoNovaSubtarefa}
                        onChange={(e) => setTextoNovaSubtarefa(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdicionarSubtarefaLocal(); }}
                        className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600"
                    />
                    <Button size="icon" onClick={handleAdicionarSubtarefaLocal} variant="ghost" className="h-8 w-8 dark:hover:bg-slate-700">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}