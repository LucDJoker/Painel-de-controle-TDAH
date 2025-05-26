'use client';

import { Card, CardContent } from "@/components/ui/card"; // Adicionado CardContent para melhor estrutura
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { CheckCircle, Trash2, Edit3 } from "lucide-react"; // Adicionado Edit3
import type { Tarefa, Categoria as CategoriaInfo } from "@/lib/types";

interface PainelTarefaProps {
  tarefa: Tarefa;
  numero: number;
  categoria: CategoriaInfo;
  onConcluir: (tarefa: Tarefa) => void;
  onExcluir: (tarefaId: string, categoriaIdDaTarefa: string) => void; 
  onEditar: (tarefa: Tarefa) => void; // <-- NOVA PROP PARA CHAMAR O MODAL DE EDIÇÃO
}

export default function PainelTarefa({ tarefa, numero, categoria, onConcluir, onExcluir, onEditar }: PainelTarefaProps) {
  const corCategoria = categoria?.cor || '#718096';
  
  return (
    <Card 
      className="flex items-center justify-between p-3 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700 rounded-lg"
      style={{ borderLeft: `4px solid ${corCategoria}` }}
    >
      <div className="flex items-center gap-3 flex-grow min-w-0">
        <span 
          className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
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
        {/* BOTÃO DE EDITAR */}
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditar(tarefa)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-700/30 rounded-full w-9 h-9"
            aria-label="Editar tarefa"
        >
            <Edit3 className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onConcluir(tarefa)}
          className="text-green-600 hover:text-green-700 hover:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-700/30 rounded-full w-9 h-9"
          aria-label="Concluir tarefa"
        >
          <CheckCircle className="w-5 h-5" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-700/30 rounded-full w-9 h-9"
              aria-label="Excluir tarefa"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-slate-400">
                Tem certeza que deseja excluir a tarefa "{tarefa.texto}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onExcluir(tarefa.id, tarefa.categoriaId)} 
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}