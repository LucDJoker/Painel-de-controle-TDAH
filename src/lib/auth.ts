// Sistema de autenticação simples
import { inicializarDadosParaUsuario } from './armazenamento';
export interface Usuario {
  id: string;
  nome: string;
  nick: string;
  senha: string;
  criadoEm: string;
}

export interface SessaoUsuario {
  id: string;
  nome: string;
  nick: string;
}

const STORAGE_USUARIOS = 'focus_erp_usuarios';
const STORAGE_SESSAO = 'focus_erp_sessao';

export const authService = {
  // Registrar novo usuário
  registrar(nome: string, nick: string, senha: string): { sucesso: boolean; erro?: string } {
    if (typeof window === 'undefined') return { sucesso: false, erro: 'Ambiente não suportado' };
    
    const usuarios = this.obterUsuarios();
    
    if (usuarios.find(u => u.nick === nick)) {
      return { sucesso: false, erro: 'Nick já está em uso' };
    }

    const novoUsuario: Usuario = {
      id: `user_${Date.now()}`,
      nome,
      nick,
      senha,
      criadoEm: new Date().toISOString()
    };

    usuarios.push(novoUsuario);
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));

    // Inicializa dados zerados para o novo usuário
    try { inicializarDadosParaUsuario(novoUsuario.id); } catch {}
    
    return { sucesso: true };
  },

  // Login
  login(nick: string, senha: string): { sucesso: boolean; usuario?: SessaoUsuario; erro?: string } {
    if (typeof window === 'undefined') return { sucesso: false, erro: 'Ambiente não suportado' };
    
    const usuarios = this.obterUsuarios();
    const usuario = usuarios.find(u => u.nick === nick && u.senha === senha);
    
    if (!usuario) {
      return { sucesso: false, erro: 'Nick ou senha incorretos' };
    }

    const sessao: SessaoUsuario = {
      id: usuario.id,
      nome: usuario.nome,
      nick: usuario.nick
    };

    localStorage.setItem(STORAGE_SESSAO, JSON.stringify(sessao));
    return { sucesso: true, usuario: sessao };
  },

  // Logout
  logout(): void {
    localStorage.removeItem(STORAGE_SESSAO);
  },

  // Obter usuário logado
  obterUsuarioLogado(): SessaoUsuario | null {
    if (typeof window === 'undefined') return null;
    try {
      const sessao = localStorage.getItem(STORAGE_SESSAO);
      const usuario = sessao ? JSON.parse(sessao) : null;
      console.log('Usuário da sessão:', usuario); // Debug
      return usuario;
    } catch {
      return null;
    }
  },

  // Verificar se está logado
  estaLogado(): boolean {
    if (typeof window === 'undefined') return false;
    const logado = this.obterUsuarioLogado() !== null;
    console.log('Está logado?', logado); // Debug
    return logado;
  },

  // Obter todos os usuários
  obterUsuarios(): Usuario[] {
    if (typeof window === 'undefined') return [];
    try {
      const usuarios = localStorage.getItem(STORAGE_USUARIOS);
      const listaUsuarios = usuarios ? JSON.parse(usuarios) : [];
      return listaUsuarios;
    } catch {
      return [];
    }
  }
};

// Função para obter chave de dados específica do usuário
export function obterChaveDadosUsuario(chave: string): string {
  const usuario = authService.obterUsuarioLogado();
  return usuario ? `${chave}_${usuario.id}` : chave;
}