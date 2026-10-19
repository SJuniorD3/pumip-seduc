-- ==============================================================================
-- PUMIP-SEDUC: Migração 002 - Procedimento Transacional de Sincronização Atômica
-- REMEDIAÇÃO DE AUDITORIA (P1-2): Gravação Atômica de Histórico e Atualização do Processo
-- Evita estados inconsistentes caso uma etapa falhe após a outra
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.registrar_andamento_sincronizacao(
    p_processo_id UUID,
    p_origem public.origem_sistema,
    p_data_hora_evento TIMESTAMPTZ,
    p_unidade_setor TEXT,
    p_descricao_andamento TEXT,
    p_documento_anexado TEXT,
    p_tipo_documento TEXT,
    p_resumo_ia TEXT,
    p_hash_evento TEXT,
    p_metadados JSONB,
    p_nova_unidade_sei TEXT,
    p_proxima_verificacao TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Inserção na Linha do Tempo (Historico) com idempotência garantida
    INSERT INTO public.historico_tramitacoes (
        processo_id,
        origem_sistema,
        data_hora_evento,
        unidade_setor,
        descricao_andamento,
        documento_anexado,
        tipo_documento,
        resumo_ia,
        hash_evento,
        metadados
    ) VALUES (
        p_processo_id,
        p_origem,
        p_data_hora_evento,
        COALESCE(p_unidade_setor, 'NÃO INFORMADO'),
        p_descricao_andamento,
        p_documento_anexado,
        p_tipo_documento,
        p_resumo_ia,
        p_hash_evento,
        COALESCE(p_metadados, '{}'::jsonb)
    )
    ON CONFLICT (processo_id, hash_evento) DO NOTHING;

    -- 2. Atualização Atômica do Estado do Processo na mesma transação
    UPDATE public.processos
    SET
        hash_ultimo_estado = p_hash_evento,
        unidade_atual_sei = CASE 
            WHEN p_nova_unidade_sei IS NOT NULL AND p_nova_unidade_sei <> '' THEN p_nova_unidade_sei 
            ELSE unidade_atual_sei 
        END,
        dias_parado_na_unidade = 0,
        ultima_movimentacao_em = timezone('utc', now()),
        ultima_verificacao_em = timezone('utc', now()),
        proxima_verificacao_em = p_proxima_verificacao,
        updated_at = timezone('utc', now())
    WHERE id = p_processo_id;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Falha na gravação atômica de sincronização: %', SQLERRM;
    RAISE;
END;
$$;

-- Permite execução apenas pelo papel de serviço (worker) e administradores autenticados
REVOKE ALL ON FUNCTION public.registrar_andamento_sincronizacao FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_andamento_sincronizacao TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_andamento_sincronizacao TO authenticated;
