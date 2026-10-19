/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Auditoria e Feedback de IA (RF20 / ASVS Nível 2)
 * Persiste apontamentos de divergência na tabela dedicada apontamentos_ia com RLS (Achado N-13).
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export interface ApontamentoDivergenciaIA {
  eventoId: string;
  protocoloSei?: string;
  tipoDivergencia: string;
  observacao?: string;
  usuarioId?: string;
}

export async function registrarDivergenciaIABanco(dados: ApontamentoDivergenciaIA): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true; // Sucesso com persistência local em ambiente de desenvolvimento
  }

  try {
    const { error } = await supabase
      .from('apontamentos_ia')
      .insert({
        usuario_id: (dados.usuarioId && dados.usuarioId.length === 36) ? dados.usuarioId : null,
        evento_id: dados.eventoId,
        tipo: dados.tipoDivergencia,
        observacao: dados.observacao || '',
        protocolo_sei: dados.protocoloSei || ''
      });

    if (error) {
      console.warn('Erro ao registrar divergência de IA no Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Falha ao persistir apontamento de IA:', err);
    return false;
  }
}
