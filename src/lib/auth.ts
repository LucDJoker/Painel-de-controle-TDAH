// Sistema de autenticação simples
import { inicializarDadosParaUsuario } from './armazenamento';
import { mapNickToEmail, supabaseClient, supabaseEnabled, toLocalNameFromNick } from './supabase';
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


function salvarSessaoLocal(usuario: SessaoUsuario): void {
  localStorage.setItem(STORAGE_SESSAO, JSON.stringify(usuario));
}

function converterUsuarioSupabaseParaSessao(
  id: string,
  email: string | undefined,
  nick: string,
  nome?: string,
): SessaoUsuario {
  return {
    id,
    nome: nome || toLocalNameFromNick(nick) || email || nick,
    nick,
  };
}

export const authService = {
  // Registrar novo usuário
  async registrar(nome: string, nick: string, senha: string): Promise<{ sucesso: boolean; erro?: string }> {
    if (typeof window === 'undefined') return { sucesso: false, erro: 'Ambiente não suportado' };

    if (supabaseEnabled && supabaseClient) {
      const email = mapNickToEmail(nick);
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            nick,
          },
        },
      });

      if (error) {
        return { sucesso: false, erro: error.message };
      }

      const usuarioSupabase = data.user ?? data.session?.user;
      if (usuarioSupabase) {
        const sessao = converterUsuarioSupabaseParaSessao(
          usuarioSupabase.id,
          usuarioSupabase.email,
          nick,
          nome,
        );
        salvarSessaoLocal(sessao);
        try { inicializarDadosParaUsuario(sessao.id); } catch {}
      }

      return { sucesso: true };
    }

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
  async login(nick: string, senha: string): Promise<{ sucesso: boolean; usuario?: SessaoUsuario; erro?: string }> {
    if (typeof window === 'undefined') return { sucesso: false, erro: 'Ambiente não suportado' };

    if (supabaseEnabled && supabaseClient) {
      const email = mapNickToEmail(nick);
      let resultado = await supabaseClient.auth.signInWithPassword({
        email,
        password: senha,
      });



      if (resultado.error || !resultado.data.user) {
        return { sucesso: false, erro: resultado.error?.message || 'Nick ou senha incorretos' };
      }

      const usuarioSupabase = resultado.data.user;
      const apelido = (usuarioSupabase.user_metadata?.nick as string | undefined) || nick;
      const nome = (usuarioSupabase.user_metadata?.nome as string | undefined) || apelido;
      const sessao = converterUsuarioSupabaseParaSessao(
        usuarioSupabase.id,
        usuarioSupabase.email,
        apelido,
        nome,
      );

      salvarSessaoLocal(sessao);


      return { sucesso: true, usuario: sessao };
    }

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

    salvarSessaoLocal(sessao);
    return { sucesso: true, usuario: sessao };
  },

  // Logout
  logout(): void {
    localStorage.removeItem(STORAGE_SESSAO);
    if (supabaseEnabled && supabaseClient) {
      void supabaseClient.auth.signOut();
    }
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
      return Array.isArray(listaUsuarios) ? listaUsuarios : [];
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