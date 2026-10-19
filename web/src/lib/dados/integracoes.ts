/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Configurações e Telemetria de Integrações
 * Lê status dos conectores da visão status_integracoes e parâmetros de configuracoes_integracao.
 */
import { supabase, isSupabaseConfigured } from '../supabase';

export interface StatusIntegracao {
  sistema: 'SEI' | 'STARTGOV' | 'PNCP';
  ultimo_status: string;
  falhas_consecutivas: number;
  ultima_tentativa_em: string;
  ultimo_sucesso_em: string | null;
}

export async function listarStatusIntegracoesBanco(): Promise<StatusIntegracao[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        sistema: 'SEI',
        ultimo_status: 'AGUARDANDO_INTEGRACAO',
        falhas_consecutivas: 0,
        ultima_tentativa_em: new Date().toISOString(),
        ultimo_sucesso_em: null
      },
      {
        sistema: 'STARTGOV',
        ultimo_status: 'AGUARDANDO_INTEGRACAO',
        falhas_consecutivas: 0,
        ultima_tentativa_em: new Date().toISOString(),
        ultimo_sucesso_em: null
      },
      {
        sistema: 'PNCP',
        ultimo_status: 'DISPONIVEL',
        falhas_consecutivas: 0,
        ultima_tentativa_em: new Date().toISOString(),
        ultimo_sucesso_em: new Date().toISOString()
      }
    ];
  }

  try {
    const { data, error } = await supabase
      .from('status_integracoes')
      .select('*');

    if (error || !data || data.length === 0) {
      return [];
    }

    return data as StatusIntegracao[];
  } catch (err) {
    console.error('Falha ao consultar status das integrações:', err);
    return [];
  }
}

export async function salvarConfiguracaoIntegracaoBanco(
  chave: string,
  valor: Record<string, unknown>
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('configuracoes_integracao')
      .upsert({
        chave,
        valor,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Erro ao salvar configuração no banco:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Falha ao persistir configuração de integração:', err);
    return false;
  }
}
