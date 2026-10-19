/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Alertas Configurados (BD-06 / FE-01)
 * Gerencia persistência de regras de monitoramento com fallback para dados locais em ambiente de homologação.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

export interface AlertaConfigurado {
  id: string;
  usuario_id?: string;
  processo_id?: string | null;
  unidade_id?: string | null;
  tipo: 'MUDANCA_SETOR_FASE' | 'PALAVRA_CHAVE' | 'INERCIA_DIAS' | 'VIGENCIA_CONTRATO' | 'PUBLICACAO_PNCP';
  parametros?: Record<string, unknown>;
  notificar_email: boolean;
  notificar_sistema: boolean;
  ativo: boolean;
  created_at?: string;
  // Campos formatados para visualização na UI
  descricao_legivel?: string;
  processo_protocolo?: string;
}

export async function listarAlertasBanco(usuarioId?: string): Promise<AlertaConfigurado[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase
      .from('alertas_configurados')
      .select('*, processo:processos(protocolo_sei, objeto)')
      .order('created_at', { ascending: false });

    if (usuarioId && usuarioId.length === 36) { // Formato UUID
      query = query.eq('usuario_id', usuarioId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Erro ao consultar alertas no Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      usuario_id: row.usuario_id,
      processo_id: row.processo_id,
      unidade_id: row.unidade_id,
      tipo: row.tipo,
      parametros: row.parametros,
      notificar_email: row.notificar_email,
      notificar_sistema: row.notificar_sistema,
      ativo: row.ativo,
      created_at: row.created_at,
      descricao_legivel: formatarDescricaoAlerta(row.tipo, row.parametros),
      processo_protocolo: row.processo?.protocolo_sei || 'Todos da unidade'
    }));
  } catch (err) {
    console.warn('Falha inesperada ao consultar alertas:', err);
    return [];
  }
}

export async function criarAlertaBanco(alerta: {
  usuario_id: string;
  processo_id?: string | null;
  tipo: 'MUDANCA_SETOR_FASE' | 'PALAVRA_CHAVE' | 'INERCIA_DIAS' | 'VIGENCIA_CONTRATO' | 'PUBLICACAO_PNCP';
  parametros: Record<string, unknown>;
  notificar_email: boolean;
  notificar_sistema?: boolean;
}): Promise<AlertaConfigurado | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('alertas_configurados')
      .insert({
        usuario_id: alerta.usuario_id,
        processo_id: alerta.processo_id || null,
        tipo: alerta.tipo,
        parametros: alerta.parametros,
        notificar_email: alerta.notificar_email,
        notificar_sistema: alerta.notificar_sistema ?? true,
        ativo: true
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('Erro ao criar alerta no Supabase:', error?.message);
      return null;
    }

    return {
      ...data,
      descricao_legivel: formatarDescricaoAlerta(data.tipo, data.parametros)
    };
  } catch (err) {
    console.warn('Falha ao inserir alerta no Supabase:', err);
    return null;
  }
}

export async function alternarStatusAlertaBanco(alertaId: string, novoStatus: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('alertas_configurados')
      .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', alertaId);

    return !error;
  } catch {
    return false;
  }
}

export async function removerAlertaBanco(alertaId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('alertas_configurados')
      .delete()
      .eq('id', alertaId);

    return !error;
  } catch {
    return false;
  }
}

function formatarDescricaoAlerta(tipo: string, parametros?: Record<string, unknown>): string {
  switch (tipo) {
    case 'INERCIA_DIAS':
      return `Alerta se parado por mais de ${parametros?.dias || 5} dias úteis sem movimentação`;
    case 'PALAVRA_CHAVE':
      return `Gatilho monitorando anexação de documentos contendo: "${parametros?.palavras_chave || 'parecer'}"`;
    case 'VIGENCIA_CONTRATO':
      return `Alerta de vencimento da contratação pública (${parametros?.dias_antecedencia || 90} dias antes)`;
    case 'PUBLICACAO_PNCP':
      return 'Vigilância de publicidade no Portal Nacional de Contratações Públicas (Art. 94 Lei 14.133/2021)';
    case 'MUDANCA_SETOR_FASE':
      return `Notificar ao tramitar para a fase/setor: "${parametros?.setor_destino || 'Gabinete'}"`;
    default:
      return 'Regra de monitoramento automático';
  }
}
