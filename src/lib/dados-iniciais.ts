// src/lib/dados-iniciais.ts
import type { DadosApp, Categoria, Tarefa, ConfigPomodoro, SubTarefa } from './types';

const categoriasIniciais: Record<string, Categoria> = {
  pessoal: { id: 'pessoal', nome: 'Pessoal', emoji: '😊', cor: '#4299E1' },
  trabalho: { id: 'trabalho', nome: 'Trabalho', emoji: '💼', cor: '#9F7AEA' },
  estudos: { id: 'estudos', nome: 'Estudos', emoji: '📚', cor: '#ED8936' },
  casa: { id: 'casa', nome: 'Casa', emoji: '🏠', cor: '#48BB78' },
};

const tarefasIniciais: Record<string, Tarefa[]> = {
  estudos: [
    { 
      id: `tarefa_estudos_1_${Date.now()}`, 
      texto: 'Aprender Sub-tarefas em React', 
      categoriaId: 'estudos', 
      criadaEm: new Date(), 
      completada: false, 
      alarme: undefined,
      subTarefas: [
        { id: `sub_1_1_${Date.now()}`, texto: 'Definir tipos para SubTarefa', completada: false },
        { id: `sub_1_2_${Date.now()+1}`, texto: 'Atualizar hook usePainel', completada: false },
        { id: `sub_1_3_${Date.now()+2}`, texto: 'Modificar UI em PainelTarefa', completada: false },
      ]
    },
    { id: `tarefa_estudos_2_${Date.now() + 3}`, texto: 'Começar projeto de Calendário', categoriaId: 'estudos', criadaEm: new Date(), completada: false, alarme: undefined, subTarefas: [] },
  ],
  casa: [
    { id: `tarefa_casa_1_${Date.now() + 4}`, texto: 'Limpar a cozinha', categoriaId: 'casa', criadaEm: new Date(), completada: false, alarme: undefined, 
      subTarefas: [
        { id: `sub_2_1_${Date.now()}`, texto: 'Lavar louça', completada: false },
        { id: `sub_2_2_${Date.now()+1}`, texto: 'Limpar fogão', completada: false },
      ]
    },
  ],
  pessoal: [],
  trabalho: [],
};

const configPomodoroInicial: ConfigPomodoro = {
  duracaoFocoMin: 25,
  duracaoPausaCurtaMin: 5,
  duracaoPausaLongaMin: 15,
  ciclosAtePausaLonga: 4,
};

export function obterDadosIniciais(): DadosApp {
  return JSON.parse(JSON.stringify({
    categorias: categoriasIniciais,
    tarefas: tarefasIniciais,
    tarefasConcluidas: [],
    progresso: {
      streakAtual: 0,
      maiorStreak: 0,
      totalTarefasConcluidas: 0,
      tarefasConcluidasPorCategoria: {},
      ultimaTarefaConcluida: undefined,
      totalPomodorosFocoCompletos: 0,
      totalSubTarefasConcluidas: 0,
    },
    configPomodoro: configPomodoroInicial,
  }));
}