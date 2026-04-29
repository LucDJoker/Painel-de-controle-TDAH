import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseClient = supabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export function mapNickToEmail(nick: string): string {
  return `${nick.trim().toLowerCase()}@organizamente.local`;
}

export function toLocalNameFromNick(nick: string): string {
  if (!nick.trim()) return 'Usuário';
  return nick.trim();
}