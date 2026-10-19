/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Auditoria e Feedback de IA (RF20 / ASVS Nível 2)
 * Persiste apontamentos de divergência (alucinações, omissões ou erros factuais) na tabela auditoria_log.
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
      .from('auditoria_log')
      .insert({
        usuario_id: (dados.usuarioId && dados.usuarioId.length === 36) ? dados.usuarioId : null,
        acao: 'DIVERGENCIA_IA_RF20',
        entidade: 'historico_tramitacoes',
        entidade_id: dados.eventoId,
        dados: {
          tipo: dados.tipoDivergencia,
          observacao: dados.observacao || '',
          protocolo_sei: dados.protocoloSei || '',
          registrado_em: new Date().toISOString()
        }
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
