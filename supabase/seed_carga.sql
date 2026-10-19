-- ==============================================================================
-- PUMIP-SEDUC: Script de Carga Sintética para Benchmarks de Banco (10.000 Processos)
-- Uso: psql -f supabase/seed_carga.sql (ou via CI / testes de carga)
-- NÃO deve ser executado no seed de produção.
-- ==============================================================================

DO $$
DECLARE
    v_unidades UUID[];
    v_total_inseridos INT;
    v_inicio TIMESTAMPTZ;
    v_fim TIMESTAMPTZ;
BEGIN
    SELECT array_agg(id) INTO v_unidades
    FROM public.unidades_organizacionais
    WHERE ativo = TRUE;

    IF array_length(v_unidades, 1) IS NULL OR array_length(v_unidades, 1) = 0 THEN
        RAISE EXCEPTION 'Execute o seed.sql padrão antes de executar a carga sintética.';
    END IF;

    RAISE NOTICE 'Iniciando geração de 10.000 processos sintéticos para teste de carga...';
    v_inicio := clock_timestamp();

    INSERT INTO public.processos (
        id,
        protocolo_sei,
        protocolo_startgov,
        numero_contrato_pncp,
        objeto,
        unidade_origem_id,
        unidade_atual_sei,
        fase_atual_startgov,
        status_etapa,
        prioridade,
        dias_parado_na_unidade,
        hash_ultimo_estado,
        ultima_movimentacao_em,
        ultima_verificacao_em,
        proxima_verificacao_em,
        created_at,
        updated_at
    )
    SELECT
        gen_random_uuid(),
        'SEI-021001/' || lpad((s + 10000)::text, 6, '0') || '/2026',
        CASE WHEN s % 3 = 0 THEN 'STARTGOV-2026/' || lpad(s::text, 4, '0') ELSE NULL END,
        CASE WHEN s % 5 = 0 THEN '06354468000130-1-' || lpad(s::text, 6, '0') || '/2026' ELSE NULL END,
        'Demanda sintética para benchmark de carga e volumetria #' || s,
        v_unidades[1 + (s % array_length(v_unidades, 1))],
        (ARRAY['SUDES', 'STI', 'SUPREDES', 'SUINFRA', 'ASJUR', 'SAAD', 'SAOFC', 'GAB', 'CSL', 'E-OUV'])[1 + (s % 10)],
        CASE WHEN s % 3 = 0 THEN 'FASE_COTACAO' ELSE NULL END,
        (ARRAY['FASE_INTERNA_SEI', 'INSTRUCAO_TR', 'ANALISE_JURIDICA', 'PUBLICACAO_EDITAL', 'HOMOLOGADO', 'CONTRATO_VIGENTE', 'ARQUIVADO'])[1 + (s % 7)]::public.status_etapa_processual,
        (ARRAY['QUENTE', 'MORNO', 'FRIO'])[1 + (s % 3)]::public.processo_prioridade,
        (s % 45),
        md5('estado_sintetico_' || s),
        timezone('utc', now() - ((s % 60) || ' days')::interval),
        timezone('utc', now() - ((s % 24) || ' hours')::interval),
        timezone('utc', now() + ((s % 12) || ' hours')::interval),
        timezone('utc', now() - ((s % 90) || ' days')::interval),
        timezone('utc', now() - ((s % 30) || ' days')::interval)
    FROM generate_series(1, 10000) AS s
    ON CONFLICT (protocolo_sei) DO NOTHING;

    GET DIAGNOSTICS v_total_inseridos = ROW_COUNT;
    v_fim := clock_timestamp();

    RAISE NOTICE 'Concluído: % processos inseridos em % ms.', v_total_inseridos, round(EXTRACT(EPOCH FROM (v_fim - v_inicio)) * 1000);

    -- Atualiza estatísticas do otimizador PostgreSQL
    ANALYZE public.processos;
END $$;
