'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';

interface AuthFormProps {
  onLogin: () => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nome, setNome] = useState('');
  const [nick, setNick] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    if (modo === 'registro') {
      const resultado = authService.registrar(nome, nick, senha);
      if (resultado.sucesso) {
        toast.success('Usuário criado!');
        setModo('login');
      } else {
        toast.error(resultado.erro || 'Erro');
      }
    } else {
      const resultado = authService.login(nick, senha);
      if (resultado.sucesso) {
        toast.success('Login realizado!');
        onLogin();
      } else {
        toast.error(resultado.erro || 'Erro no login');
      }
    }
    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Focus ERP
          </CardTitle>
          <p className="text-muted-foreground">
            {modo === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'registro' && (
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="nick">Nick</Label>
              <Input
                id="nick"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Seu nick"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={carregando}
            >
              {carregando ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              className="text-sm text-primary hover:underline"
            >
              {modo === 'login' 
                ? 'Não tem conta? Criar uma' 
                : 'Já tem conta? Fazer login'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}