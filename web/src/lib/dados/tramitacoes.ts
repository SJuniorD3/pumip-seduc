/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Linha do Tempo e Tramitações
 * Realiza a leitura cronológica das movimentações registradas na tabela historico_tramitacoes.
 */
import { supabase, isSupabaseConfigured } from '../supabase';
import { HistoricoTramitacao } from '../types';

export async function listarTramitacoesBanco(processoId: string): Promise<HistoricoTramitacao[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('historico_tramitacoes')
      .select('*')
      .eq('processo_id', processoId)
      .order('data_hora_evento', { ascending: true });

    if (error) {
      console.warn('Erro ao listar tramitações do Supabase:', error.message);
      return [];
    }

    return (data || []) as HistoricoTramitacao[];
  } catch (err) {
    console.error('Falha ao consultar histórico de tramitações:', err);
    return [];
  }
}
