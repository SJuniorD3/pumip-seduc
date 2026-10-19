/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Gestão Administrativa e Governança (FE-01)
 * Centraliza persistência de perfis, concessões pontuais e organograma com fallback de contingência.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import { UserRole } from '../types';

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cargo_titulo: string;
  unidadeSigla: string;
  unidadeNome?: string;
  ativo: boolean;
}

export interface ConcessaoAdmin {
  id: string;
  processoId: string;
  protocoloSei: string;
  objeto: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  motivo: string;
  dataConcessao: string;
  dataValidade?: string;
  ativo: boolean;
}

export interface UnidadeAdmin {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  caminho_hierarquico: string;
  titular_nome?: string;
  ativo: boolean;
}

export async function listarUsuariosBanco(): Promise<UsuarioAdmin[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('perfis_usuarios')
      .select('*, unidade:unidades_organizacionais(sigla, nome)')
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Erro ao consultar perfis de usuários no Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role as UserRole,
      cargo_titulo: row.cargo_titulo || 'Servidor Público',
      unidadeSigla: row.unidade?.sigla || 'SEDUC',
      unidadeNome: row.unidade?.nome,
      ativo: row.ativo
    }));
  } catch (err) {
    console.warn('Falha inesperada ao consultar usuários:', err);
    return [];
  }
}

export async function atualizarUsuarioBanco(
  id: string,
  updates: { role?: UserRole; cargo_titulo?: string; ativo?: boolean }
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('perfis_usuarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

export async function listarConcessoesBanco(): Promise<ConcessaoAdmin[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('processos_acessos_concedidos')
      .select('*, processo:processos(protocolo_sei, objeto), usuario:perfis_usuarios(nome, email)')
      .order('data_inicio', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar concessões no Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      processoId: row.processo_id,
      protocoloSei: row.processo?.protocolo_sei || 'N/A',
      objeto: row.processo?.objeto || 'Processo Administrativo',
      usuarioId: row.usuario_id,
      usuarioNome: row.usuario?.nome || 'Servidor',
      usuarioEmail: row.usuario?.email || '',
      motivo: row.motivo,
      dataConcessao: new Date(row.data_inicio).toLocaleDateString('pt-BR'),
      dataValidade: row.data_fim ? new Date(row.data_fim).toLocaleDateString('pt-BR') : undefined,
      ativo: row.ativo
    }));
  } catch (err) {
    console.warn('Falha inesperada ao consultar concessões:', err);
    return [];
  }
}

export async function criarConcessaoBanco(dados: {
  processo_id: string;
  usuario_id: string;
  concedido_por_id?: string;
  motivo: string;
  data_fim?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('processos_acessos_concedidos')
      .insert({
        processo_id: dados.processo_id,
        usuario_id: dados.usuario_id,
        concedido_por_id: dados.concedido_por_id || null,
        motivo: dados.motivo,
        data_inicio: new Date().toISOString(),
        data_fim: dados.data_fim || null,
        ativo: true
      });

    return !error;
  } catch {
    return false;
  }
}

export async function revogarConcessaoBanco(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('processos_acessos_concedidos')
      .update({ ativo: false })
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

export async function listarUnidadesBanco(): Promise<UnidadeAdmin[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('unidades_organizacionais')
      .select('*')
      .order('caminho_hierarquico', { ascending: true });

    if (error) {
      console.warn('Erro ao consultar organograma no Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      sigla: row.sigla,
      tipo: row.tipo,
      caminho_hierarquico: row.caminho_hierarquico,
      titular_nome: row.titular_nome,
      ativo: row.ativo
    }));
  } catch (err) {
    console.warn('Falha inesperada ao consultar organograma:', err);
    return [];
  }
}
