// src/lib/dados-iniciais.ts
import type { DadosApp, Categoria, Tarefa, ConfigPomodoro } from './types';

const categoriasIniciais: Record<string, Categoria> = {
  pessoal: { id: 'pessoal', nome: 'Pessoal', emoji: '😊', cor: '#4299E1' },
  trabalho: { id: 'trabalho', nome: 'Trabalho', emoji: '💼', cor: '#9F7AEA' },
  estudos: { id: 'estudos', nome: 'Estudos', emoji: '📚', cor: '#ED8936' },
  casa: { id: 'casa', nome: 'Casa', emoji: '🏠', cor: '#48BB78' },
};

const tarefasIniciais: Record<string, Tarefa[]> = {
  estudos: [
    { id: `tarefa_estudos_1_${Date.now()}`, texto: 'Revisar aula de Algoritmos', categoriaId: 'estudos', criadaEm: new Date(), completada: false, alarme: undefined },
    { id: `tarefa_estudos_2_${Date.now() + 1}`, texto: 'Começar projeto de React', categoriaId: 'estudos', criadaEm: new Date(), completada: false, alarme: undefined },
  ],
  casa: [
    { id: `tarefa_casa_1_${Date.now() + 2}`, texto: 'Limpar a cozinha', categoriaId: 'casa', criadaEm: new Date(), completada: false, alarme: undefined },
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
      totalPomodorosFocoCompletos: 0, // Adicionado e inicializado
    },
    configPomodoro: configPomodoroInicial,
  }));
}