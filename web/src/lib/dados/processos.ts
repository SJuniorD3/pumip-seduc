/**
 * PUMIP-SEDUC: Camada de Acesso a Dados (Data Access Layer - FE-01)
 * Centraliza consultas ao banco de dados com paginação, tipagem e isolamento de erros.
 */

import { supabase, isSupabaseConfigured, DEFAULT_PAGE_SIZE, getPaginationRange } from '../supabase';
import { Processo } from '../types';

export async function listarProcessosBanco(
  pagina = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ processos: Processo[]; total?: number }> {
  if (!isSupabaseConfigured()) {
    return { processos: [] };
  }

  const { from, to } = getPaginationRange(pagina, pageSize);
  const { data, error, count } = await supabase
    .from('processos')
    .select('*, unidade_origem:unidades_organizacionais(*)', { count: 'exact' })
    .order('ultima_movimentacao_em', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Erro na consulta de processos no Supabase:', error.message);
    throw new Error(`Falha ao consultar processos: ${error.message}`);
  }

  return {
    processos: (data || []) as Processo[],
    total: count ?? 0
  };
}

export async function obterProcessoPorIdBanco(processoId: string): Promise<Processo | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('processos')
    .select('*, unidade_origem:unidades_organizacionais(*)')
    .eq('id', processoId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Processo;
}
