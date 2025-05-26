'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog"; // Importar AlertDialog
import { CheckCircle2, Clock, Trash2 } from "lucide-react"; // Adicionado Trash2
import type { Tarefa, Categoria as CategoriaInfo } from "@/lib/types";

interface PainelTarefaProps {
  tarefa: Tarefa;
  numero: number;
  onConcluir: (tarefa: Tarefa) => void;
  onExcluir: (tarefaId: string, categoriaIdDaTarefa: string) => void; // Adicionada prop para excluir
  categoria: CategoriaInfo; // Usando CategoriaInfo para clareza
}

export default function PainelTarefa({ tarefa, numero, onConcluir, onExcluir, categoria }: PainelTarefaProps) {
  // Função para determinar a cor da borda e do texto com base na string da cor da categoria
  const obterEstiloCor = (corString: string | undefined) => {
    if (!corString) return { borderColor: '#718096', textColor: '#718096' }; // Cor padrão cinza

    // Remove "bg-" se presente e ajusta para Tailwind ou cores hex diretas
    // Esta lógica pode precisar de ajuste dependendo de como você armazena as cores
    if (corString.startsWith('#')) { // Já é um hexadecimal
      return { borderColor: corString, textColor: corString };
    }
    // Adicione mais mapeamentos se suas cores forem nomes de classes Tailwind
    switch (corString.replace('bg-', '').replace('-500', '')) {
      case 'blue': return { borderColor: '#3b82f6', textColor: '#3b82f6' };
      case 'green': return { borderColor: '#10b981', textColor: '#10b981' };
      case 'red': return { borderColor: '#ef4444', textColor: '#ef4444' };
      case 'yellow': return { borderColor: '#f59e0b', textColor: '#f59e0b' };
      case 'purple': return { borderColor: '#8b5cf6', textColor: '#8b5cf6' };
      default: return { borderColor: corString, textColor: corString }; // Tenta usar como cor direta
    }
  };

  const estiloCategoria = obterEstiloCor(categoria?.cor);

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 dark:bg-slate-800 dark:border-slate-700" // Aumentei o hover:scale
      style={{ borderLeftColor: estiloCategoria.borderColor }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Badge
            variant="secondary"
            className="text-md font-bold min-w-[2.5rem] h-9 flex items-center justify-center dark:bg-slate-700 dark:text-slate-200" // Ajustado tamanho
          >
            {numero}
          </Badge>

          <div className="flex-1 space-y-1.5"> {/* Ajustado espaçamento */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{categoria?.emoji || '📁'}</span> {/* Emoji padrão */}
              <span className="text-sm font-semibold" style={{color: estiloCategoria.textColor}}>
                {categoria?.nome || 'Sem Categoria'} {/* Nome padrão */}
              </span>
            </div>

            <p className="text-md leading-relaxed dark:text-slate-300"> {/* Aumentado texto */}
              {tarefa.texto}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {/* Se você tiver a data de criação na tarefa, pode formatá-la aqui */}
                <span>Criada em: {new Date(tarefa.criadaEm).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={() => onConcluir(tarefa)}
                  size="sm"
                  variant="ghost" // Mudei para ghost para ser mais sutil
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-700/20 gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir
                </Button>

                {/* AlertDialog para Excluir Tarefa */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700/20"
                      aria-label="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
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
                        className="bg-red-600 hover:bg-red-700" // Estilo padrão shadcn para destrutivo
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}