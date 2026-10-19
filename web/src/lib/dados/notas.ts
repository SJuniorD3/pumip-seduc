/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Notas Internas (RF15 / BD-06)
 * Gerencia persistência de anotações internas com versionamento e integridade institucional.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export interface NotaInterna {
  id: string;
  processo_id: string;
  usuario_id: string;
  autor_nome: string;
  autor_sigla?: string;
  conteudo: string;
  versao: number;
  created_at: string;
}

export async function listarNotasProcessoBanco(processoId: string): Promise<NotaInterna[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('notas_internas')
      .select('*, usuario:perfis_usuarios(nome, cargo_titulo, unidade:unidades_organizacionais(sigla))')
      .eq('processo_id', processoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar notas internas no Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      processo_id: row.processo_id,
      usuario_id: row.usuario_id,
      autor_nome: row.usuario?.nome || 'Servidor SEDUC',
      autor_sigla: row.usuario?.unidade?.sigla || 'SEDUC',
      conteudo: row.conteudo,
      versao: row.versao || 1,
      created_at: row.created_at
    }));
  } catch (err) {
    console.warn('Falha inesperada ao consultar notas internas:', err);
    return [];
  }
}

export async function criarNotaProcessoBanco(nota: {
  processo_id: string;
  usuario_id: string;
  conteudo: string;
}): Promise<NotaInterna | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('notas_internas')
      .insert({
        processo_id: nota.processo_id,
        usuario_id: nota.usuario_id,
        conteudo: nota.conteudo,
        versao: 1
      })
      .select('*, usuario:perfis_usuarios(nome, unidade:unidades_organizacionais(sigla))')
      .single();

    if (error || !data) {
      console.warn('Erro ao salvar nota interna no Supabase:', error?.message);
      return null;
    }

    return {
      id: data.id,
      processo_id: data.processo_id,
      usuario_id: data.usuario_id,
      autor_nome: data.usuario?.nome || 'Servidor SEDUC',
      autor_sigla: data.usuario?.unidade?.sigla || 'SEDUC',
      conteudo: data.conteudo,
      versao: data.versao || 1,
      created_at: data.created_at
    };
  } catch (err) {
    console.warn('Falha inesperada ao registrar nota interna:', err);
    return null;
  }
}
