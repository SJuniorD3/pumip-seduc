/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Vínculos SEI <-> StartGov (RF16 / FE-01)
 * Gerencia a correlação entre demandas internas do SEI e certames licitatórios do StartGov.
 * Ao confirmar um vínculo, atualiza o processo no Supabase e agenda verificação prioritária pelo worker.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export async function confirmarVinculoBanco(
  processoId: string,
  protocoloStartGov: string,
  modalidade?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('processos')
      .update({
        protocolo_startgov: protocoloStartGov.trim().toUpperCase(),
        fase_atual_startgov: modalidade || 'Licitação em Andamento (StartGov)',
        proxima_verificacao_em: new Date().toISOString(),
        prioridade: 'QUENTE',
        updated_at: new Date().toISOString()
      })
      .eq('id', processoId);

    if (error) {
      console.warn('Erro ao confirmar vínculo no Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Falha ao confirmar vínculo institucional:', err);
    return false;
  }
}

export async function rejeitarVinculoBanco(processoId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('processos')
      .update({
        protocolo_startgov: null,
        fase_atual_startgov: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', processoId);

    return !error;
  } catch {
    return false;
  }
}
