-- ==============================================================================
-- PUMIP-SEDUC: Migração 003 - Fechamento de Segurança da RPC e Propagação Hierárquica
-- Remediações do Relatório Técnico de Auditoria (Out/2026):
-- - SEG-01: Fechamento de RPC aberta a authenticated/anon; redefinição para SECURITY INVOKER
-- - WRK-03: Retorno booleano real (TRUE só se inseriu novo andamento; não reseta inércia se repetido)
-- - SEG-06: Fixação de search_path='' e restrição de privilégios em get_user_context()
-- - BD-01: Gatilho de propagação em cascata de caminho_hierarquico para unidades filhas
-- - BD-05: Padronização de defaults para now() em colunas TIMESTAMPTZ
-- ==============================================================================

-- 1. Redefinição Segura da Função de Sincronização Atômica (SEG-01 / WRK-03)
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
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_inserido BOOLEAN := FALSE;
BEGIN
    -- 1.1 Inserção idempotente com verificação se houve nova linha
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
    ON CONFLICT (processo_id, hash_evento) DO NOTHING
    RETURNING TRUE INTO v_inserido;

    -- 1.2 Se o andamento já existia (v_inserido é NULL/FALSE):
    -- Apenas atualiza telemetria de verificação e reagendamento, SEM zerar inércia nem alterar unidade
    IF v_inserido IS NULL OR NOT v_inserido THEN
        UPDATE public.processos
        SET
            ultima_verificacao_em = pg_catalog.now(),
            proxima_verificacao_em = p_proxima_verificacao,
            updated_at = pg_catalog.now()
        WHERE id = p_processo_id;

        RETURN FALSE;
    END IF;

    -- 1.3 Se foi um andamento NOVO:
    -- Atualiza estado do processo, data real do evento e zera inércia
    UPDATE public.processos
    SET
        hash_ultimo_estado = p_hash_evento,
        unidade_atual_sei = CASE 
            WHEN p_nova_unidade_sei IS NOT NULL AND p_nova_unidade_sei <> '' THEN p_nova_unidade_sei 
            ELSE unidade_atual_sei 
        END,
        dias_parado_na_unidade = 0,
        ultima_movimentacao_em = GREATEST(COALESCE(ultima_movimentacao_em, p_data_hora_evento), p_data_hora_evento),
        ultima_verificacao_em = pg_catalog.now(),
        proxima_verificacao_em = p_proxima_verificacao,
        updated_at = pg_catalog.now()
    WHERE id = p_processo_id;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Falha na gravação de andamento de sincronização: %', SQLERRM;
    RAISE;
END;
$$;

-- 2. Restrição Estrita de Privilégios (SEG-01)
REVOKE ALL ON FUNCTION public.registrar_andamento_sincronizacao(
    UUID, public.origem_sistema, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.registrar_andamento_sincronizacao(
    UUID, public.origem_sistema, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ
) TO service_role;

-- Impede que futuras funções públicas fiquem executáveis por anon e authenticated por padrão
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;


-- 3. Blindagem de get_user_context (SEG-06)
ALTER FUNCTION public.get_user_context()
    SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_user_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_context() TO authenticated, service_role;


-- 4. Propagação em Cascata do Caminho Hierárquico das Unidades (BD-01)
CREATE OR REPLACE FUNCTION public.propagar_caminho_hierarquico()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NULL;
    END IF;

    IF NEW.caminho_hierarquico IS DISTINCT FROM OLD.caminho_hierarquico THEN
        UPDATE public.unidades_organizacionais
        SET caminho_hierarquico = NEW.caminho_hierarquico
                                  || pg_catalog.substr(caminho_hierarquico, pg_catalog.length(OLD.caminho_hierarquico) + 1)
        WHERE pg_catalog.left(caminho_hierarquico, pg_catalog.length(OLD.caminho_hierarquico) + 1) = OLD.caminho_hierarquico || '.';
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_unidades_caminho_propaga ON public.unidades_organizacionais;
CREATE TRIGGER trg_unidades_caminho_propaga
AFTER UPDATE OF caminho_hierarquico ON public.unidades_organizacionais
FOR EACH ROW EXECUTE FUNCTION public.propagar_caminho_hierarquico();


-- 5. Padronização de Colunas com DEFAULT now() (BD-05)
ALTER TABLE public.processos 
    ALTER COLUMN data_autuacao SET DEFAULT pg_catalog.now(),
    ALTER COLUMN ultima_movimentacao_em SET DEFAULT pg_catalog.now(),
    ALTER COLUMN ultima_verificacao_em SET DEFAULT pg_catalog.now(),
    ALTER COLUMN created_at SET DEFAULT pg_catalog.now(),
    ALTER COLUMN updated_at SET DEFAULT pg_catalog.now();

ALTER TABLE public.historico_tramitacoes
    ALTER COLUMN data_hora_evento SET DEFAULT pg_catalog.now(),
    ALTER COLUMN data_coleta SET DEFAULT pg_catalog.now(),
    ALTER COLUMN created_at SET DEFAULT pg_catalog.now();
